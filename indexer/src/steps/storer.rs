use ahash::AHashMap;
use anyhow::Result;
use aptos_indexer_processor_sdk::{
    traits::{async_step::AsyncRunType, AsyncStep, NamedStep, Processable},
    types::transaction_context::TransactionContext,
    utils::errors::ProcessorError,
};
use async_trait::async_trait;

use super::{
    extractor::{ContractEvent, ContractUpgradeChange, TransactionContextData},
    storers::{
        upgrade_module_change_storer::process_upgrade_module_changes,
        upgrade_package_change_storer::process_upgrade_package_changes,
    },
};
use crate::{
    steps::storers::{spin_events_storer::process_spin_events, staking_events_storer::{process_position_created_events, process_position_removed_events, process_reward_claimed_events}, token_events_storer::{process_pool_completed_events, process_token_created_events}, trade_events_storer::process_trade_created_events},
    utils::database_utils::ArcDbPool,
};

/// Storer is a step that inserts events in the database.
pub struct Storer
where
    Self: Sized + Send + 'static,
{
    pool: ArcDbPool,
}

impl AsyncStep for Storer {}

impl NamedStep for Storer {
    fn name(&self) -> String {
        "Storer".to_string()
    }
}

impl Storer {
    pub fn new(pool: ArcDbPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl Processable for Storer {
    type Input = TransactionContextData;
    type Output = TransactionContextData;
    type RunType = AsyncRunType;

    async fn process(
        &mut self,
        transaction_context_data: TransactionContext<TransactionContextData>,
    ) -> Result<Option<TransactionContext<TransactionContextData>>, ProcessorError> {
        let per_table_chunk_sizes: AHashMap<String, usize> = AHashMap::new();
        let data = transaction_context_data.data.clone();
        let (
            token_created_events,
            pool_completed_events,
            trade_created_events,
            position_created_events,
            position_claimed_events,
            position_removed_events,
            spin_events
        ) = data.events.into_iter().fold(
            (
                vec![],
                vec![],
                vec![],
                vec![],
                vec![],
                vec![],
                vec![]
            ),
            |(
                mut create_token_events,
                mut completed_events,
                mut create_trade_events,
                mut create_position_events,
                mut claim_position_events,
                mut remove_position_events,
                mut spin_event
            ),
             event| {
                match event {
                    ContractEvent::TokenCreatedEvent(data) => {
                        create_token_events.push(data);
                    },
                    ContractEvent::PoolCompletedEvent(data) => {
                        completed_events.push(data);
                    },
                    ContractEvent::TradeCreatedEvent(data) => {
                        create_trade_events.push(data);
                    },
                    ContractEvent::PositionCreated(data) => {
                        create_position_events.push(data);
                    },
                    ContractEvent::PositionRewardClaimed(data) => {
                        claim_position_events.push(data);
                    },
                    ContractEvent::PositionRemoved(data) => {
                        remove_position_events.push(data);
                    },
                    ContractEvent::SpinEvent(data) => {
                        spin_event.push(data);
                    }
                }
                (
                   create_token_events,
                   completed_events,
                   create_trade_events,
                   create_position_events,
                   claim_position_events,
                   remove_position_events,
                   spin_event
                )
            },
        );

        process_token_created_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            token_created_events,
        )
        .await?;

        process_pool_completed_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            pool_completed_events,
        )
        .await?;

        process_trade_created_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            trade_created_events,
        )
        .await?;

        process_position_created_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            position_created_events,
        )
        .await?;

        process_reward_claimed_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            position_claimed_events,
        )
        .await?;

        process_position_removed_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            position_removed_events,
        )
        .await?;

        process_spin_events(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            spin_events,
        )
        .await?;

        let (module_upgrades, package_upgrades) = data.changes.into_iter().fold(
            (vec![], vec![]),
            |(mut module_upgrades, mut package_upgrades), upgrade_change| {
                match upgrade_change {
                    ContractUpgradeChange::ModuleUpgradeChange(module_upgrade) => {
                        module_upgrades.push(module_upgrade);
                    }
                    ContractUpgradeChange::PackageUpgradeChange(package_upgrade) => {
                        package_upgrades.push(package_upgrade);
                    }
                }
                (module_upgrades, package_upgrades)
            },
        );

        process_upgrade_module_changes(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            module_upgrades,
        )
        .await?;

        process_upgrade_package_changes(
            self.pool.clone(),
            per_table_chunk_sizes.clone(),
            package_upgrades,
        )
        .await?;

        Ok(Some(transaction_context_data))
    }
}
