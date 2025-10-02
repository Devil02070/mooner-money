// @generated automatically by Diesel CLI.

diesel::table! {
    accounts (address) {
        address -> Varchar,
        xp -> Int4,
        xp_earned -> Int4,
        x_id -> Nullable<Varchar>,
        x_username -> Nullable<Varchar>,
        x_display_picture -> Nullable<Varchar>,
        x_name -> Nullable<Varchar>,
        x_verified -> Bool,
        x_description -> Nullable<Varchar>,
    }
}

diesel::table! {
    chats (id) {
        id -> Varchar,
        content -> Text,
        address -> Varchar,
        token_address -> Varchar,
        image -> Nullable<Text>,
        timestamp -> Timestamp,
    }
}

diesel::table! {
    ledger_infos (chain_id) {
        chain_id -> Int8,
    }
}

diesel::table! {
    module_upgrade_history (module_addr, module_name, upgrade_number) {
        #[max_length = 300]
        module_addr -> Varchar,
        #[max_length = 300]
        module_name -> Varchar,
        upgrade_number -> Int8,
        module_bytecode -> Bytea,
        module_source_code -> Text,
        module_abi -> Json,
        tx_version -> Int8,
    }
}

diesel::table! {
    package_upgrade_history (package_addr, package_name, upgrade_number) {
        #[max_length = 300]
        package_addr -> Varchar,
        #[max_length = 300]
        package_name -> Varchar,
        upgrade_number -> Int8,
        upgrade_policy -> Int8,
        package_manifest -> Text,
        source_digest -> Text,
        tx_version -> Int8,
    }
}

diesel::table! {
    processor_status (processor) {
        #[max_length = 50]
        processor -> Varchar,
        last_success_version -> Int8,
        last_updated -> Timestamp,
        last_transaction_timestamp -> Nullable<Timestamp>,
    }
}

diesel::table! {
    stakings (position_addr) {
        #[max_length = 66]
        position_addr -> Varchar,
        #[max_length = 66]
        stake_addr -> Varchar,
        #[max_length = 66]
        user -> Varchar,
        amount -> Int8,
        unlock_ts -> Int8,
        txn_version -> Int8,
        is_removed -> Bool,
        claimed -> Nullable<Int8>,
    }
}

diesel::table! {
    task_claims (id) {
        id -> Int4,
        task_id -> Int4,
        #[max_length = 66]
        address -> Varchar,
        xp_earned -> Int4,
        repeat_counter -> Nullable<Int4>,
        claimed_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    tasks (id) {
        id -> Int4,
        description -> Nullable<Text>,
        xp -> Int4,
        requirement -> Nullable<Jsonb>,
        repeatable -> Nullable<Bool>,
        max_repeat -> Nullable<Int4>,
        created_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    tokens (pool_addr) {
        #[max_length = 66]
        pool_addr -> Varchar,
        name -> Text,
        symbol -> Text,
        image -> Text,
        description -> Text,
        website -> Nullable<Text>,
        twitter -> Nullable<Text>,
        telegram -> Nullable<Text>,
        decimals -> Int2,
        #[max_length = 66]
        pre_addr -> Varchar,
        #[max_length = 66]
        main_addr -> Varchar,
        virtual_aptos_reserves -> Numeric,
        virtual_token_reserves -> Numeric,
        remain_token_reserves -> Numeric,
        #[max_length = 66]
        created_by -> Varchar,
        is_completed -> Bool,
        ts -> Int8,
        txn_version -> Int8,
    }
}

diesel::table! {
    trades (txn_version) {
        txn_version -> Int8,
        is_buy -> Bool,
        #[max_length = 66]
        user_addr -> Varchar,
        aptos_amount -> Int8,
        token_amount -> Int8,
        #[max_length = 66]
        token_address -> Varchar,
        virtual_aptos_reserves -> Numeric,
        virtual_token_reserves -> Numeric,
        ts -> Int8,
    }
}

diesel::joinable!(task_claims -> accounts (address));
diesel::joinable!(task_claims -> tasks (task_id));

diesel::allow_tables_to_appear_in_same_query!(
    accounts,
    chats,
    ledger_infos,
    module_upgrade_history,
    package_upgrade_history,
    processor_status,
    stakings,
    task_claims,
    tasks,
    tokens,
    trades,
);
