use ahash::AHashMap;
use anyhow::Result;
use aptos_indexer_processor_sdk::utils::errors::ProcessorError;
use diesel::{insert_into, QueryResult, ExpressionMethods, update, QueryDsl};
use diesel_async::{AsyncConnection, AsyncPgConnection, RunQueryDsl};
use crate::api_client::events;
use crate::{
    db_models::tokens::{PoolCompleted, Token},
    schema::tokens,
    utils::{
        database_connection::get_db_connection,
        database_utils::{get_config_table_chunk_size, ArcDbPool},
    },
};

async fn execute_token_created_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_insert: Vec<Token>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            let create_token_query = insert_into(tokens::table)
                .values(items_to_insert.clone())
                .on_conflict(tokens::pool_addr)
                .do_nothing();
            create_token_query.execute(conn).await?;
            Ok(())
        })
    })
    .await
}

pub async fn process_token_created_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<Token>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Token>("tokens", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing token created events");
                execute_token_created_events_sql(conn, items).await
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

    for item in create_events {
        events::emit_token_created(item.pre_addr).await.ok();
    }
    Ok(())
}


async fn execute_pool_completed_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_update: Vec<PoolCompleted>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            for token in items_to_update {
                let update_token_query = update(tokens::table.filter(tokens::main_addr.eq(token.main_addr)))
                    .set(tokens::is_completed.eq(true));
                update_token_query.execute(conn).await?;
            }
            Ok(())
        })
    })
    .await
}

pub async fn process_pool_completed_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<PoolCompleted>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Token>("tokens", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing pool completed events");
                execute_pool_completed_events_sql(conn, items).await
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

