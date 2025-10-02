"use client"

import Api from "@/lib/api";
import { Token } from "@/types/custom"
import React, { useEffect, useState } from "react"
import { TokenInfo } from "./TokenInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { socket } from "@/utils/socket-io-client";
import { Loader } from '@/components/Loader';
interface PlayToggle {
    bump: boolean;
    near: boolean;
    graduated: boolean;
}

export function Body() {
    const [bumpTokens, setBumpTokens] = useState<Token[]>([]);
    const [nearTokens, setNearTokens] = useState<Token[]>([]);
    const [graduatedTokens, setGraduatedTokens] = useState<Token[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [socketPlaying, setSocketPlaying] = useState<PlayToggle>({
        bump: true,
        near: true,
        graduated: true
    });
    useEffect(() => {
        async function getTokens() {
            try {
                setIsLoading(true);
                const [res1, res2, res3] = await Promise.all([
                    Api.sendBackendRequest(`/api/token/get?sort_by=bump&sort_order=desc&offset=0&limit=10`, "GET", undefined, undefined, { "Accept-Encoding": "gzip" }),
                    Api.sendBackendRequest(`/api/token/get?sort_by=near&sort_order=desc&offset=0&limit=10`, "GET", undefined, undefined, { "Accept-Encoding": "gzip" }),
                    Api.sendBackendRequest(`/api/token/get?sort_by=graduated&sort_order=desc&offset=0&limit=10`, "GET", undefined, undefined, { "Accept-Encoding": "gzip" }),
                ]);
                setBumpTokens(res1.data as Token[]);
                setNearTokens(res2.data as Token[]);
                setGraduatedTokens(res3.data as Token[]);
            } catch (error) {
                console.log(`[error-home-getTokens]: ${error}`);
            } finally {
                setIsLoading(false);
            }
        };
        getTokens();
    }, []);

    const onPlayToggle = (from: "bump" | "near" | "graduated") => {
        if (from === "bump") {
            return setSocketPlaying({ ...socketPlaying, bump: !socketPlaying.bump })
        } else if (from === "near") {
            return setSocketPlaying({ ...socketPlaying, near: !socketPlaying.near })
        } else {
            return setSocketPlaying({ ...socketPlaying, graduated: !socketPlaying.graduated })
        }
    }

    useEffect(() => {
        if (!socketPlaying.bump) return;
        const bumpHandler = (data: Token) => {
            setBumpTokens((prev) => {
                return [data, ...prev.filter((v) => v.pre_addr !== data.pre_addr)]
            })
        }
        socket.on(`token-traded`, bumpHandler);
        socket.on(`token-created`, bumpHandler);
        return () => {
            socket.off(`token-traded`, bumpHandler);
            socket.off(`token-created`, bumpHandler);
        };
    }, [socketPlaying])

    useEffect(() => {
        if (!socketPlaying.near) return;
        const nearHandler = (data: Token) => {
            setNearTokens(prev => {
                return [data, ...prev.filter((v) => v.pre_addr !== data.pre_addr)]
            })
        };
        socket.on(`token-near`, nearHandler);
        return () => {
            socket.off(`token-near`, nearHandler);
        };
    }, [socketPlaying])

    useEffect(() => {
        if (!socketPlaying.near) return;
        const graduatedHandler = (data: Token) => {
            setGraduatedTokens(prev => {
                return [data, ...prev.filter((v) => v.pre_addr !== data.pre_addr)]
            })
            setNearTokens(prev => {
                return [...prev.filter(t => t.pre_addr !== data.pre_addr)]
            })
        };
        socket.on(`token-graduated`, graduatedHandler);
        return () => {
            socket.off(`token-graduated`, graduatedHandler);
        };
    }, [socketPlaying])

    // Show loading spinner while data is being fetched
    if (isLoading) {
        return <Loader />;
    }

    return (
        <React.Fragment>
            <DesktopView
                bumped={bumpTokens}
                near={nearTokens}
                graduated={graduatedTokens}
                play={socketPlaying}
                onPlayToggle={onPlayToggle}
            />
            <PhoneView
                bumped={bumpTokens}
                near={nearTokens}
                graduated={graduatedTokens}
                play={socketPlaying}
                onPlayToggle={onPlayToggle}
            />
        </React.Fragment>
    )
}

type ViewProps = {
    bumped: Token[];
    near: Token[];
    graduated: Token[];
    play: PlayToggle;
    onPlayToggle: (from: "bump" | "near" | "graduated") => void;
}

function PhoneView({ bumped, near, graduated, play, onPlayToggle }: ViewProps) {

    return (
        <div className="px-4 lg:hidden">
            <Tabs defaultValue="popular" className="h-full mt-4">
                <TabsList className="flex mx-auto gap-2 rounded-full bg-card">
                    <TabsTrigger value="popular" className="rounded-full px-3">
                        Popular
                    </TabsTrigger>
                    <TabsTrigger value="about-to-graduate" className="rounded-full px-3">
                        About to graduate
                    </TabsTrigger>
                    <TabsTrigger value="graduated" className="rounded-full px-3">
                        Graduated
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="popular"
                    className="overflow-hidden"
                    style={{ overflowY: "scroll" }}
                >
                    <TokenInfo
                        title="Popular"
                        color="#FC79C9"
                        data={bumped}
                        play={play.bump}
                        onToggle={() => onPlayToggle("bump")}
                    />
                </TabsContent>

                <TabsContent
                    value="about-to-graduate"
                    className="overflow-hidden"
                    style={{ overflowY: "scroll" }}
                >
                    <TokenInfo
                        title="About to graduate"
                        color="#FF9000"
                        data={near}
                        play={play.near}
                        onToggle={() => onPlayToggle("near")}
                    />
                </TabsContent>

                <TabsContent
                    value="graduated"
                    className="overflow-hidden"
                    style={{ overflowY: "scroll" }}
                >
                    <TokenInfo
                        title="Graduated"
                        color="#FFE500"
                        data={graduated}
                        play={play.graduated}
                        onToggle={() => onPlayToggle("graduated")}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function DesktopView({ bumped, near, graduated, play, onPlayToggle }: ViewProps) {
    return (
        <div className="p-1 md:p-8 hidden lg:grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100dvh-8.75rem)]">
            <TokenInfo
                title="Popular"
                color="#FC79C9"
                data={bumped}
                play={play.bump}
                onToggle={() => onPlayToggle("bump")}
            />
            <TokenInfo
                title="About to graduate"
                color="#FF9000"
                data={near}
                play={play.near}
                onToggle={() => onPlayToggle("near")}
            />
            <TokenInfo
                title="Graduated"
                color="#FFE500"
                data={graduated}
                play={play.graduated}
                onToggle={() => onPlayToggle("graduated")}
            />
        </div>
    )
}