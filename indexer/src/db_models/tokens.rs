use aptos_indexer_processor_sdk::utils::convert::{standardize_address};
use diesel::{AsChangeset, Insertable};
use field_count::FieldCount;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde::de::Deserializer;
use bigdecimal::BigDecimal;
use crate::schema::tokens;

#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = tokens)]
pub struct Token {
    pub pool_addr: String,
    pub name: String,
    pub symbol: String,
    pub image: String,
    pub description: String,
    pub website: Option<String>,
    pub twitter: Option<String>,
    pub telegram: Option<String>,
    pub decimals: i16,
    pub pre_addr: String,
    pub main_addr: String,
    pub virtual_aptos_reserves: BigDecimal,
    pub virtual_token_reserves: BigDecimal,
    pub remain_token_reserves: BigDecimal,
    pub created_by: String,
    pub is_completed: bool,
    pub ts: i64,
    pub txn_version: i64
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TokenCreatedOnChain {
    pub name: String,
    pub symbol: String,
    pub image: String,
    pub description: String,
    #[serde(deserialize_with = "deserialize_aptos_option_string")]
    pub website: Option<String>,
    #[serde(deserialize_with = "deserialize_aptos_option_string")]
    pub twitter: Option<String>,
    #[serde(deserialize_with = "deserialize_aptos_option_string")]
    pub telegram: Option<String>,
    pub decimals: i16,
    pub pre_addr: String,
    pub pool_addr: String,
    pub main_addr: String,
    pub virtual_aptos_reserves: String,
    pub virtual_token_reserves: String,
    pub remain_token_reserves: String,
    pub created_by: String,
    pub is_completed: bool,
    pub ts: String
}

impl TokenCreatedOnChain {
       pub fn to_db_token(&self, txn_version: i64) -> Token {
        Token {
            pool_addr: standardize_address(&self.pool_addr),
            name: self.name.clone(),
            symbol: self.symbol.clone(),
            image: self.image.clone(),
            description: self.description.clone(),
            website: self.website.clone(),
            twitter: self.twitter.clone(),
            telegram: self.telegram.clone(),
            decimals: self.decimals,
            pre_addr: standardize_address(&self.pre_addr),
            main_addr: standardize_address(&self.main_addr),
            virtual_aptos_reserves: self.virtual_aptos_reserves.parse().unwrap(),
            virtual_token_reserves: self.virtual_token_reserves.parse().unwrap(),
            remain_token_reserves: self.remain_token_reserves.parse().unwrap(),
            created_by: standardize_address(&self.created_by),
            is_completed: self.is_completed,
            ts: self.ts.parse().unwrap(),
            txn_version
        }
    }
}

pub fn deserialize_aptos_option_string<'de, D>(
    deserializer: D,
) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    let val: Value = Deserialize::deserialize(deserializer)?;
    match val {
        Value::Object(obj) if obj.get("vec").is_some() => {
            let vec = obj.get("vec").unwrap();
            if let Value::Array(arr) = vec {
                if arr.is_empty() {
                    Ok(None)
                } else if let Some(Value::String(s)) = arr.get(0) {
                    Ok(Some(s.clone()))
                } else {
                    Ok(None)
                }
            } else {
                Ok(None)
            }
        }
        _ => Ok(None),
    }
}

#[derive(AsChangeset, Clone, Debug, Deserialize, FieldCount, Insertable, Serialize)]
#[diesel(table_name = tokens)]
pub struct PoolCompleted {
    pub main_addr: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PoolCompletedOnChain {
    pub token_addr: String
}

impl PoolCompletedOnChain {
       pub fn to_db_pool_completed(&self) -> PoolCompleted {
        PoolCompleted {
            main_addr: standardize_address(&self.token_addr),
        }
    }
}