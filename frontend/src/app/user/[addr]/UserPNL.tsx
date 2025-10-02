"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { H1, Label12, Label14, PMedium } from "@/components/ui/typography"
import clsx from "clsx"
import Image from "next/image"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useEffect, useState } from "react"
import { AccountPNL } from "@/types/custom"
import Api from "@/lib/api"
import { useApp } from "@/providers/AppProvider"
import { beautifyNumber } from "@/utils/beautifyNumbers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { Loader } from "@/components/Loader"
interface UserPNLProps {
    address: string;
}
export function UserPNL({ address }: UserPNLProps) {
    const { chainToken } = useApp()
    const { account } = useWallet()
    const [userPNL, setUserPNL] = useState<AccountPNL>();
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        async function getAccountPNL() {
            try {
                setIsLoading(true)
                const data = (await Api.sendBackendRequest(`/api/trade/${address}/pnl?offset=0&limit=10`)).data as AccountPNL;
                setUserPNL(data)
            } catch (error) {
                setUserPNL(undefined)
                console.log(`[error-UserPNL-getAccountPNL]: ${error}`)
            } finally {
                setIsLoading(false)
            }
        };
        getAccountPNL()
    }, []);
    if(isLoading) {
        return <Loader />
    }
    if (!userPNL) return (
        <div className="flex items-center justify-center bg-card w-fit m-auto p-4 rounded-2xl max-w-lg">
            <div className="not-found text-center">
                <H1>No token activity yet</H1>
                <PMedium className="mt-4">You haven&apos;t bought or sold any tokens yet. Start trading to see your activity here.</PMedium>
                {/* <Image src='/empty-web.webp' alt="empty" height={160} width={150} className='mt-8 mx-auto' /> */}
                <Button asChild className="btn-yellow rounded-pill mt-8">
                    <Link href="/">Make Your First Move</Link>
                </Button>
            </div>
        </div>
    );
    return (
        <>
            <H1>{account?.address.toString() === address ?  'My' :' '} Tokens</H1>
            <div className="max-w-7xl mx-auto">
                <Table className="rounded-xl ">
                    <TableHeader className="bg-card-light rounded-2xl">
                        <TableRow>
                            <TableHead className="w-[150px] px-4.5 py-3">
                                <PMedium className="text-muted">Token</PMedium>
                            </TableHead>
                            <TableHead className="px-4.5 py-3 text-center">
                                <PMedium className="text-muted">Balance</PMedium>
                            </TableHead>
                            <TableHead className="px-4.5 text-center py-3">
                                <PMedium className="text-muted">Avg Entry</PMedium>
                            </TableHead>
                            <TableHead className="text-center px-4.5 py-3">
                                <PMedium className="text-muted">Current Price</PMedium>
                            </TableHead>
                            <TableHead className="text-right px-4.5 py-3">
                                <PMedium className="text-muted">PnL</PMedium>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-card">
                        {userPNL.tokens.map(token => (
                            <TableRow key={token.pre_addr} className="border-b-0 hover:bg-none">
                                <TableCell>
                                    <Link href={`/${token.pre_addr}`} className="flex items-center gap-2">
                                    <Image
                                        src={token.image}
                                        alt={token.symbol}
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 object-cover rounded-full border"
                                    />
                                    <Label12>{token.symbol}</Label12>
                                    </Link>
                                </TableCell>

                                {/* Balance */}
                                <TableCell className="text-center">
                                    <Label12>{chainToken.price ? `${beautifyNumber(token.holding_value / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}` : beautifyNumber(token.holding_value / Math.pow(10, chainToken.decimals))}</Label12>
                                </TableCell>

                                {/* Avg Entry */}
                                <TableCell className="text-center">
                                    <Label12>{chainToken.price ? `${beautifyNumber(token.avg_entry / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}` : beautifyNumber(token.avg_entry / Math.pow(10, chainToken.decimals))}</Label12>
                                </TableCell>

                                {/* Current Price */}
                                <TableCell className="text-center">
                                    <Label12>{chainToken.price ? `${beautifyNumber(token.current_price / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}` : beautifyNumber(token.current_price)}</Label12>
                                </TableCell>

                                {/* PnL */}
                                <TableCell
                                    className={clsx(
                                        "flex items-center justify-end gap-1 font-medium",
                                        token.pnl > 0 ? "text-success" : "text-danger"
                                    )}
                                >

                                    <Label14>{chainToken.price ? beautifyNumber(token.pnl / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true }) : beautifyNumber(token.pnl / Math.pow(10, chainToken.decimals))}</Label14>
                                    {token.pnl > 0 ? (
                                        <ArrowUp size={16} />
                                    ) : (
                                        <ArrowDown size={16} />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}