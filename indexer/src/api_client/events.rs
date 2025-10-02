use anyhow::{Ok, Result};
use dotenv::var;
use once_cell::sync::Lazy;
use reqwest::Client;

use crate::db_models::accounts::Spin;

#[allow(dead_code)]
static BASE_URL: Lazy<String> = Lazy::new(||var("BACKEND_URL").unwrap_or("https://fun-api.meowtos.xyz".to_string()));
#[allow(dead_code)]
static ACCESS_TOKEN: Lazy<String> = Lazy::new(||var("ACCESS_TOKEN").unwrap_or("INDEXER".to_string()));

#[allow(dead_code)]
pub async fn emit_token_created(addr: String) -> Result<()> {
    let client = Client::new();
    let url = format!("{}/api/indexer/created/{}", *BASE_URL, addr);
    let response = client.get(url).header("x-indexer", ACCESS_TOKEN.as_str()).send().await?;
    if !response.status().is_success() {
        eprintln!("Request failed with status: {}", response.status());
    }
    if !response.status().is_success() {
        anyhow::bail!("Request failed with status {}", response.status());
    }
    eprintln!("Created Request succeed with status: {}", response.status());

    Ok(())
}

#[allow(dead_code)]
pub async fn emit_token_traded(txn_version: i64) -> Result<()> {
    let client = Client::new();
    let url = format!("{}/api/indexer/traded/{}", *BASE_URL, txn_version);
    let response = client.get(url).header("x-indexer", ACCESS_TOKEN.as_str()).send().await?;
    if !response.status().is_success() {
        eprintln!("Request failed with status: {}", response.status());
    }
    if !response.status().is_success() {
        anyhow::bail!("Request failed with status {}", response.status());
    }
    eprintln!("Traded Request succeed with status: {}", response.status());
    Ok(())
}

#[allow(dead_code)]
pub async fn emit_spin_win(spin_event: Spin) -> Result<()> {
    
    let client = Client::new();
    let url = format!("{}/api/indexer/spin", *BASE_URL);
    let response = client.post(url).header("x-indexer", ACCESS_TOKEN.as_str()).json(&spin_event).send().await?;
    if !response.status().is_success() {
        eprintln!("Request failed with status: {}", response.status());
    }
    if !response.status().is_success() {
        anyhow::bail!("Request failed with status {}", response.status());
    }
    eprintln!("Spin event request succeed with status: {}", response.status());
    Ok(())
}