use aptos_indexer_processor_sdk::utils::convert::standardize_address;
use field_count::FieldCount;
use diesel::{AsChangeset, Insertable};
use serde::{Deserialize, Serialize};
use crate::schema::accounts;

#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = accounts)]
pub struct Account {
    pub address: String,
    pub xp: i32,
    pub xp_earned: i32
}

#[derive(Clone, Debug, Deserialize, FieldCount, Serialize)]
pub struct Spin {
    pub claimer: String,
    pub amount: i64,
    pub win_type: i32
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpinEventOnChain {
    pub claimer: String,
    pub win_type: i32,
    pub amount: String
}

impl SpinEventOnChain {
    pub fn to_db_account(&self) -> Spin {
        Spin {
           claimer: standardize_address(&self.claimer),
           amount: self.amount.parse().unwrap(),
           win_type: self.win_type
        }
    }
}
