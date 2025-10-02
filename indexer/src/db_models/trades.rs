use aptos_indexer_processor_sdk::utils::convert::{standardize_address};
use diesel::{AsChangeset, Insertable};
use field_count::FieldCount;
use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal;
use crate::schema::trades;

#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = trades)]
pub struct Trade {
    pub txn_version: i64,
    pub is_buy: bool,
    pub user_addr: String,
    pub aptos_amount: i64,
    pub token_amount: i64,
    pub token_address: String,
    pub virtual_aptos_reserves: BigDecimal,
    pub virtual_token_reserves: BigDecimal,
    pub ts: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TradeCreatedOnChain {
    pub is_buy: bool,
    pub user: String,
    pub aptos_amount: String,
    pub token_amount: String,
    pub token_address: String,
    pub virtual_aptos_reserves: String,
    pub virtual_token_reserves: String,
    pub ts: String,
}

impl TradeCreatedOnChain {
       pub fn to_db_trade(&self, txn_version: i64) -> Trade {
        Trade {
            txn_version,
            is_buy: self.is_buy,
            user_addr: standardize_address(&self.user),
            aptos_amount: self.aptos_amount.parse().unwrap(),
            token_amount:  self.token_amount.parse().unwrap(),
            token_address: standardize_address(&self.token_address),
            virtual_aptos_reserves: self.virtual_aptos_reserves.parse().unwrap(),
            virtual_token_reserves: self.virtual_token_reserves.parse().unwrap(),
            ts: self.ts.parse().unwrap(),
        }
    }
}
