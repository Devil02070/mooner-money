"use client";

import Api from "@/lib/api";
import { ChartData, Chat, Holder, Pnl, Token, Trade } from "@/types/custom";
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { TokenInfo } from "./TokenInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Chart } from "./Chart";
import { Trades } from "./Trades";
import { ChatContainer } from "./ChatContainer";
import { Holders } from "./Holders";
import { TokenDescription } from "./TokenDescription";
import { Swap } from "./Swap";
import { socket } from "@/utils/socket-io-client";
import { Loader } from "@/components/Loader";
import IntervalTabs from "./IntervalTabs";
import { OutcomeModal } from "@/components/modals/OutcomeModal";
import { SpinOutcome } from "@/app/rewards/Body/Play";
import { H1 } from "@/components/ui/typography";
import Empty from "@/components/Empty/Empty";
import Link from "next/link";
import { useApp } from "@/providers/AppProvider";

interface BodyProps {
    tokenAddr: string;
    authToken?: string;
}

export function Body({ authToken, tokenAddr }: BodyProps) {
    const { account, isLoading: walletLoading } = useWallet();
    // token
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<Token>();
    // chart
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [chartInterval, setChartInterval] = useState(300);
    const [chartLoading, setChartLoading] = useState(true);
    // holders
    const [holders, setHolders] = useState<Holder[]>([]);
    // pnl
    const [userPNL, setUserPNL] = useState<Pnl>({
        bought: 0,
        sold: 0,
        hodl: 0,
        pnl: 0,
        realizedPNL: 0,
        unrealizedPNL: 0,
    });
    // chats
    const [chats, setChats] = useState<Chat[]>([]);
    const [chatOffset, setChatOffset] = useState(0);
    const [chatCount, setChatCount] = useState(0);
    // trades
    const [trades, setTrades] = useState<Trade[]>([]);
    const [tradeOffset, setTradeOffset] = useState(0);
    const [tradeCount, setTradeCount] = useState(0);
    // random win
    const [outcome, setOutcome] = useState<SpinOutcome>();

    const onIntervalChange = (newInterval: number) => {
        setChartInterval(newInterval)
    }

    const getChats = useCallback(async () => {
        try {
            const response = await Api.sendBackendRequest(`/api/chat/${tokenAddr}/get?offset=${chatOffset}&limit=10&sort_by=timestamp&sort_order=desc`);
            const data = response.data as Chat[];
            setChats(data);
            setChatCount(response.pagination.total ?? 0);
        } catch (error) {
            console.log(`Error in getChats: ${error}`)
        }
    }, [tokenAddr, chatOffset])

    const getTrades = useCallback(async () => {
        try {
            const response = await Api.sendBackendRequest(`/api/trade/${tokenAddr}/get?offset=${tradeOffset}&limit=10&sort_by=ts&sort_order=desc`);
            const data = response.data as Trade[];
            setTrades(data);
            setTradeCount(response.pagination.total ?? 0);
        } catch (error) {
            console.log(`Error in getTrades: ${error}`)
        }
    }, [tokenAddr, tradeOffset]);

    const getUserPNL = useCallback(async () => {
        try {
            if (!account?.address) throw new Error("Wallet not connected")
            const data = (await Api.sendBackendRequest(`/api/trade/${tokenAddr}/pnl/${account.address.toString()}`)).data as Pnl;
            setUserPNL(data);
        } catch (error) {
            setUserPNL({
                bought: 0,
                sold: 0,
                hodl: 0,
                pnl: 0,
                realizedPNL: 0,
                unrealizedPNL: 0,
            });
            console.log(`Error in getUserPNL: ${error}`)
        }
    }, [account, tokenAddr]);

    const getChart = useCallback(async () => {
        try {
            setChartLoading(true)
            if (walletLoading) throw new Error("Wallet is still loading");
            const data = (await Api.sendBackendRequest(`/api/trade/${tokenAddr}/chart?user=${account?.address ? account.address.toString() : ""}&interval=${chartInterval}`)).data as ChartData[];
            setChartData(data);
        } catch (error) {
            setChartData([])
            console.log(`Error in getChart: ${error}`)
        } finally {
            setChartLoading(false)
        }
    }, [tokenAddr, chartInterval, account, walletLoading])

    useEffect(() => {
        getChats();
    }, [getChats])

    useEffect(() => {
        getTrades();
    }, [getTrades])

    useEffect(() => {
        getUserPNL();
    }, [getUserPNL])

    useEffect(() => {
        getChart()
    }, [getChart])

    useEffect(() => {
        async function getToken() {
            try {
                setIsLoading(true);
                const data = (await Api.sendBackendRequest(`/api/token/${tokenAddr}/get`)).data as Token;
                setToken(data)
            } catch (error) {
                setToken(undefined)
                console.log(`[error-token-getToken]: ${error}`)
            } finally {
                setIsLoading(false);
            }
        };
        getToken();
    }, [tokenAddr]);


    useEffect(() => {
        async function getHolders() {
            try {
                const data = (await Api.sendBackendRequest(`/api/trade/${tokenAddr}/holders?offset=0&limit=100`)).data as Holder[];
                setHolders(data);
            } catch (error) {
                setHolders([])
                console.log(`[error-token-getHolders]: ${error}`)
            }
        };
        getHolders();
        const interval = setInterval(() => {
            getHolders();
        }, 20000);
        return () => clearInterval(interval);
    }, [tokenAddr])

    // Socket listeners
    useEffect(() => {
        const chatHandler = (data: Chat) => {
            setChats((prev) => [data, ...prev.slice(0, 9)]);
        };
        const tradeHandler = (data: Trade) => {
            setTrades((prev) => [data, ...prev.slice(0, 9)]);
            getChart()
            getUserPNL()
        };
        const tokenHandler = (data: Token) => {
            setToken(data)
        };
        socket.on(`chat-${tokenAddr}`, chatHandler);
        socket.on(`trade-${tokenAddr}`, tradeHandler);
        socket.on(`token-${tokenAddr}`, tokenHandler);
        return () => {
            socket.off(`chat-${tokenAddr}`, chatHandler);
            socket.off(`trade-${tokenAddr}`, tradeHandler);
            socket.off(`token-${tokenAddr}`, tokenHandler);
        };
    }, [tokenAddr]);

    useEffect(() => {
        const socketHandler = (amount: number) => {
            setOutcome({
                description: "Congrats!!",
                reward: `${amount} XP on this trade.`,
                title: "you just won"
            })
        }
        socket.on(`xp-${tokenAddr}-${account?.address.toString()}`, socketHandler);
        return () => {
            socket.off(`xp-${tokenAddr}-${account?.address.toString()}`, socketHandler);
        };
    }, [tokenAddr, account?.address]);
    if (isLoading) {
        return <Loader />;
    }

    if (!token) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Token not found</div>;
    }

    const commonProps = {
        token,
        chartData,
        trades,
        tradeOffset,
        setTradeOffset,
        tradeCount,
        chats,
        chatOffset,
        setChatOffset,
        chatCount,
        holders,
        userPNL,
        chartLoading,
        setChartLoading,
        onIntervalChange,
        chartInterval,
        authToken,
    }


    return (
        <React.Fragment>
            <DesktopView
                {...commonProps}
            />
            <PhoneView
                {...commonProps}
            />
            <OutcomeModal outcome={outcome} setOutCome={setOutcome} />
        </React.Fragment>
    );
}

interface ViewProps {
    token: Token;
    chartData: ChartData[];
    trades: Trade[];
    tradeOffset: number;
    setTradeOffset: Dispatch<SetStateAction<number>>;
    tradeCount: number;
    chats: Chat[];
    chatOffset: number;
    setChatOffset: Dispatch<SetStateAction<number>>;
    chatCount: number;
    holders: Holder[];
    userPNL: Pnl;
    chartLoading: boolean;
    onIntervalChange: (interval: number) => void;
    chartInterval: number;
    authToken?: string;
}

function PhoneView({
    token,
    chartData,
    trades,
    tradeOffset,
    tradeCount,
    setTradeOffset,
    chats,
    chatOffset,
    setChatOffset,
    chatCount,
    holders,
    userPNL,
    authToken,
    chartLoading,
    onIntervalChange,
    chartInterval,
}: ViewProps) {
    const { account } = useWallet()
     const { chainToken } = useApp()
    return (
        <div className="p-1 px-4 mb-20 lg:hidden">
            <Tabs defaultValue="buy-sell" className="h-full mt-4 gap-4">
                <TabsList className="grid max-w-sm mx-auto grid-cols-2 rounded-full bg-card ">
                    <TabsTrigger value="buy-sell" className="rounded-full">Buy & sell</TabsTrigger>
                    <TabsTrigger value="chart-activity" className="rounded-full">Chart & activity</TabsTrigger>
                </TabsList>

                <TabsContent value="buy-sell" className="overflow-hidden space-y-4" style={{ overflowY: "scroll" }}>
                    <TokenInfo token={token} />
                    <div className="bg-card rounded-[12px] p-4 flex flex-col md:flex-col">
                        <div className="flex flex-col-reverse md:flex-col gap-4">
                            <TokenDescription token={token} />
                            <Swap token={token} userPNL={userPNL} />
                        </div>
                    </div>
                    <Holders data={holders} dev={token.created_by} />
                </TabsContent>

                <TabsContent value="chart-activity" className="overflow-hidden space-y-4" style={{ overflowY: "scroll" }}>
                    <div className="bg-card rounded-xl p-3 flex-col space-y-2  flex relative ">
                        <IntervalTabs
                            currentInterval={chartInterval}
                            onIntervalChange={onIntervalChange}
                        />

                        <div className="w-full">
                            <Chart data={chartData} isDev={account?.address.toString() === token.created_by} />
                        </div>

                        {chartLoading && (
                            <div className="absolute inset-0 bg-card flex items-center justify-center rounded-xl z-50">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                            </div>
                        )}

                        {
                            token.is_completed &&
                            <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-xl z-30 border">
                                <div className="space-y-5">
                                    <Link href={`https://app.thala.fi/swap?coinIn=${chainToken.fa_addr}&coinOut=${token.main_addr}`} target="_blank">
                                    <H1 className="text-xl md:text-4xl"><span className="uppercase text-primary font-bold">Graduated</span>, <span className="text-[#FC79C9]">Moved to Thala</span></H1>
                                    </Link>
                                    <div className="line p-1 w-full bg-gradient-to-r from-[#FC79C9] to-primary rounded-full"></div>
                                </div>
                            </div>
                        }
                    </div>
                    <ActivityTab
                        trades={trades}
                        tradeCount={tradeCount}
                        tradeOffset={tradeOffset}
                        setTradeOffset={setTradeOffset}
                        token={token}
                        chats={chats}
                        chatCount={chatCount}
                        setChatOffset={setChatOffset}
                        chatOffset={chatOffset}
                        authToken={authToken}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function DesktopView({
    token,
    chartData,
    trades,
    tradeOffset,
    tradeCount,
    setTradeOffset,
    chats,
    chatOffset,
    setChatOffset,
    chatCount,
    holders,
    userPNL,
    authToken,
    chartLoading,
    onIntervalChange,
    chartInterval
}: ViewProps) {
    const { account } = useWallet()
     const { chainToken } = useApp()
    return (
        <section className="p-8 hidden lg:grid grid-cols-3 gap-4 md:gap-6 h-full">
            <div className="space-y-4 md:space-y-8 col-span-2">
                <TokenInfo token={token} />
                <div className="bg-card relative space-y-2 rounded-xl p-3 flex flex-col items-start">
                    <IntervalTabs
                        currentInterval={chartInterval}
                        onIntervalChange={onIntervalChange}
                    />
                    <div className="relative w-full">
                        <Chart data={chartData} isDev={account?.address.toString() === token.created_by} />
                    </div>

                    {chartLoading && (
                        <div className="absolute inset-0 bg-card flex items-center justify-center rounded-xl z-50">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                        </div>
                    )}

                    {
                        token.is_completed &&
                        <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-xl z-30 border">
                            <div className="space-y-5">
                                <Link href={`https://app.thala.fi/swap?coinIn=${chainToken.fa_addr}&coinOut=${token.main_addr}`} target="_blank">
                                    <H1 className="md:text-4xl"><span className="uppercase text-primary font-bold">Graduated</span>, <span className="text-[#FC79C9]">Moved to Thala</span></H1>
                                </Link>
                                <div className="line p-1 w-full bg-gradient-to-r from-[#FC79C9] to-primary rounded-full"></div>
                            </div>
                        </div>

                    }
                </div>


                <ActivityTab
                    authToken={authToken}
                    token={token}
                    trades={trades}
                    tradeCount={tradeCount}
                    tradeOffset={tradeOffset}
                    setTradeOffset={setTradeOffset}
                    chats={chats}
                    chatCount={chatCount}
                    setChatOffset={setChatOffset}
                    chatOffset={chatOffset}
                />
            </div>
            <div className="space-y-4 md:space-y-8">
                <div className="bg-card rounded-[12px] p-4 flex flex-col md:flex-col">
                    <div className="flex flex-col-reverse md:flex-col gap-8">
                        <TokenDescription token={token} />
                        <Swap token={token} userPNL={userPNL} />
                    </div>
                </div>
                <Holders data={holders} dev={token.created_by} />
            </div>
        </section>
    )
}

interface ActivityTabProps {
    token: Token;
    trades: Trade[];
    tradeOffset: number;
    setTradeOffset: Dispatch<SetStateAction<number>>;
    tradeCount: number;
    chats: Chat[];
    chatOffset: number;
    setChatOffset: Dispatch<SetStateAction<number>>;
    chatCount: number;
    authToken?: string;
    tradesLoading?: boolean;
    chatsLoading?: boolean;
}

function ActivityTab({
    authToken,
    token,
    trades,
    tradeCount,
    tradeOffset,
    setTradeOffset,
    chats,
    chatCount,
    chatOffset,
    setChatOffset,
    tradesLoading = false,
    chatsLoading = false
}: ActivityTabProps) {
    return (
        <Tabs defaultValue="trades" className="w-full gap-4 md:gap-6 mt-8">
            <TabsList className="grid w-[95%] mx-auto md:mx-0 md:w-sm grid-cols-3 rounded-full bg-card">
                <TabsTrigger value="trades" className="cursor-pointer rounded-full ">Recent Trades</TabsTrigger>
                <TabsTrigger value="chats" className="cursor-pointer rounded-full ">Chats</TabsTrigger>
                <TabsTrigger value="stream" className="cursor-pointer rounded-full ">Stream</TabsTrigger>
            </TabsList>
            <TabsContent value="trades">
                {tradesLoading ? (
                    <div className="flex justify-center p-8">
                        {/* <Loader /> */}
                    </div>
                ) : (
                    <Trades data={trades} token={token} count={tradeCount} offset={tradeOffset} setOffset={setTradeOffset} />
                )}
            </TabsContent>
            <TabsContent value="chats">
                {chatsLoading ? (
                    <div className="flex justify-center p-8">
                        {/* <Loader /> */}
                    </div>
                ) : (
                    <ChatContainer
                        authToken={authToken}
                        data={chats}
                        token={token}
                        offset={chatOffset}
                        setOffset={setChatOffset}
                        count={chatCount}
                    />
                )}
            </TabsContent>
            <TabsContent value="stream">
                <Empty title="📺 Coming Soon." description="Stream is not live yet." />
            </TabsContent>
        </Tabs>
    )
}