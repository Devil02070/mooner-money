-- Your SQL goes here
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    description TEXT,
    xp INT NOT NULL,
    requirement JSONB, -- e.g. { "action": "buy", "amount": 250, "token": "APT" }
    repeatable BOOLEAN DEFAULT false, -- whether it can be claimed multiple times
    max_repeat INT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE task_claims (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    address VARCHAR(66) NOT NULL REFERENCES accounts(address) ON DELETE CASCADE,
    xp_earned INT NOT NULL,
    repeat_counter INT DEFAULT 0, 
    claimed_at TIMESTAMP DEFAULT now()
);