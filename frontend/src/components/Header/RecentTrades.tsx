"use client";
import { ArrowDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import { RecentTrade } from "@/types/custom";
import { useApp } from "@/providers/AppProvider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { beautifyNumber } from "@/utils/beautifyNumbers";

interface RecentTradesProps {
    trades: RecentTrade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
    const { chainToken } = useApp();
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (containerRef.current && contentRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const contentWidth = contentRef.current.scrollWidth;
            setShouldAnimate(contentWidth > containerWidth);
        }
    }, [trades]);

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-background text-foreground pt-3"
        >
            <div
                ref={contentRef}
                className={`flex ${shouldAnimate ? "animate-marquee" : ""}`}
            >
                {trades.map((trade) => (
                    <Link
                        prefetch
                        key={`trade-${trade.txn_version}`}
                        href={`/${trade.token_address}`}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap px-5 flex-shrink-0">
                            <Image
                                src={trade.token.image}
                                alt={trade.token.symbol}
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded-full bg-card object-cover border"
                            />
                            <span className="font-semibold">{trade.token.symbol}</span>
                            <div className={`flex gap-1 items-center ${trade.is_buy ? "text-success" : "text-danger"}`} >
                                {trade.is_buy ? (
                                    <ArrowUp className="size-4" />
                                ) : (
                                    <ArrowDown className="size-4" />
                                )}
                                <span className="font-semibold">
                                    {beautifyNumber(Number(trade.aptos_amount) /
                                        Math.pow(10, chainToken.decimals))}
                                </span>
                                <span>{chainToken.symbol}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
