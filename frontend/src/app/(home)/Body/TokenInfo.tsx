import Link from "next/link"
import Image from "next/image"
import React from "react"
import { LuUser } from "react-icons/lu"
import { PiCrown, PiTelegramLogo, PiUsersFill } from "react-icons/pi"
import { RiGlobalLine, RiTwitterXLine } from "react-icons/ri"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { shortenAddress } from "@/utils/shortenAddress"
import { H1, Label12, Label14, XS, XSMedium } from "@/components/ui/typography"
import { FiClock } from "react-icons/fi"
import { BsHeadsetVr } from "react-icons/bs"
import { Token } from "@/types/custom"
import { useApp } from "@/providers/AppProvider"
import { getMarketCap } from "@/lib/math"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import relativeTime from 'dayjs/plugin/relativeTime'
import { beautifyNumber } from "@/utils/beautifyNumbers"
import { IoPauseOutline, IoPlayOutline } from "react-icons/io5"
import { MdOutlineVerified } from "react-icons/md"
dayjs.extend(relativeTime)

interface TokenInfoProps {
    title: string;
    color: string;
    data: Token[];
    play: boolean;
    onToggle: () => void;
}

export function TokenInfo({
    title,
    color,
    data,
    play,
    onToggle
}: TokenInfoProps) {
    const router = useRouter();
    const { chainToken } = useApp();
    return (
        <div className="md:border-2 md:px-3 py-2 md:py-0 pb-3 scrollbar-hide h-[calc(100dvh-13.5rem)] md:h-[calc(100dvh-8rem)] 2xl:h-[calc(100dvh-8.6rem)] overflow-hidden overflow-y-scroll rounded-t-[12px] space-y-3 md:border-b-0">
            <div
                className={`hidden md:flex items-center justify-between py-3 px-3 sticky z-10 top-0 bg-background`}
                style={{ borderColor: `${color}` }}
            >
                <Label14 className={`font-bold`} style={{ color }}>{title}</Label14>
                <button
                    onClick={onToggle}
                    className="p-0 border-0 bg-transparent cursor-pointer"
                    aria-label={play ? "Pause" : "Play"}
                >
                    {play ? (
                        <IoPauseOutline />
                    ) : (
                        <IoPlayOutline />
                    )}
                </button>
            </div>
            {
                data.length === 0 &&
                <div className="flex items-center justify-center m-auto rounded-2xl w-full min-h-[calc(100dvh-14rem)] ">
                    <div className="not-found text-center">
                        <H1 className="text-muted">No tokens yet.</H1>
                    </div>
                </div>
            }
            <div className="space-y-3">
                {data.map(token => {
                    const currentTokenReserves = token.last_trade ? token.last_trade.virtual_token_reserves : token.virtual_token_reserves;
                    const currentAptosReserves = token.last_trade ? token.last_trade.virtual_aptos_reserves : token.virtual_aptos_reserves;

                    const marketCapInAptos = getMarketCap(
                        Number(currentAptosReserves),
                        Number(currentTokenReserves),
                        Number(token.virtual_token_reserves),
                    ) / Math.pow(10, chainToken.decimals);

                    const volumeInAptos = Number(token.volume) / Math.pow(10, chainToken.decimals);

                    const marketCap = chainToken.price ? `${beautifyNumber(marketCapInAptos * chainToken.price, { showDollar: true })}` : `${beautifyNumber(marketCapInAptos)}`;
                    const volume = chainToken.price ? `${beautifyNumber(volumeInAptos * chainToken.price, { showDollar: true, maxDigitsAfterZeros: 2 })}` : `${beautifyNumber(volumeInAptos, { maxDigitsAfterZeros: 2 })}`;
                    const txns = Number(token.buy_count) + Number(token.sell_count);
                    const buyPercent = txns > 0 ? (Number(token.buy_count) / txns) * 100 : 50;
                    const sellPercent = txns > 0 ? (Number(token.sell_count) / txns) * 100 : 50;
                    return (
                        <div
                            key={token.pre_addr}
                            className="flex border-2 border-neutral-70 rounded-md p-2 gap-2 hover:bg-neutral-900 transition-all duration-300 cursor-pointer"
                            onClick={() => {
                                router.push(`/${token.pre_addr}`)
                            }}
                        >
                            <div className="flex">
                                <div className="space-y-1.5">
                                    <div
                                        className="w-14 h-16 rounded-md p-[3px]"
                                        style={{
                                            background: `conic-gradient(${color} 0% ${token.bonding_curve}%, #bfbfbf ${token.bonding_curve}% 100%)`,
                                        }}
                                    >
                                        <div className="w-full h-full bg-background rounded-md overflow-hidden relative"
                                        >
                                            <Tooltip>
                                                <TooltipTrigger className="cursor-pointer">
                                                    <Image
                                                        src={token.image}
                                                        alt={token.symbol}
                                                        fill
                                                        loading="lazy"
                                                        className="object-cover"
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Bonding Cv.:{beautifyNumber(token.bonding_curve)}%</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 w-full flex flex-col justify-between">
                                <div className="flex justify-between gap-2">
                                    <div className="flex flex-col h-16 justify-between">
                                        <div className="flex items-center gap-1">
                                            <Label14 className="flex items-center gap-2 font-bold">
                                                {token.symbol}
                                            </Label14>

                                            <Link href={`/user/${token.creator?.address}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                                                {token.creator?.x_username ? (
                                                    <XS className="flex items-center gap-1 text-muted cursor-pointer">
                                                        <RiTwitterXLine className="h-3 w-3" />
                                                        {token.creator.x_username}
                                                        {token.creator.x_verified && <MdOutlineVerified className="text-blue-500 h-3 w-3" />}
                                                    </XS>
                                                ) : (
                                                    <XS className="flex items-center gap-1 text-muted cursor-pointer" >
                                                        <LuUser />
                                                        {shortenAddress(token.created_by)}
                                                    </XS>
                                                )}
                                            </Link>
                                        </div>

                                        <div className="flex gap-2">
                                            {token.twitter && <Link href={`${token.twitter}`} target="_blank" onClick={(e) => e.stopPropagation()}><RiTwitterXLine className="h-3 w-3" /></Link>}
                                            {token.website && <Link href={`${token.website}`} target="_blank" onClick={(e) => e.stopPropagation()}><RiGlobalLine className="h-3 w-3" /></Link>}
                                            {token.telegram && <Link href={`${token.telegram}`} target="_blank" onClick={(e) => e.stopPropagation()}><PiTelegramLogo className="h-3 w-3" /></Link>}
                                        </div>

                                        <XS className="flex justify-between flex-wrap 2xl:flex-nowrap gap-2 p-0 items-end mt-0">
                                            <Tooltip>
                                                <TooltipTrigger className="cursor-pointer">
                                                    <XS className="flex items-center gap-0.5">
                                                        <FiClock className="text-[#49F95B] h-3 w-3" />{dayjs.unix(Number(token.ts)).fromNow()}
                                                    </XS>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Token creation time</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger className="cursor-pointer">
                                                    <XS className="flex items-center gap-0.5">
                                                        <PiUsersFill className="text-[#F7CB54] h-3 w-3" />{token.holders_count}
                                                    </XS>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Number of holders</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger className="cursor-pointer">
                                                    <XS className="flex items-center gap-0.5">
                                                        <PiCrown className="text-[#ED58FD] h-3 w-3" />{token.top_ten_holdings.toFixed(2)}%
                                                    </XS>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Top 10 Holdings</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger className="cursor-pointer">
                                                    <XS className="flex items-center gap-0.5">
                                                        <BsHeadsetVr className="text-[#6C9DFF] h-3 w-3" />{token.dev_holding.toFixed(2)}%
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
                                            <Label12 className="text-[#00ECF6]">{marketCap}</Label12>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <XSMedium className="uppercase text-muted">VOL</XSMedium>
                                            <Label12>{volume}</Label12>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <XSMedium className="uppercase text-muted">TXNS</XSMedium>
                                            <Label12>{txns}</Label12>
                                            <div className="flex items-center w-10 xl:w-20 gap-1 h-2">
                                                <div style={{
                                                    width: `${beautifyNumber(sellPercent, { maxDigitsAfterZeros: 2 })}%`
                                                }} className={`h-1 rounded-full flex bg-danger`}></div>
                                                <div style={{
                                                    width: `${beautifyNumber(buyPercent, { maxDigitsAfterZeros: 2 })}%`
                                                }} className={`h-1 rounded-full flex bg-success`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div >
    )
}


// import Link from "next/link"
// import Image from "next/image"
// import React from "react"
// import { LuUser } from "react-icons/lu"
// import { PiCrown, PiTelegramLogo, PiUsersFill } from "react-icons/pi"
// import { RiGlobalLine, RiTwitterXLine } from "react-icons/ri"
// import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
// import { shortenAddress } from "@/utils/shortenAddress"
// import { Label12, Label14, XS, XSMedium } from "@/components/ui/typography"
// import { FiClock } from "react-icons/fi"
// import { BsHeadsetVr } from "react-icons/bs"
// import { Token } from "@/types/custom"
// import { useApp } from "@/providers/AppProvider"
// import { getBondingProgress, getMarketCap } from "@/lib/math"
// import { getAccountOnX } from "@/lib/aptos"
// import dayjs from "dayjs"
// import { useRouter } from "next/navigation"
// import relativeTime from 'dayjs/plugin/relativeTime'
// import { beautifyNumber } from "@/utils/beautifyNumbers"
// import { PlayPauseToggle } from "@/components/PlayPauseToggle"
// import { IoPauseOutline, IoPlayOutline } from "react-icons/io5"
// import { MdOutlineVerified } from "react-icons/md"
// dayjs.extend(relativeTime)

// interface TokenInfoProps {
//     title: string;
//     color: string;
//     data: Token[];
//     play: boolean;
//     onToggle: () => void;
// }

// export function TokenInfo({
//     title,
//     color,
//     data,
//     play,
//     onToggle
// }: TokenInfoProps) {
//     const router = useRouter();
//     const { chainToken } = useApp();
//     return (
//         // <div className="border-2 px-3 py-2 md:py-0 pb-3 scrollbar-hide h-[calc(100dvh-14.375rem)] md:h-[calc(100dvh-8.75rem)] overflow-hidden overflow-y-scroll rounded-[12px] space-y-3">
//         <div className="md:border-2 md:px-3 py-2 md:py-0 pb-3 scrollbar-hide h-[calc(100dvh-13.5rem)] md:h-[calc(100dvh-8rem)] 2xl:h-[calc(100dvh-8.6rem)] overflow-hidden overflow-y-scroll rounded-t-[12px] space-y-3 md:border-b-0">
//             <div
//                 className={`hidden md:flex items-center justify-between py-3 px-3 sticky z-10 top-0 bg-background`}
//                 style={{ borderColor: `${color}` }}
//             >
//                 <Label14 className={`font-bold`} style={{ color }}>{title}</Label14>
//                 <button
//                     onClick={onToggle}
//                     className="p-0 border-0 bg-transparent"
//                     aria-label={play ? "Pause" : "Play"}
//                 >
//                     {play ? (
//                         <IoPauseOutline />
//                     ) : (
//                         <IoPlayOutline />
//                     )}
//                 </button>
//             </div>
//             <div className="space-y-3">
//                 {data.map(token => {
//                     const currentTokenReserves = token.last_trade ? token.last_trade.virtual_token_reserves : token.virtual_token_reserves;
//                     const currentAptosReserves = token.last_trade ? token.last_trade.virtual_aptos_reserves : token.virtual_aptos_reserves;

//                     const marketCapInAptos = getMarketCap(
//                         Number(currentAptosReserves),
//                         Number(currentTokenReserves),
//                         Number(token.virtual_token_reserves),
//                     ) / Math.pow(10, chainToken.decimals);

//                     const volumeInAptos = Number(token.volume) / Math.pow(10, chainToken.decimals);

//                     const marketCap = chainToken.price ? `${beautifyNumber(marketCapInAptos * chainToken.price, { showDollar: true })}` : `${beautifyNumber(marketCapInAptos)}`;
//                     const volume = chainToken.price ? `${beautifyNumber(volumeInAptos * chainToken.price, { showDollar: true, maxDigitsAfterZeros: 2 })}` : `${beautifyNumber(volumeInAptos, { maxDigitsAfterZeros: 2 })}`;
//                     const txns = Number(token.buy_count) + Number(token.sell_count);
//                     const buyPercent = txns > 0 ? (Number(token.buy_count) / txns) * 100 : 50;
//                     const sellPercent = txns > 0 ? (Number(token.sell_count) / txns) * 100 : 50;
//                     return (
//                         <Link
//                             prefetch
//                             href={`/${token.pre_addr}`}
//                             key={token.pre_addr}
//                             className="flex border-2 border-neutral-70 rounded-md p-2 gap-2 hover:bg-neutral-900 transition-all duration-300"
//                         >
//                             <div className="flex">
//                                 <div className="space-y-1.5">
//                                     <div
//                                         className="w-14 h-16 rounded-md p-[3px]"
//                                         style={{
//                                             background: `conic-gradient(${color} 0% ${token.bonding_curve}%, #bfbfbf ${token.bonding_curve}% 100%)`,
//                                         }}
//                                     >
//                                         <div className="w-full h-full bg-background rounded-md overflow-hidden relative"
//                                         >
//                                             <Tooltip>
//                                                 <TooltipTrigger className="cursor-pointer">
//                                                     <Image
//                                                         src={token.image}
//                                                         alt={token.symbol}
//                                                         fill
//                                                         // priority
//                                                         loading="lazy"
//                                                         className="object-cover"
//                                                     />
//                                                 </TooltipTrigger>
//                                                 <TooltipContent>
//                                                     <p>Bonding Cv.:{beautifyNumber(token.bonding_curve)}%</p>
//                                                 </TooltipContent>
//                                             </Tooltip>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="space-y-1 w-full flex flex-col justify-between">
//                                 <div className="flex justify-between gap-2">
//                                     <div className="flex flex-col h-16 justify-between">
//                                         <div className="flex items-center gap-1">
//                                             <Label14 className="flex items-center gap-2 font-bold">
//                                                 {token.symbol}
//                                             </Label14>
//                                             {token.creator?.x_username ? (
//                                                 <XS className="flex items-center gap-1 text-muted cursor-pointer" onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     e.preventDefault();
//                                                     // if (token.creator?.x_username) {
//                                                     //     window.open(getAccountOnX(token.creator.x_username), "_blank")
//                                                     // }
//                                                     if (token.creator?.address) {
//                                                         window.open(`/user/${token.creator.address}`)
//                                                     }
//                                                 }}>
//                                                     <RiTwitterXLine className="h-3 w-3" />
//                                                     {token.creator.x_username}
//                                                     {token.creator.x_verified && <MdOutlineVerified className="text-blue-500 h-3 w-3" />}
//                                                 </XS>
//                                             ) : (
//                                                 <XS className="flex items-center gap-1 text-muted cursor-pointer" onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     router.push(`/user/${token.created_by}`);
//                                                 }}>
//                                                     <LuUser />
//                                                     {shortenAddress(token.created_by)}
//                                                 </XS>
//                                             )}
//                                         </div>

//                                         <div className="flex gap-2">
//                                             {token.twitter && (
//                                                 <RiTwitterXLine className="h-3 w-3" onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     e.preventDefault();
//                                                     window.open(token.twitter || "", "_blank", "noopener,noreferrer");
//                                                 }} />
//                                             )}
//                                             {token.website && (

//                                                 <RiGlobalLine className="h-3 w-3" onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     e.preventDefault();
//                                                     window.open(token.website || "", "_blank", "noopener,noreferrer");
//                                                 }} />

//                                             )}
//                                             {token.telegram && (

//                                                 <PiTelegramLogo className="h-3 w-3" onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     e.preventDefault();
//                                                     window.open(token.telegram || "", "_blank", "noopener,noreferrer");
//                                                 }} />

//                                             )}
//                                         </div>

//                                         <XS className="flex justify-between flex-wrap 2xl:flex-nowrap gap-2 p-0 items-end mt-0">
//                                             <Tooltip>
//                                                 <TooltipTrigger className="cursor-pointer">
//                                                     <XS className="flex items-center gap-0.5">
//                                                         <FiClock className="text-[#49F95B] h-3 w-3" />{dayjs.unix(Number(token.ts)).fromNow()}
//                                                     </XS>
//                                                 </TooltipTrigger>
//                                                 <TooltipContent>
//                                                     <p>Token creation time</p>
//                                                 </TooltipContent>
//                                             </Tooltip>

//                                             <Tooltip>
//                                                 <TooltipTrigger className="cursor-pointer">
//                                                     <XS className="flex items-center gap-0.5">
//                                                         <PiUsersFill className="text-[#F7CB54] h-3 w-3" />{token.holders_count}
//                                                     </XS>
//                                                 </TooltipTrigger>
//                                                 <TooltipContent>
//                                                     <p>Number of holders</p>
//                                                 </TooltipContent>
//                                             </Tooltip>

//                                             <Tooltip>
//                                                 <TooltipTrigger className="cursor-pointer">
//                                                     <XS className="flex items-center gap-0.5">
//                                                         <PiCrown className="text-[#ED58FD] h-3 w-3" />{token.top_ten_holdings.toFixed(2)}%
//                                                     </XS>
//                                                 </TooltipTrigger>
//                                                 <TooltipContent>
//                                                     <p>Top 10 Holdings</p>
//                                                 </TooltipContent>
//                                             </Tooltip>

//                                             <Tooltip>
//                                                 <TooltipTrigger className="cursor-pointer">
//                                                     <XS className="flex items-center gap-0.5">
//                                                         <BsHeadsetVr className="text-[#6C9DFF] h-3 w-3" />{token.dev_holding.toFixed(2)}%
//                                                     </XS>
//                                                 </TooltipTrigger>
//                                                 <TooltipContent>
//                                                     <p>Dev Holdings</p>
//                                                 </TooltipContent>
//                                             </Tooltip>
//                                         </XS>
//                                     </div>

//                                     <div className="flex flex-col h-16 items-end justify-between">
//                                         <div className="flex items-center gap-1">
//                                             <XSMedium className="uppercase text-muted">MC</XSMedium>
//                                             <Label12 className="text-[#00ECF6]">{marketCap}</Label12>
//                                         </div>
//                                         <div className="flex items-center gap-1">
//                                             <XSMedium className="uppercase text-muted">VOL</XSMedium>
//                                             <Label12>{volume}</Label12>
//                                         </div>
//                                         <div className="flex items-center gap-1">
//                                             <XSMedium className="uppercase text-muted">TXNS</XSMedium>
//                                             <Label12>{txns}</Label12>
//                                             <div className="flex items-center w-10 xl:w-20 gap-1 h-2">
//                                                 <div style={{
//                                                     width: `${beautifyNumber(sellPercent, { maxDigitsAfterZeros: 2 })}%`
//                                                 }} className={`h-1 rounded-full flex bg-danger`}></div>
//                                                 <div style={{
//                                                     width: `${beautifyNumber(buyPercent, { maxDigitsAfterZeros: 2 })}%`
//                                                 }} className={`h-1 rounded-full flex bg-success`}></div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </Link>
//                     )
//                 })}
//             </div>
//         </div >
//     )
// }
