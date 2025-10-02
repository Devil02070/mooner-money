use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct SpinWinRequest {
    pub user: String,
    pub amount: i64,
    pub win_type: i32
}