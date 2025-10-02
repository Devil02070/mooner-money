-- Your SQL goes here
CREATE TABLE stakings (
    position_addr VARCHAR(66) PRIMARY KEY,
    stake_addr VARCHAR(66) NOT NULL,
    "user" VARCHAR(66) NOT NULL,
    amount BIGINT NOT NULL,
    unlock_ts BIGINT NOT NULL,
    txn_version BIGINT NOT NULL,
    is_removed BOOLEAN DEFAULT FALSE NOT NULL,
    claimed BIGINT DEFAULT 0
);