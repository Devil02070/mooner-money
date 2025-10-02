-- Table: accounts
CREATE TABLE accounts (
    address VARCHAR PRIMARY KEY,
    xp INT DEFAULT 0 NOT NULL,
    xp_earned INT DEFAULT 0 NOT NULL,
    x_id VARCHAR,
    x_username VARCHAR,
    x_display_picture VARCHAR,
    x_name VARCHAR,
    x_verified BOOLEAN DEFAULT FALSE NOT NULL,
    x_description VARCHAR
);

-- Table: tokens
CREATE TABLE tokens (
    pool_addr VARCHAR(66) PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    website TEXT,
    twitter TEXT,
    telegram TEXT,
    decimals SMALLINT NOT NULL,
    pre_addr VARCHAR(66) UNIQUE NOT NULL,
    main_addr VARCHAR(66) UNIQUE NOT NULL,
    virtual_aptos_reserves DECIMAL(39,0) NOT NULL,
    virtual_token_reserves DECIMAL(39,0) NOT NULL,
    remain_token_reserves DECIMAL(39,0) NOT NULL,
    created_by VARCHAR(66) NOT NULL, -- required, but no FK
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    ts BIGINT NOT NULL,
    txn_version BIGINT NOT NULL
);

CREATE INDEX idx_tokens_pre_addr ON tokens(pre_addr);

-- Table: trades
CREATE TABLE trades (
    txn_version BIGSERIAL PRIMARY KEY,
    is_buy BOOLEAN NOT NULL,
    user_addr VARCHAR(66) NOT NULL, -- required, but no FK
    aptos_amount BIGINT NOT NULL,
    token_amount BIGINT NOT NULL,
    token_address VARCHAR(66) NOT NULL,
    virtual_aptos_reserves DECIMAL(39,0) NOT NULL,
    virtual_token_reserves DECIMAL(39,0) NOT NULL,
    ts BIGINT NOT NULL,
    CONSTRAINT fk_trades_token FOREIGN KEY (token_address) REFERENCES tokens(pre_addr) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX idx_trades_token_addr ON trades(token_address);

-- Table: chats
CREATE TABLE chats (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    address VARCHAR NOT NULL, -- required, but no FK
    token_address VARCHAR NOT NULL,
    image TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_chats_token FOREIGN KEY (token_address) REFERENCES tokens(pre_addr)
);
