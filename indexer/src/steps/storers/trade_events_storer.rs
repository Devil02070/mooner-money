use ahash::AHashMap;
use anyhow::Result;
use aptos_indexer_processor_sdk::utils::errors::ProcessorError;
use diesel::{insert_into, QueryResult};
use diesel_async::{AsyncConnection, AsyncPgConnection, RunQueryDsl};
use crate::api_client::events;
use crate::{
    db_models::trades::Trade,
    schema::trades,
    utils::{
        database_connection::get_db_connection,
        database_utils::{get_config_table_chunk_size, ArcDbPool},
    },
};

async fn execute_trade_created_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_insert: Vec<Trade>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            let create_trade_query = insert_into(trades::table)
                .values(items_to_insert.clone())
                .on_conflict(trades::txn_version)
                .do_nothing();
            create_trade_query.execute(conn).await?;
            Ok(())
        })
    })
    .await
}

pub async fn process_trade_created_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<Trade>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Trade>("trades", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing trade created events");
                execute_trade_created_events_sql(conn, items).await
            })
        })
        .collect::<Vec<_>>();

    let results = futures_util::future::try_join_all(tasks)
        .await
        .expect("Task panicked executing in chunks");
    for res in results {
        res.map_err(|e| {
            tracing::warn!("Error running query: {:?}", e);
            ProcessorError::ProcessError {
                message: e.to_string(),
            }
        })?;
    }
    for trade in create_events {
        events::emit_token_traded(trade.txn_version).await.ok();
    }
    Ok(())
}