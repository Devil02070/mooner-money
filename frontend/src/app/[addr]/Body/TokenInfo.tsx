"use client"

import { H2, H3, Label12, Label14, PSemiBold, XS, XSMedium } from "@/components/ui/typography";
import { getAccountOnExplorer } from "@/lib/aptos";
import { getBondingProgress, getMarketCap } from "@/lib/math";
import { Token } from "@/types/custom"
import { shortenAddress } from "@/utils/shortenAddress";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { LuUser } from "react-icons/lu";
import { PiCrown, PiTelegramLogo, PiUsersFill } from "react-icons/pi";
import { RiGlobalLine, RiTwitterXLine } from "react-icons/ri";
import { useApp } from "@/providers/AppProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FiClock } from "react-icons/fi";
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import { BsHeadsetVr } from "react-icons/bs";
import { beautifyNumber } from "@/utils/beautifyNumbers";
import { CopyButton } from "@/components/CopyButton";
import { MdOutlineVerified } from "react-icons/md";

dayjs.extend(relativeTime)

interface TokenInfoProps {
    token: Token;
}
export function TokenInfo({ token }: TokenInfoProps) {
    const { chainToken } = useApp()
    const currentTokenReserves = token.last_trade ? token.last_trade.virtual_token_reserves : token.virtual_token_reserves;
    const currentAptosReserves = token.last_trade ? token.last_trade.virtual_aptos_reserves : token.virtual_aptos_reserves;
    const bondingProgress = getBondingProgress(
        Number(currentTokenReserves),
        Number(token.virtual_token_reserves),
        Number(token.remain_token_reserves)
    );

    const marketCapInAptos = getMarketCap(
        Number(currentAptosReserves),
        Number(currentTokenReserves),
        Number(token.virtual_token_reserves),
    ) / Math.pow(10, chainToken.decimals);

    const volumeInAptos = Number(token.volume) / Math.pow(10, chainToken.decimals);

    // const marketCap = chainToken.price ? `$${marketCapInAptos * chainToken.price}` : `${marketCapInAptos}`;
    // const volume = chainToken.price ? `$${volumeInAptos * chainToken.price}` : `${volumeInAptos}`;
    const marketCap = chainToken.price ? `${beautifyNumber(marketCapInAptos * chainToken.price, { showDollar: true })}` : `${beautifyNumber(marketCapInAptos)}`;
    const volume = chainToken.price ? `${beautifyNumber(volumeInAptos * chainToken.price, { showDollar: true, maxDigitsAfterZeros: 2 })}` : `${beautifyNumber(volumeInAptos, { maxDigitsAfterZeros: 2 })}`;
    const txns = Number(token.buy_count) + Number(token.sell_count);
    const buyPercent = txns > 0 ? (Number(token.buy_count) / txns) * 100 : 50;
    const sellPercent = txns > 0 ? (Number(token.sell_count) / txns) * 100 : 50;

    return (
        <React.Fragment>
            <DesktopView
                token={token}
                marketCap={marketCap}
                volume={volume}
                txns={txns}
                buyPercent={buyPercent}
                sellPercent={sellPercent}
                bondingProgress={bondingProgress}
            />
            <PhoneView
                token={token}
                marketCap={marketCap}
                volume={volume}
                txns={txns}
                buyPercent={buyPercent}
                sellPercent={sellPercent}
                bondingProgress={bondingProgress}
            />
        </React.Fragment>
    )
}

interface ViewProps {
    token: Token;
    marketCap: string;
    volume: string;
    txns: number;
    buyPercent: number;
    sellPercent: number;
    bondingProgress: number;
}

function DesktopView({ token, marketCap, volume, txns, buyPercent, sellPercent }: ViewProps) {
    return (
        // <div className="hidden md:flex border-2 border-neutral-70 rounded-2xl p-3 gap-4">
        <div className="hidden md:flex border-2 border-border rounded-2xl p-3 gap-3">
            <div className="w-15 h-15 rounded-md overflow-hidden border">
                <Image
                    src={token.image}
                    alt={token.symbol}
                    height={100}
                    width={100}
                    className="h-15 w-15 object-cover"
                />
            </div>
            <div className="w-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <H2 className="font-bold">{token.symbol}</H2>
                            {token.creator?.x_username ? (
                                <Link
                                    // href={getAccountOnX(token.creator.x_username)}
                                    href={`/user/${token.creator.address}`}
                                    target="_blank"
                                    className="flex items-center gap-1"
                                >
                                    <PSemiBold className="flex items-center gap-1 text-muted">
                                        <RiTwitterXLine className="h-3 w-3" />
                                        {token.creator.x_username}
                                    </PSemiBold>
                                    {token.creator.x_verified && <MdOutlineVerified  className="text-blue-500"/>}
                                </Link>
                            ) : (
                                <Link
                                    href={getAccountOnExplorer(token.created_by)}
                                    target="_blank"
                                >
                                    <PSemiBold className="flex items-center gap-1 text-muted">
                                        <LuUser />
                                        {shortenAddress(token.created_by)}
                                    </PSemiBold>
                                </Link>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {token.twitter && (
                                <Link target="_blank" href={token.twitter}>
                                    <RiTwitterXLine className="h-4 w-4" />
                                </Link>
                            )}
                            {token.website && (
                                <Link target="_blank" href={token.website}>
                                    <RiGlobalLine className="h-4 w-4" />
                                </Link>
                            )}
                            {token.telegram && (
                                <Link target="_blank" href={token.telegram}>
                                    <PiTelegramLogo className="h-4 w-4" />
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label12 className="text-muted">C.A</Label12>
                                <PSemiBold>{shortenAddress(token.main_addr)}</PSemiBold>
                                <CopyButton text={token.main_addr} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label12 className="text-muted">Pre C.A</Label12>
                                <PSemiBold>{shortenAddress(token.pre_addr)}</PSemiBold>
                                <CopyButton text={token.pre_addr} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between h-full flex-col items-end gap-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label14>Market cap</Label14>
                                <H3 className="text-[#00ECF6]">
                                    {marketCap}
                                </H3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label14 >Volume</Label14>
                                <H3>
                                    {volume}
                                </H3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label14 className="uppercase text-muted">TXN</Label14>
                            <H3>{txns}</H3>
                            <div className="flex items-center w-24 gap-1 h-2">
                                <div style={{ width: `${buyPercent}%` }} className="h-1 rounded-full bg-success"></div>
                                <div style={{ width: `${sellPercent}%` }} className="h-1 rounded-full bg-danger"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PhoneView({ token, marketCap, volume, txns, buyPercent, sellPercent, bondingProgress }: ViewProps) {
    return (
        <div className="md:hidden flex border-2 border-neutral-70 rounded-md p-2 gap-2">
            <div className="flex-shrink-0">
                <Tooltip>
                    <TooltipTrigger>
                        <div className="w-16 h-16 rounded-md overflow-hidden border">
                            <Image
                                src={token.image}
                                alt={token.symbol}
                                height={100}
                                width={100}
                                className="object-cover h-full"
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Bonding: {bondingProgress}%</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="space-y-1 w-full flex flex-col justify-between">
                <div className="flex justify-between">
                    <div className="flex flex-col h-16 justify-between">
                        <div className="flex items-center gap-1">
                            <Label14 className="flex items-center gap-2 font-bold">
                                {/* <Link href={`/token/${token.pool_addr}`}> */}
                                {token.symbol}
                                {/* </Link> */}
                            </Label14>
                            {token.creator?.x_username ? (
                                <Link
                                    // href={getAccountOnX(token.creator.x_username)}
                                    href={`/user/${token.creator.address}`}
                                    target="_blank"
                                    className="flex items-center gap-1"
                                >
                                    <XS className="flex items-center gap-1 text-muted">
                                        <RiTwitterXLine className="h-3 w-3" />
                                        {token.creator.x_username}
                                    </XS>
                                    {token.creator.x_verified && <MdOutlineVerified  className="text-blue-500"/>}
                                </Link>
                            ) : (
                                <Link target="_blank" href={getAccountOnExplorer(token.created_by)}>
                                    <XS className="flex items-center gap-1 text-muted">
                                        <LuUser />
                                        {shortenAddress(token.created_by)}
                                    </XS>
                                </Link>
                            )}

                        </div>

                        <div className="flex gap-2">
                            {token.twitter && (
                                <Link target="_blank" href={token.twitter}>
                                    <RiTwitterXLine className="h-3 w-3" />
                                </Link>
                            )}
                            {token.website && (
                                <Link target="_blank" href={token.website}>
                                    <RiGlobalLine className="h-3 w-3" />
                                </Link>
                            )}
                            {token.telegram && (
                                <Link target="_blank" href={token.telegram}>
                                    <PiTelegramLogo className="h-3 w-3" />
                                </Link>
                            )}
                        </div>

                        <XS className="flex justify-between flex-wrap gap-2 p-0 items-end mt-0">
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer">
                                    <XS className="flex items-center gap-0.5">
                                        <FiClock className="text-[#49F95B] h-3 w-3" />
                                        {dayjs.unix(Number(token.ts)).fromNow()}
                                    </XS>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Time since creation</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer">
                                    <XS className="flex items-center gap-0.5">
                                        <PiUsersFill className="text-[#F7CB54] h-3 w-3" />
                                        {token.holders_count}
                                    </XS>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Total Holders</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer">
                                    <XS className="flex items-center gap-0.5">
                                        <PiCrown className="text-[#ED58FD] h-3 w-3" />
                                        {token.top_ten_holdings.toFixed(2)}%
                                    </XS>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Top 10 Holdings</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer">
                                    <XS className="flex items-center gap-0.5">
                                        <BsHeadsetVr className="text-[#6C9DFF] h-3 w-3" />
                                        {token.dev_holding.toFixed(2)}%
                                    </XS>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Dev Holdings</p>
                                </TooltipContent>
                            </Tooltip>
                        </XS>
                    </div>

                    <div className="flex flex-col h-16 items-end justify-between">
                        <div className="flex items-center gap-1">
                            <XSMedium className="uppercase text-muted">MC</XSMedium>
                            <Label12 className="text-[#00ECF6]">
                                {marketCap}
                            </Label12>
                        </div>
                        <div className="flex items-center gap-1">
                            <XSMedium className="uppercase text-muted">VOL</XSMedium>
                            <Label12>
                                {volume}
                            </Label12>
                        </div>
                        <div className="flex items-center gap-1">
                            <XSMedium className="uppercase text-muted">TXN</XSMedium>
                            <Label12>{txns}</Label12>
                            <div className="flex items-center w-20 gap-1 h-2">
                                <div style={{ width: `${buyPercent}%` }} className="h-1 rounded-full bg-success"></div>
                                <div style={{ width: `${sellPercent}%` }} className="h-1 rounded-full bg-danger"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}