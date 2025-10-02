"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Label12, Label14, PMedium } from "@/components/ui/typography"
import clsx from "clsx"
import { PiUserList } from "react-icons/pi"
import { Token, Trade } from "@/types/custom"
import { useApp } from "@/providers/AppProvider"
import Link from "next/link"
import { getTxnOnExplorer } from "@/lib/aptos"
import { shortenAddress } from "@/utils/shortenAddress"
import { GoArrowUpRight } from "react-icons/go"
import { beautifyNumber } from "@/utils/beautifyNumbers"
import React, { Dispatch, SetStateAction } from "react"
import { Pagination } from "@/components/Pagination"
import Empty from "@/components/Empty/Empty"
import Image from "next/image"

interface TradeProps {
    data: Trade[];
    token: Token;
    count: number;
    offset: number;
    setOffset: Dispatch<SetStateAction<number>>;
}
export function Trades({ data, token, count, offset, setOffset }: TradeProps) {
    const { chainToken } = useApp();
    if (data.length === 0) return <Empty title="No trade activity yet" description="There are no trades yet" />;
    return (
        <React.Fragment>
            <Table className="rounded-xl">
                <TableHeader className="bg-card-light rounded-2xl">
                    <TableRow>
                        <TableHead className="w-[150px] px-4.5 py-3">
                            <PMedium className="text-muted">User</PMedium>
                        </TableHead>
                        <TableHead className="px-4.5 py-3 text-center">
                            <PMedium className="text-muted">Type</PMedium>
                        </TableHead>
                        <TableHead className="px-4.5 py-3">
                            <PMedium className="text-muted">{chainToken.symbol}</PMedium>
                        </TableHead>
                        <TableHead className="text-center px-4.5 py-3">
                            <PMedium className="text-muted">{token.symbol}</PMedium>
                        </TableHead>
                        <TableHead className="text-right px-4.5 py-3">
                            <PMedium className="text-muted">Txn</PMedium>
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody className="bg-card">
                    {data.map((trade, idx) => (
                        <TableRow key={idx} className="border-b-0 hover:bg-none">
                            <TableCell className=" flex items-center gap-1">
                                <div className="size-6 bg-card-light flex items-center justify-center rounded-full">
                                    {
                                        trade.user?.x_username ?
                                            <Image src={trade.user?.x_display_picture ?? "/logo-icon.svg"} height={20} width={20}
                                                alt="profile" className="h-5 w-5 rounded-full object-cover" /> : <PiUserList />
                                    }
                                    {/* <PiUserList /> */}
                                </div>
                                <Link target="_blank" href={`/user/${trade.user_addr}`}>
                                    <Label12>
                                        {trade.user?.x_username ? trade.user.x_username : shortenAddress(trade.user_addr)}
                                    </Label12>
                                </Link>
                                {/* <Link target="_blank" href={getAccountOnExplorer(trade.user_addr)}>
                                    <Label12>
                                        {trade.user?.x_username ? trade.user.x_username : shortenAddress(trade.user_addr)}
                                    </Label12>
                                </Link> */}
                            </TableCell>
                            <TableCell
                                className={clsx(
                                    "text-center",
                                    trade.is_buy ? "text-success" : "text-danger"
                                )}
                            >
                                <Label14>{trade.is_buy ? "Buy" : "Sell"}</Label14>
                            </TableCell>
                            <TableCell>
                                <Label12>
                                    {beautifyNumber(Number(trade.aptos_amount) / Math.pow(10, chainToken.decimals))}
                                </Label12>
                            </TableCell>
                            <TableCell className="text-center"><Label12>{beautifyNumber(Number(trade.token_amount) / Math.pow(10, token.decimals))}</Label12></TableCell>
                            <TableCell className="text-right"><Link target="_blank" className="flex justify-end text-right mr-3" href={getTxnOnExplorer(trade.txn_version)}>
                                <div className="border p-2 rounded-sm hover:bg-muted/30">
                                    <GoArrowUpRight />
                                </div>
                            </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination count={count} loading={false} offset={offset} setOffset={setOffset} />
        </React.Fragment>
    )
}