module mooner_money::mooner_money {
    use std::signer;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_std::string_utils;
    use aptos_std::math128;
    use aptos_std::math64;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::fungible_asset::{Self, FungibleStore, MintRef, BurnRef, Metadata};
    use aptos_framework::timestamp;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::event;
    use thalaswap_v2::pool;
    use mooner_money::helper;

    struct Config has key {
        fee_wallet: address,
        decimals: u8,
        supply: u64,
        locked_percentage: u64,
        virtual_aptos_reserves: u128,
        fee: u8,
        graduate_fee: u64,
        create_fee: u64,
        creator_fee: u64,
        whitelist_duration: u64,
        paused: bool,
        token_idx: u64,
        extend_ref: object::ExtendRef
    }

    #[resource_group_member(group=aptos_framework::object::ObjectGroup)]
    struct Pool has key {
        virtual_aptos_reserves: u128,
        virtual_token_reserves: u128,
        real_aptos_reserves: Object<FungibleStore>,
        real_pre_reserves: Object<FungibleStore>,
        remain_main_reserves: Object<FungibleStore>,
        main_mint_ref: fungible_asset::MintRef,
        pre_burn_ref: fungible_asset::BurnRef,
        is_completed: bool,
        creator: address,
        extend_ref: object::ExtendRef
    }

    #[event]
    struct TokenCreated has drop, store {
        name: String,
        symbol: String,
        image: String,
        description: String,
        website: Option<String>,
        twitter: Option<String>,
        telegram: Option<String>,
        decimals: u8,
        pre_addr: address,
        pool_addr: address,
        main_addr: address,
        virtual_aptos_reserves: u128,
        virtual_token_reserves: u128,
        remain_token_reserves: u128,
        created_by: address,
        is_completed: bool,
        ts: u64,
    }

    #[event]
    struct TokenTraded has drop, store {
        is_buy: bool,
        user: address,
        aptos_amount: u64,
        token_amount: u64,
        token_address: address,
        virtual_aptos_reserves: u128,
        virtual_token_reserves: u128,
        ts: u64,
    }

    #[event]
    struct PoolCompleted has drop, store {
        token_addr: address
    }

    /// Not the admin of module
    const ERR_NOT_ADMIN: u64 = 0;
    /// Module not initiailized
    const ERR_NOT_INITIALIZED: u64 = 1;
    /// Module is paused
    const ERR_PAUSED: u64 = 2;
    /// Percentage is greater than 100
    const ERR_INVALID_PERCENTAGE: u64 = 3;
    /// Duration specified is too high
    const ERR_DURATION_TOO_HIGH: u64 = 4;
    /// Whitelisted wallets addresses length is zero
    const ERR_NO_WHITELISTED_WALLETS: u64 = 5;
    /// Divisor is zero
    const ERR_ZERO_DIVISOR: u64 = 6;
    /// Token has already migrated
    const ERR_POOL_COMPLETED: u64 = 7;
    /// Zero amount
    const ERR_ZERO_AMOUNT: u64 = 8;
    /// Zero in reserves
    const ERR_ZERO_RESERVES: u64 = 9;
    /// Max input amount is less for expected output
    const ERR_MAX_INPUT_TOO_SMALL: u64 = 10;
    /// Pool does not have expected output amount
    const ERR_INSUFFICIENT_OUTPUT_AMOUNT: u64 = 11;
    /// Address not whitelisted for buy
    const ERR_NOT_WHITELISTED: u64 = 12;
    /// Min output amount is less than expected output
    const ERR_MIN_OUTPUT_TOO_SMALL: u64 = 13;
    /// Pool not migrated yet
    const ERR_POOL_NOT_COMPLETED: u64 = 14;
    /// Zero account balance
    const ERR_ZERO_BALANCE: u64 = 15;

    const APP_SEED: vector<u8> = b"mooner-money";

    public entry fun initialize(admin: &signer){
        let addr = signer::address_of(admin);
        helper::assert_is_admin(addr);
        let config_constructor_ref = &object::create_named_object(admin, APP_SEED);
        move_to(admin, Config {
            fee_wallet: addr,
            decimals: 6,
            supply: 1_000_000_000,
            locked_percentage: 2000,
            virtual_aptos_reserves: 30_000_000_000,
            fee: 120,
            graduate_fee: 3_000_000_000,
            create_fee: 300_0000,
            creator_fee: 3000,
            whitelist_duration: 1800,
            paused: false,
            token_idx: 0,
            extend_ref: object::generate_extend_ref(config_constructor_ref)
        });
    }

    inline fun assert_is_paused() {
        assert_is_initialized();
        let config = borrow_global<Config>(@admin);
        assert!(config.paused == false, ERR_PAUSED);
    }

    fun assert_is_initialized() {
        assert!(exists<Config>(@admin), ERR_NOT_INITIALIZED);
    }

    public entry fun update_config(
        acc: &signer, 
        fee_wallet: Option<address>,
        decimals: Option<u8>, 
        supply: Option<u64>, 
        locked_percentage: Option<u64>,
        virtual_aptos_reserves: Option<u128>,
        fee: Option<u8>,
        graduate_fee: Option<u64>,
        create_fee: Option<u64>,
        creator_fee: Option<u64>,
        whitelist_duration: Option<u64>,
        paused: Option<bool>
    ) acquires Config {
        assert_is_paused();
        let acc_addr = signer::address_of(acc);
        helper::assert_is_admin(acc_addr);
        let config = borrow_global_mut<Config>(@admin);
        if(fee_wallet.is_some()){
            config.fee_wallet = fee_wallet.extract();
        };
        if(decimals.is_some()){
            config.decimals = decimals.extract();
        };
        if(supply.is_some()){
            config.supply = supply.extract();
        };
        if(locked_percentage.is_some()){
            let locked_percentage = locked_percentage.extract();
            assert!(locked_percentage <= 10000, ERR_INVALID_PERCENTAGE);
            config.locked_percentage = locked_percentage;
        };
        if(virtual_aptos_reserves.is_some()){
            config.virtual_aptos_reserves = virtual_aptos_reserves.extract();
        };
        if(fee.is_some()){
            config.fee = fee.extract();
        };
        if(graduate_fee.is_some()){
            config.graduate_fee = graduate_fee.extract();
        };
        if(create_fee.is_some()){
            config.create_fee = create_fee.extract();
        };
        if(creator_fee.is_some()){
            config.creator_fee = creator_fee.extract();
        };
        if(whitelist_duration.is_some()){
            let whitelist_duration = whitelist_duration.extract();
            assert!(whitelist_duration <= 86400, ERR_DURATION_TOO_HIGH);
            config.whitelist_duration = whitelist_duration;
        };
        if(paused.is_some()) {
            config.paused = paused.extract();
        };
    }

    #[view]
    public fun get_config(): (address, u8, u64, u64, u128, u8, u64, u64, u64, u64, bool) acquires Config {
        assert_is_initialized();
        let config = borrow_global<Config>(@admin);
        (config.fee_wallet, config.decimals, config.supply, config.locked_percentage, config.virtual_aptos_reserves, config.fee, config.graduate_fee, config.create_fee, config.creator_fee, config.whitelist_duration, config.paused)
    }


    public fun create(
        creator: &signer, 
        name: String,
        symbol: String,
        image: String,
        description: String,
        website: Option<String>,
        twitter: Option<String>,
        telegram: Option<String>,
    ): Object<Pool> acquires Config {
        assert_is_paused();
        let config = borrow_global_mut<Config>(@admin);
        // transfer the creation fee to fee wallet
        let aptos_metadata = helper::get_pair_token();
        primary_fungible_store::transfer(creator, aptos_metadata, config.fee_wallet, config.create_fee);
        // create pre coin
        let virtual_token_reserves = (config.supply as u128) * math128::pow(10, (config.decimals as u128));
        let locked_supply = mul_div_u128(
            virtual_token_reserves,
            (config.locked_percentage as u128),
            10000
        );
        let seeds = get_token_seeds(string::utf8(b"mooner-"), symbol, config.token_idx);
        let (mint_ref, burn_ref, pre_metadata) = create_fungible_asset(creator, seeds, name, symbol, config.decimals, image, virtual_token_reserves - (locked_supply as u128));

        let x_reserves = fungible_asset::mint(
            &mint_ref, 
            ((virtual_token_reserves - (locked_supply as u128)) as u64)
        );
        // create main coin
        let seeds = get_token_seeds(string::utf8(b""), symbol, config.token_idx);
        let (mint_ref, _, main_metadata) = create_fungible_asset(creator, seeds, name, symbol, config.decimals, image, virtual_token_reserves);
        let y_reserves = fungible_asset::mint(
            &mint_ref, 
            locked_supply
        );
        // update config token idx
        config.token_idx += 1;
        // create pool
        let config_addr = signer::address_of(&object::generate_signer_for_extending(&config.extend_ref));
        let pool_constructor_ref = &object::create_object(config_addr);
        let pool_signer = &object::generate_signer(pool_constructor_ref);
        let pool = Pool {
            virtual_aptos_reserves: config.virtual_aptos_reserves,
            virtual_token_reserves,
            real_aptos_reserves: create_token_store(pool_signer, aptos_metadata),
            real_pre_reserves: create_token_store(pool_signer, pre_metadata),
            remain_main_reserves: create_token_store(pool_signer, main_metadata),
            main_mint_ref: mint_ref,
            pre_burn_ref: burn_ref,
            is_completed: false,
            creator: signer::address_of(creator),
            extend_ref: object::generate_extend_ref(pool_constructor_ref)
        };

        fungible_asset::deposit(pool.real_pre_reserves, x_reserves);
        fungible_asset::deposit(pool.remain_main_reserves, y_reserves);

        event::emit<TokenCreated>(
            TokenCreated {
                name,
                symbol,
                image,
                description,
                website,
                twitter,
                telegram,
                decimals: config.decimals,
                pre_addr: object::object_address(&pre_metadata),
                pool_addr: object::address_from_constructor_ref(pool_constructor_ref),
                main_addr: object::object_address(&main_metadata),
                virtual_aptos_reserves: config.virtual_aptos_reserves,
                virtual_token_reserves,
                remain_token_reserves: (locked_supply as u128),
                created_by: signer::address_of(creator),
                is_completed: false,
                ts: timestamp::now_seconds(),
            }
        );

        move_to(pool_signer, pool);
        object::object_from_constructor_ref<Pool>(pool_constructor_ref)
    }

    public fun mul_div_u128(x: u128, y: u128, z: u128): u64 {
        assert!(z != 0, ERR_ZERO_DIVISOR);
        let r = x * y / z;
        (r as u64)
    }

    fun get_token_seeds(prefix: String, symbol: String, idx: u64): vector<u8> {
        let seed = string_utils::format3(
            &b"{}-{}-{}",
            prefix, 
            symbol,
            idx
        );
        *seed.bytes()
    }

    fun create_fungible_asset(
        creator: &signer,
        seed: vector<u8>,
        name: String,
        symbol: String,
        decimals: u8,
        image: String,
        supply: u128
    ): (MintRef, BurnRef, Object<Metadata>) {
        let constructor_ref = &object::create_named_object(creator, seed);
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::some(supply), // max supply
            name,
            symbol,
            decimals,
            image,
            string::utf8(b"https://mooner.money"),
        );
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        (mint_ref, burn_ref, object::object_from_constructor_ref<Metadata>(constructor_ref))
    }

    public fun create_token_store(obj_signer: &signer, token: Object<Metadata>): Object<FungibleStore> {
        let constructor_ref = &object::create_object_from_object(obj_signer);
        fungible_asset::create_store(constructor_ref, token)
    }

    public fun buy(
        user: &signer,
        pool_obj: Object<Pool>,
        max_aptos: u64,
        min_coins: u64,
    ) acquires Config, Pool {
        assert_is_paused();
        let config = borrow_global<Config>(@admin);
        let pool_addr = object::object_address(&pool_obj);
        let pool = borrow_global_mut<Pool>(pool_addr);
        assert!(pool.is_completed == false, ERR_POOL_COMPLETED);

        let reserves_x = (pool.virtual_aptos_reserves as u64);
        let reserves_y = (pool.virtual_token_reserves as u64);
        // calculate the desired aptos in for min coins out
        let desired_aptos = get_amount_in(reserves_x, reserves_y, min_coins);
        let fee_amount = math64::mul_div(desired_aptos, (config.fee as u64), 10000);
        assert!(desired_aptos + fee_amount <= max_aptos, ERR_MAX_INPUT_TOO_SMALL);
        let max_aptos = desired_aptos + fee_amount;
        // Check if pool has expected min coins
        assert!(fungible_asset::balance(pool.real_pre_reserves) >= min_coins, ERR_INSUFFICIENT_OUTPUT_AMOUNT);
        let pool_signer = &object::generate_signer_for_extending(&pool.extend_ref);
        // withdraw the asset and deposit to user
        let coins = fungible_asset::withdraw(pool_signer, pool.real_pre_reserves, min_coins);
        primary_fungible_store::deposit(signer::address_of(user), coins);
        // withdraw the aptos, deposit to fee wallet and pool
        let aptos = primary_fungible_store::withdraw(user, fungible_asset::store_metadata(pool.real_aptos_reserves), max_aptos);
        // withdraw fees for creator and protocol
        let fees = fungible_asset::extract(
            &mut aptos,
            fee_amount
        );
        let creator_fees = fungible_asset::extract(
            &mut fees,
            math64::mul_div(fee_amount, config.creator_fee, 10000)
        );
        // deposits
        primary_fungible_store::deposit(pool.creator, creator_fees);
        primary_fungible_store::deposit(config.fee_wallet, fees);
        let aptos_in = fungible_asset::amount(&aptos);
        fungible_asset::deposit(pool.real_aptos_reserves, aptos);
        // update virtual reserves
        pool.virtual_aptos_reserves += (aptos_in as u128);
        pool.virtual_token_reserves -= (min_coins as u128);
        if(fungible_asset::balance(pool.real_pre_reserves) == 0) {
            transfer_pool(pool, config.fee_wallet, config.graduate_fee);
        };
        event::emit<TokenTraded>(
            TokenTraded {
                is_buy: true,
                user: signer::address_of(user),
                aptos_amount: max_aptos,
                token_amount: min_coins,
                token_address: object::object_address(&fungible_asset::store_metadata(pool.real_pre_reserves)),
                virtual_aptos_reserves: pool.virtual_aptos_reserves,
                virtual_token_reserves: pool.virtual_token_reserves,
                ts: timestamp::now_seconds(),
            }
        );
    }

    fun get_amount_in(x: u64, y: u64, amount_out: u64): u64 {
        assert!(amount_out > 0, ERR_ZERO_AMOUNT);
        assert!(x > 0 && y > 0, ERR_ZERO_RESERVES);
        math64::mul_div(x, amount_out, (y - amount_out))
    }

    fun transfer_pool(pool: &mut Pool, fee_wallet: address, graduate_fee: u64) {
        let pool_signer = &object::generate_signer_for_extending(&pool.extend_ref);
        let aptos = fungible_asset::withdraw(pool_signer, pool.real_aptos_reserves, fungible_asset::balance(pool.real_aptos_reserves));
        let graduate_coins = fungible_asset::extract(&mut aptos, graduate_fee);
        primary_fungible_store::deposit(fee_wallet, graduate_coins);
        let transfer_metadata = fungible_asset::store_metadata(pool.remain_main_reserves);
        let (_, lp_asset) = pool::create_pool_weighted(
            vector[
                aptos,
                fungible_asset::withdraw(pool_signer, pool.remain_main_reserves, fungible_asset::balance(pool.remain_main_reserves)),
            ],
            vector[
                50,
                50
            ],
            30
        );
        let burn_store = primary_fungible_store::ensure_primary_store_exists(@0xf, fungible_asset::metadata_from_asset(&lp_asset));
        fungible_asset::deposit(burn_store, lp_asset);
        pool.is_completed = true;
        event::emit<PoolCompleted>(
            PoolCompleted {
                token_addr: object::object_address(&transfer_metadata)
            },
        );
    }

    public entry fun create_entry(
        creator: &signer, 
        name: String,
        symbol: String,
        image: String,
        description: String,
        website: Option<String>,
        twitter: Option<String>,
        telegram: Option<String>,
    ) acquires Config {
        create(creator, name, symbol, image, description, website, twitter, telegram);
    }

    public entry fun buy_entry(
        user: &signer,
        pool_obj: Object<Pool>,
        max_aptos: u64,
        min_coins: u64,
    ) acquires Config, Pool {
        buy(user, pool_obj, max_aptos, min_coins);
    }

    public entry fun create_and_buy_entry(
        creator: &signer, 
        name: String,
        symbol: String,
        image: String,
        description: String,
        website: Option<String>,
        twitter: Option<String>,
        telegram: Option<String>,
        max_aptos: u64,
        min_coins: u64,
    ) acquires Config, Pool {
        let pool_obj = create(creator, name, symbol, image, description, website, twitter, telegram);
        buy(creator, pool_obj, max_aptos, min_coins);
    }


     public entry fun sell_entry(
        user: &signer,
        pool_obj: Object<Pool>,
        max_coins: u64,
        min_aptos: u64,
    ) acquires Config, Pool {
        assert_is_paused();
        let config = borrow_global<Config>(@admin);
        let pool_addr = object::object_address(&pool_obj);
        let pool = borrow_global_mut<Pool>(pool_addr);
        assert!(pool.is_completed == false, ERR_POOL_COMPLETED);
        let current_ts = timestamp::now_seconds();
        let reserves_x = (pool.virtual_aptos_reserves as u64);
        let reserves_y = (pool.virtual_token_reserves as u64);
        let amount_out_aptos = get_amount_out(reserves_x, reserves_y, max_coins);
        let fee_amount = math64::mul_div(amount_out_aptos, (config.fee as u64), 10000);
        assert!(amount_out_aptos - fee_amount >= min_aptos, ERR_MIN_OUTPUT_TOO_SMALL);
        // Check if pool has expected min aptos
        assert!(fungible_asset::balance(pool.real_aptos_reserves) >= min_aptos, ERR_INSUFFICIENT_OUTPUT_AMOUNT);
        let pool_signer = &object::generate_signer_for_extending(&pool.extend_ref);
        // withdraw the coins from user and deposit to pool
        let coins = primary_fungible_store::withdraw(user, fungible_asset::store_metadata(pool.real_pre_reserves), max_coins);
        fungible_asset::deposit(pool.real_pre_reserves, coins);
        // withdraw the aptos, deposit to fee wallet and user
        let aptos = fungible_asset::withdraw(pool_signer, pool.real_aptos_reserves, amount_out_aptos);
        // withdraw fees for creator and protocol
        let fees = fungible_asset::extract(
            &mut aptos,
            fee_amount
        );
        let creator_fees = fungible_asset::extract(
            &mut fees,
            math64::mul_div(fee_amount, config.creator_fee, 10000)
        );
        // deposits
        primary_fungible_store::deposit(pool.creator, creator_fees);
        primary_fungible_store::deposit(config.fee_wallet, fees);
        primary_fungible_store::deposit(signer::address_of(user), aptos);

        pool.virtual_aptos_reserves -= (amount_out_aptos as u128);
        pool.virtual_token_reserves += (max_coins as u128);

        event::emit<TokenTraded>(
            TokenTraded {
                is_buy: false,
                user: signer::address_of(user),
                aptos_amount: amount_out_aptos,
                token_amount: max_coins,
                token_address: object::object_address(&fungible_asset::store_metadata(pool.real_pre_reserves)),
                virtual_aptos_reserves: pool.virtual_aptos_reserves,
                virtual_token_reserves: pool.virtual_token_reserves,
                ts: current_ts,
            }
        );
    }

    fun get_amount_out(x: u64, y: u64, amount_in: u64): u64 {
        assert!(amount_in > 0, ERR_ZERO_AMOUNT);
        assert!(x > 0 && y > 0, ERR_ZERO_RESERVES);
        math64::mul_div(x, amount_in, (y + amount_in))
    }

    public entry fun claim_entry(
        acc: &signer,
        pool_obj: Object<Pool>
    ) acquires Pool {
        let pool_addr = object::object_address(&pool_obj);
        let pool = borrow_global<Pool>(pool_addr);
        assert!(pool.is_completed == true, ERR_POOL_NOT_COMPLETED);
        let pre_metadata = fungible_asset::store_metadata(pool.real_pre_reserves);
        let pre_bal = primary_fungible_store::balance(signer::address_of(acc), pre_metadata);
        assert!(pre_bal > 0, ERR_ZERO_BALANCE);
        let coins = primary_fungible_store::withdraw(acc, pre_metadata, pre_bal);
        fungible_asset::burn(&pool.pre_burn_ref, coins);
        let coins = fungible_asset::mint(&pool.main_mint_ref, pre_bal);
        primary_fungible_store::deposit(signer::address_of(acc), coins);
    }

    #[view]
    public fun get_pool(pool_obj: Object<Pool>): (u128, u128, u64, u64, u64, bool, address) acquires Pool {
        let pool = borrow_global<Pool>(
            object::object_address(&pool_obj)
        );
        (
            pool.virtual_aptos_reserves, 
            pool.virtual_token_reserves, 
            fungible_asset::balance(pool.real_aptos_reserves), 
            fungible_asset::balance(pool.real_pre_reserves), 
            fungible_asset::balance(pool.remain_main_reserves), 
            pool.is_completed, 
            pool.creator
        )
    } 

    #[view]
    public fun get_thala_pool(metadata: vector<Object<Metadata>>, weights: vector<u64>, swap_fee_bps: u64): address {
        object::create_object_address(
            &@thalaswap_v2,
            pool::lp_seed_weighted(
                metadata,
                weights,
                swap_fee_bps
            )
        )
    }
}