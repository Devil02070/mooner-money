module thalaswap_v2::pool {
    use aptos_framework::object::{Object, ExtendRef};
    use aptos_framework::fungible_asset::{FungibleAsset, Metadata, MintRef, TransferRef, BurnRef};

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Pool has key {
        extend_ref: ExtendRef,

        assets_metadata: vector<Object<Metadata>>,

        pool_type: u8,
        /// swap fee takes on 0% (no fee), 0.05%, 0.30%, or 1%
        swap_fee_bps: u64,
        /// true if there is a flashloan in progress, and other flashloan / swap / liquidity operations cannot be executed for the pool
        locked: bool,

        lp_token_mint_ref: MintRef,
        lp_token_transfer_ref: TransferRef,
        lp_token_burn_ref: BurnRef
    }

    public fun create_pool_weighted(_assets: vector<FungibleAsset>, _weights: vector<u64>, _swap_fee_bps: u64): (Object<Pool>, FungibleAsset) {
        abort 0
    }
    
    #[view]
    public fun lp_seed_weighted(_metadata: vector<Object<Metadata>>, _weights: vector<u64>, _swap_fee_bps: u64): vector<u8> {
        vector[]
    }
}