import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { NETWORK } from "./env";

const aptosConfig = new AptosConfig({
    network: NetworkToNetworkName[NETWORK],
});

export const aptosClient = new Aptos(aptosConfig);

export function getAccountOnX(username: string) {
    return `https://twitter.com/${username}`;
}

export function getAccountOnExplorer(address: string) {
    return `https://explorer.aptoslabs.com/account/${address}?network=${NETWORK}`
}

export function getTxnOnExplorer(hash: string) {
    return `https://explorer.aptoslabs.com/txn/${hash}?network=${NETWORK}`
}

type GetCurrentFungibleAssetBalancesQuery = {
    current_fungible_asset_balances: Array<{
        amount?: string | number | null;
        asset_type_v1?: string | null;
        asset_type_v2?: string | null;
        owner_address: string;
        token_standard?: string | null;
    }>;
};
export const getMultipleFungibleAssetBalances = async (
    ownerAddress: string,
    assetTypes: string[]
) => {
    const query = `
        query getCurrentFungibleAssetBalances($where_condition: current_fungible_asset_balances_bool_exp, $offset: Int, $limit: Int) {  
            current_fungible_asset_balances(    
                where: $where_condition    
                offset: $offset    
                limit: $limit 
            ) {
                amount
                asset_type_v2   
                asset_type    
                owner_address    
                token_standard 
              }
        }
    `;
    const balances: GetCurrentFungibleAssetBalancesQuery =
        await aptosClient.queryIndexer({
            query: {
                query,
                variables: {
                    where_condition: {
                        asset_type_v2: {
                            _in: assetTypes,
                        },
                        owner_address: {
                            _eq: ownerAddress,
                        },
                    },
                },
            },
        });
    const assetBalances = assetTypes.map((asset) => {
        const assets = balances.current_fungible_asset_balances.filter(
            (b) => b.asset_type_v2 === asset || b.asset_type_v1 === asset
        );
        const balance = assets.reduce((sum, asset) => {
            const amount = asset.amount ? Number(asset.amount) : 0;
            return sum + amount;
        }, 0);
        return balance;
    });
    return assetBalances;
};
