use ahash::AHashMap;
use anyhow::Result;
use aptos_indexer_processor_sdk::utils::errors::ProcessorError;
use diesel::{insert_into, QueryResult, update, ExpressionMethods, QueryDsl};
use diesel_async::{AsyncConnection, AsyncPgConnection, RunQueryDsl};

use crate::{
    db_models::stakings::{RewardClaimed, Staking, StakingRemoved},
    schema::stakings,
    utils::{
        database_connection::get_db_connection,
        database_utils::{get_config_table_chunk_size, ArcDbPool},
    },
};

async fn execute_position_created_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_insert: Vec<Staking>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            let create_position_query = insert_into(stakings::table)
                .values(items_to_insert.clone())
                .on_conflict(stakings::position_addr)
                .do_nothing();
            create_position_query.execute(conn).await?;
            Ok(())
        })
    })
    .await
}

pub async fn process_position_created_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<Staking>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Staking>("stakings", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing position created events");
                execute_position_created_events_sql(conn, items).await
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


async fn execute_position_removed_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_update: Vec<StakingRemoved>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            for position in items_to_update {
                let update_position_query = update(stakings::table.filter(stakings::position_addr.eq(position.position_addr)))
                    .set(stakings::is_removed.eq(true));
                update_position_query.execute(conn).await?;
            }
            Ok(())
        })
    })
    .await
}

pub async fn process_position_removed_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<StakingRemoved>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Staking>("stakings", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing position removed events");
                execute_position_removed_events_sql(conn, items).await
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



async fn execute_reward_claimed_events_sql(
    conn: &mut AsyncPgConnection,
    items_to_update: Vec<RewardClaimed>,
) -> QueryResult<()> {
    conn.transaction(|conn| {
        Box::pin(async move {
            for position in items_to_update {
                let update_position_query = update(stakings::table.filter(stakings::position_addr.eq(position.position_addr)))
                    .set(stakings::claimed.eq(stakings::claimed + position.amount));
                update_position_query.execute(conn).await?;
            }
            Ok(())
        })
    })
    .await
}

pub async fn process_reward_claimed_events(
    pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    create_events: Vec<RewardClaimed>,
) -> Result<(), ProcessorError> {
    let chunk_size =
        get_config_table_chunk_size::<Staking>("stakings", &per_table_chunk_sizes);
    let tasks = create_events
        .chunks(chunk_size)
        .map(|chunk| {
            let pool = pool.clone();
            let items = chunk.to_vec();
            tokio::spawn(async move {
                let conn = &mut get_db_connection(&pool)
                    .await
                    .expect("Failed to get connection from pool while processing position reward claimed events");
                execute_reward_claimed_events_sql(conn, items).await
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
