"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { H3, Label12, Label14, PMedium, XS } from "@/components/ui/typography";
import { Token } from "@/types/custom";
import { FiClock } from "react-icons/fi";
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import { PiCrown, PiUsersFill } from "react-icons/pi";
import { BsHeadsetVr } from "react-icons/bs";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAmountToRaise } from "@/lib/math";
import { beautifyNumber } from "@/utils/beautifyNumbers";
import { useApp } from "@/providers/AppProvider";
dayjs.extend(relativeTime)

interface TokenDescriptionProps {
    token: Token;
}

export function TokenDescription({ token }: TokenDescriptionProps) {
    const { config, chainToken } = useApp()
    const currentTokenReserves = token.last_trade ? token.last_trade.virtual_token_reserves : token.virtual_token_reserves;
    const currentAptosReserves = token.last_trade ? token.last_trade.virtual_aptos_reserves : token.virtual_aptos_reserves;
    const tokensLeft = (Number(currentTokenReserves) - (Number(token.virtual_token_reserves) * (config?.locked_percentage ?? 2000) / 10000)) / Math.pow(10, config?.decimals ?? 6);
    const aptosInCurve = (Number(currentAptosReserves) - (config?.virtual_aptos_reserves ?? 30000000000)) / Math.pow(10, chainToken.decimals)
    return (
        <div className='space-y-5'>
            <div className="flex justify-between">
                <H3>{token.name}</H3>
                <XS className="hidden md:flex justify-between gap-2 p-0 items-end mt-0">
                    <div>
                        <Tooltip>
                            <TooltipTrigger className="cursor-pointer">
                                <Label12 className=" flex items-center gap-0.5"><FiClock className="text-[#49F95B] h-3 w-3" />{dayjs.unix(Number(token.ts)).fromNow()}</Label12>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Token creation time</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip>
                            <TooltipTrigger className="cursor-pointer">
                                <Label12 className=" flex items-center gap-0.5"><PiUsersFill className="text-[#F7CB54] h-3 w-3" />{beautifyNumber(token.holders_count)}</Label12>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Number of holders</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip>
                            <TooltipTrigger className="cursor-pointer">
                                <Label12 className=" flex items-center gap-0.5"><PiCrown className="text-[#ED58FD] h-3 w-3" />{beautifyNumber(token.top_ten_holdings, { maxDigitsAfterZeros: 2 })}%</Label12>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Top 10 holdings</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip>
                            <TooltipTrigger className="cursor-pointer">
                                <Label12 className=" flex items-center gap-0.5"><BsHeadsetVr className="text-[#6C9DFF] h-3 w-3" />{beautifyNumber(token.dev_holding, { maxDigitsAfterZeros: 2 })}%</Label12>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Dev Holdings</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </XS>
            </div>

            {/* <PMedium>
                {token.description}
            </PMedium> */}
            <PMedium className="max-h-[45px] overflow-y-auto cs-scroll">
                {token.description}
            </PMedium>
            <div className='w-full space-y-2.5'>
                <div className='flex w-full items-center justify-between'>
                    <Tooltip>
                        <TooltipTrigger>
                            <div className='flex gap-2 items-center'>
                                <Label12>Bonding curve progress</Label12>
                                <Info className='size-3' />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">When {config ? getAmountToRaise(config.virtual_aptos_reserves, config.supply * Math.pow(10, chainToken.decimals), config.locked_percentage) / Math.pow(10, chainToken.decimals) : 1200} APT is raised, all the liquidity from the bonding curve will be deposited into Thala and burned. the price goes up as raise progresses.

                            There are {tokensLeft} tokens still available for sale in the bonding curve and there is {aptosInCurve} {chainToken.symbol} in the bonding curve</TooltipContent>
                    </Tooltip>

                    <Label14>{beautifyNumber(token.bonding_curve)}%</Label14>
                </div>

                <div className='w-full h-2 bg-gray-200 rounded-full relative overflow-hidden'>
                    <div
                        className={cn(
                            'h-2 rounded-full transition-all duration-500 ease-in-out',
                            token.bonding_curve < 50 ? 'bg-[#FC79C9]' : token.bonding_curve < 80 ? 'bg-[#FC79C9]' : 'bg-[#FC79C9]'
                        )}
                        style={{ width: `${token.bonding_curve}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

