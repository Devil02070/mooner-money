use crate::schema::stakings;
use aptos_indexer_processor_sdk::utils::convert::standardize_address;
use diesel::{AsChangeset, Insertable};
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = stakings)]
pub struct Staking {
    pub position_addr: String,
    pub stake_addr: String,
    pub user: String,
    pub amount: i64,
    pub unlock_ts: i64,
    pub txn_version: i64,
    pub is_removed: bool,
    pub claimed: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PositionCreatedOnChain {
    pub stake_addr: String,
    pub position_addr: String,
    pub user: String,
    pub amount: String,
    pub unlock_ts: String,
}

impl PositionCreatedOnChain {
    pub fn to_db_staking(&self, txn_version: i64) -> Staking {
        Staking {
            position_addr: standardize_address(&self.position_addr),
            user: standardize_address(&self.user),
            amount: self.amount.parse().unwrap(),
            unlock_ts: self.unlock_ts.parse().unwrap(),
            is_removed: false,
            claimed: 0,
            stake_addr: standardize_address(&self.stake_addr),
            txn_version,
        }
    }
}

#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = stakings)]
pub struct RewardClaimed {
    pub position_addr: String,
    pub amount: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RewardClaimedOnChain {
    pub position_addr: String,
    pub user: String,
    pub amount: String,
    pub ts: String,
}

impl RewardClaimedOnChain {
    pub fn to_db_reward_claimed(&self) -> RewardClaimed {
        RewardClaimed {
            position_addr: standardize_address(&self.position_addr),
            amount: self.amount.parse().unwrap()
        }
    }
}


#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = stakings)]
pub struct StakingRemoved {
    pub position_addr: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct StakingRemovedOnChain {
    pub position_addr: String,
    pub ts: String,
}

impl StakingRemovedOnChain {
    pub fn to_db_position_removed(&self) -> StakingRemoved {
        StakingRemoved {
            position_addr: standardize_address(&self.position_addr)
        }
    }
}