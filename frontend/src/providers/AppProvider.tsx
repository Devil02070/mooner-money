"use client";

import { createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from "react";
import { aptosClient } from "@/lib/aptos";
import { APTOS_FA, InputViewFunctionData } from "@aptos-labs/ts-sdk";
import { CA } from "@/lib/env";
import { AptosSignInInput, AptosSignInOutput, useWallet } from "@aptos-labs/wallet-adapter-react";
import Api from "@/lib/api";
import { generateNonce, serializeSignInOutput } from "@aptos-labs/siwa";
import { deleteAuthToken, storeAuthToken } from "@/lib/cookieStore";

export interface User {
    address: string;
    xp: number;
    xp_earned: number;
    rank: number;
    x_id?: string;
    x_username?: string;
    x_display_picture?: string;
    x_name?: string;
    x_verified?: boolean;
    x_description?: string;
}

export interface Config {
    fee_wallet: string;
    decimals: number;
    supply: number;
    locked_percentage: number;
    virtual_aptos_reserves: number;
    fee: number;
    graduate_fee: number;
    create_fee: number;
    creator_fee: number;
    whitelist_duration: number;
    paused: boolean;
}

export interface ChainToken {
    name: string;
    symbol: string;
    icon: string;
    decimals: number;
    fa_addr: string;
    price?: number;
}

export interface StakeAsset {
    name: string;
    symbol: string;
    icon: string;
    decimals: number;
    fa_addr: string;
    price?: number;
}

export interface GameAsset {
    name: string;
    symbol: string;
    icon: string;
    decimals: number;
    fa_addr: string;
    price?: number;
}

export interface StakeObj {
    stake_amount: string;
    fee_amount: string;
    min_lock_duration: string;
    fee_growth_global: string;
    stake_addr: string;
}

export interface CurrentGame {
    game_addr: string;
    balance: string;
    max_token_amount: string;
    max_xp: string;
    decimals: number;
    asset: string;
}

interface AppContextType {
    config?: Config;
    user?: User;
    setUser: Dispatch<SetStateAction<User | undefined>>
    onSignIn: () => Promise<string | undefined>;
    isSigningIn: boolean;
    fetchingUser: boolean;
    chainToken: ChainToken;
    slippage: string;
    setSlippage: Dispatch<SetStateAction<string>>;
    stakeAsset?: StakeAsset;
    stakeObj?: StakeObj;
    currentGame?: CurrentGame;
    gameAsset?: GameAsset;
}

const aptosToken: ChainToken = {
    name: "Aptos",
    symbol: "APT",
    icon: "https://pbs.twimg.com/profile_images/1556801889282686976/tuHF27-8_400x400.jpg",
    decimals: 8,
    fa_addr: APTOS_FA
}

export const stakingAssets: StakeAsset[] = [
    {
        name: "Mooner",
        symbol: "MOON",
        icon: "/logo-icon.svg",
        decimals: 6,
        fa_addr: "0xd91f51e8717209963a3b1ebf4aa11a777e5d3cc2849552e5acf4cb33c3ecc350"
    }
];

export const gameAssets: GameAsset[] = [
    {
        name: "Mooner",
        symbol: "MOON",
        icon: "/logo-icon.svg",
        decimals: 6,
        fa_addr: "0xd91f51e8717209963a3b1ebf4aa11a777e5d3cc2849552e5acf4cb33c3ecc350"
    }
]
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { account, signIn, wallet,  } = useWallet();
    const [chainToken, setChainToken] = useState<ChainToken>(aptosToken);
    const [config, setConfig] = useState<Config>();
    const [user, setUser] = useState<User>();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [slippage, setSlippage] = useState("1");
    const [stakeAsset, setStakeAsset] = useState<StakeAsset>();
    const [stakeObj, setStakeObj] = useState<StakeObj>();
    const [gameAsset, setGameAsset] = useState<GameAsset>();
    const [currentGame, setCurrentGame] = useState<CurrentGame>();
    const onSignIn = async () => {
        try {
            setIsSigningIn(true)
            if (!account || !wallet) {
                throw new Error("Wallet not connected");
            };
            const nonce = generateNonce();
            const input: AptosSignInInput = {
                nonce,
                domain: window.location.host,
                statement: "Sign into to get access to this mooner money app",
            };
            const response: AptosSignInOutput | void = await signIn({
                walletName: wallet.name,
                input
            });

            if (!response) {
                throw new Error("No response from sign in");
            }

            const token = (await Api.sendBackendRequest(
                `/api/auth/connect`,
                "POST",
                JSON.stringify({
                    output: serializeSignInOutput(response),
                    input
                })
            )).data;

            storeAuthToken(token);
            // get the user again upon signing in
            getUser();
            return token;
        } catch (error) {
            console.log(`Error while signing in: ${error}`)
        } finally {
            setIsSigningIn(false)
        }
    }
    const getUser = useCallback(async () => {
        try {
            setFetchingUser(true)
            if (!account?.address) throw new Error("Wallet is not connected");
            const data = (await Api.sendBackendRequest(`/api/auth/${account.address.toString()}/get`)).data as User;
            setUser(data);
        } catch (error) {
            setUser(undefined)
            console.log(`Error fetching user by address: ${error}`)
        } finally {
            setFetchingUser(false)
        }
    }, [account]);

    useEffect(() => {
        getUser()
    }, [getUser])
    useEffect(() => {
        const getConfig = async () => {
            try {
                const payload: InputViewFunctionData = {
                    function: `${CA}::mooner_money::get_config`
                };
                const [
                    fee_wallet,
                    decimals,
                    supply,
                    locked_percentage,
                    virtual_aptos_reserves,
                    fee,
                    graduate_fee,
                    create_fee,
                    creator_fee,
                    whitelist_duration,
                    paused,
                ] = (await aptosClient.view({ payload }));
                setConfig({
                    fee_wallet: fee_wallet!.toString(),
                    decimals: Number(decimals),
                    supply: Number(supply),
                    locked_percentage: Number(locked_percentage),
                    virtual_aptos_reserves: Number(virtual_aptos_reserves),
                    fee: Number(fee),
                    graduate_fee: Number(graduate_fee),
                    create_fee: Number(create_fee),
                    creator_fee: Number(creator_fee),
                    whitelist_duration: Number(whitelist_duration),
                    paused: Boolean(paused),
                });

                // const stake_asset = stakingAssets.find(asset => asset.fa_addr === stake_token!.toString());
                // setStakeAsset(stake_asset);

                // const [tvl, fee_collected, lock_duration, fee_growth, addr] = (await aptosClient.view({
                //     payload: {
                //         function: `${CA}::staking::get_stake_info`,
                //         functionArguments: [stake_token!.toString()]
                //     }
                // }));
                // setStakeObj({
                //     stake_amount: tvl!.toString(),
                //     fee_amount: fee_collected!.toString(),
                //     min_lock_duration: lock_duration!.toString(),
                //     fee_growth_global: fee_growth!.toString(),
                //     stake_addr: addr!.toString(),
                // });
            } catch (err) {
                console.error("Error fetching config:", err);
            }
        };
        getConfig();
    }, []);

    useEffect(() => {
        async function getCurrentGame() {
            try {
                const payload: InputViewFunctionData = {
                    function: `${CA}::mooner_spin::get_current_game_data`
                };
                const gameData = (await aptosClient.view({ payload }));
                const asset = gameData[5]!.toString();
                setCurrentGame({
                    game_addr: gameData[0]!.toString(),
                    balance: gameData[1]!.toString(),
                    max_token_amount: gameData[2]!.toString(),
                    max_xp: gameData[3]!.toString(),
                    decimals: Number(gameData[4]!),
                    asset
                })
                const game_asset = gameAssets.find(a => a.fa_addr === asset);
                setGameAsset(game_asset);
            } catch (error) {
                console.log(`Error fetching current game: ${error}`)
            }
        }
        getCurrentGame()
    }, [])

    useEffect(() => {
        function localSlippage() {
            const storedSlippage = localStorage.getItem("slippage") ?? "1";
            const numSlippage = Number(storedSlippage);
            if (!isNaN(numSlippage)) {
                setSlippage(
                    Math.max(1, numSlippage).toString()
                )
            }
        }
        localSlippage()
    }, [])

    useEffect(() => {
        async function getPriceBySymbol() {
            try {
                const price = (await Api.sendBackendRequest(`/api/indexer/price/${chainToken.symbol}`)).data;
                const num = Number(price);
                if (isNaN(num)) throw new Error("Price is not a number");
                setChainToken({
                    ...chainToken,
                    price
                })
            } catch (error) {
                console.log(`[error-AppProvider-getPriceBySymbol]: ${error}`)
            }
        }
        getPriceBySymbol()
    }, [])
    return (
        <AppContext.Provider value={{
            config,
            user,
            setUser,
            onSignIn,
            isSigningIn,
            fetchingUser,
            chainToken,
            slippage,
            setSlippage,
            stakeAsset,
            stakeObj,
            currentGame,
            gameAsset
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within a AppProvider");
    }
    return context;
}