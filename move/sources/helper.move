module mooner_money::helper {
    use aptos_framework::object::{Self, Object};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};

    /// Not the admin of the contract
    const ERR_NOT_ADMIN: u64 = 0;

    // ======================= Common helper Functions ====================== //
    public fun get_pair_token(): Object<Metadata> {
        object::address_to_object<Metadata>(@0xa)
    }

    public fun create_token_store(obj_signer: &signer, token: Object<Metadata>): Object<FungibleStore> {
        let constructor_ref = &object::create_object_from_object(obj_signer);
        fungible_asset::create_store(constructor_ref, token)
    }

    public fun assert_is_admin(addr: address) {
        assert!(addr == @admin, ERR_NOT_ADMIN);
    }
}