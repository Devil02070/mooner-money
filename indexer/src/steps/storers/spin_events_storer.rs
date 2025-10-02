use ahash::AHashMap;
use anyhow::Result;
use aptos_indexer_processor_sdk::utils::errors::ProcessorError;
use diesel::{QueryResult, ExpressionMethods, update, QueryDsl};
use diesel_async::{AsyncConnection, AsyncPgConnection, RunQueryDsl};
use crate::api_client::events;
use crate::db_models::accounts::{Spin, Account};
use crate::schema::accounts;
use crate::{
    utils::{
        database_connection::get_db_connection,
        database_utils::{get_config_table_chunk_size, ArcDbPool},
    },
};

async fn execute_spin_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_update: Vec<Spin>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            for spin in items_to_update {
                if spin.win_type == 0 {
                    let update_account_query = update(accounts::table.filter(accounts::address.eq(spin.claimer.clone())))
                    .set((
                        accounts::xp.eq(accounts::xp + spin.amount.try_into().unwrap_or(0)),
                        accounts::xp_earned.eq(accounts::xp_earned + spin.amount.try_into().unwrap_or(0))
                    ));
                    update_account_query.execute(conn).await?;
                }
                events::emit_spin_win(spin).await.ok();
            }
            Ok(())
        })
    })
    .await
}

pub async fn process_spin_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<Spin>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Account>("accounts", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing spin events");
                execute_spin_events_sql(conn, items).await
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
    Ok(())
}

