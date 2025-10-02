"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ButtonText, Label14, P, XSMedium, XSSemiBold } from '@/components/ui/typography'
import { WalletButton } from '@/components/WalletButton'
import { InputTransactionData, useWallet } from '@aptos-labs/wallet-adapter-react'
import { Settings } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { CiWallet } from 'react-icons/ci'
import { PiApproximateEquals } from 'react-icons/pi'
import { ChainToken, Config, useApp } from '@/providers/AppProvider'
import { applySlippageDec, getAmountOutWithFees, swapAptosForExactTokens, swapExactAptosForTokens } from '@/lib/math'
import { Pnl, Token } from '@/types/custom'
import { CA } from '@/lib/env'
import { aptosClient, getMultipleFungibleAssetBalances, getTxnOnExplorer } from '@/lib/aptos'
import { beautifyNumber } from '@/utils/beautifyNumbers'
import { toast } from 'sonner'
import { errorMessage } from '@/utils/errorMessage'
import { IoCheckmark } from 'react-icons/io5'
import GraduatedSwap from './GraduatedSwap'

interface SwapProps {
    token: Token;
    userPNL: Pnl;
}

export const Swap = ({ token, userPNL }: SwapProps) => {
    const { chainToken, config, slippage, setSlippage } = useApp();
    const { connected, account, signAndSubmitTransaction } = useWallet();
    const [isBuy, setIsBuy] = useState(true)
    const [amountIn, setAmountIn] = useState("");
    const [balances, setBalances] = useState({
        x: 0,
        y: 0
    })
    const aptosReserves = Number(token.last_trade ? token.last_trade.virtual_aptos_reserves : token.virtual_aptos_reserves);
    const tokenReserves = Number(token.last_trade ? token.last_trade.virtual_token_reserves : token.virtual_token_reserves);

    const getBalances = useCallback(async () => {
        try {
            if (!account?.address) throw new Error("Wallet not connected")
            const amounts = await getMultipleFungibleAssetBalances(
                account.address.toString(),
                [chainToken.fa_addr, token.pre_addr]
            );
            setBalances({
                x: amounts[0] / Math.pow(10, chainToken.decimals),
                y: amounts[1] / Math.pow(10, token.decimals)
            })
        } catch (error) {
            setBalances({ x: 0, y: 0 })
            console.log(`[error-swap-getBalances]: ${error}`)
        }
    }, [account, token, chainToken])

    const onSwap = async () => {
        try {
            if (!account) throw new Error("Wallet not connected")
            const num = Number(amountIn);
            if (isNaN(num)) {
                throw new Error("Amount must be a number")
            }
            if (num === 0) {
                throw new Error("Amount must be greater than zero")
            }
            if (!config) throw new Error("Configuration not detected")
            let transaction: InputTransactionData;
            if (isBuy) {
                const maxAptos = num * Math.pow(10, chainToken.decimals);
                let minCoins = Math.ceil(swapExactAptosForTokens(
                    Number(aptosReserves),
                    Number(tokenReserves),
                    maxAptos,
                    config?.fee ?? 0
                ));
                const maxCoinsAvailable = (tokenReserves - Number(token.remain_token_reserves));
                if (minCoins > maxCoinsAvailable) {
                    minCoins = maxCoinsAvailable;
                }
                transaction = {
                    data: {
                        function: `${CA}::mooner_money::buy_entry`,
                        functionArguments: [
                            token.pool_addr,
                            Math.ceil(maxAptos),
                            minCoins
                        ]
                    }
                }
            } else {
                const maxCoins = num * Math.pow(10, token.decimals);
                const minAptos = getAmountOutWithFees(
                    Number(aptosReserves),
                    Number(tokenReserves),
                    maxCoins,
                    config?.fee ?? 0
                );

                transaction = {
                    data: {
                        function: `${CA}::mooner_money::sell_entry`,
                        functionArguments: [
                            token.pool_addr,
                            Math.floor(maxCoins),
                            Math.floor(applySlippageDec(
                                minAptos,
                                Number(slippage)
                            ))
                        ]
                    }
                }
            }

            const pendingTransaction = await signAndSubmitTransaction(transaction);
            await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash });
            setAmountIn("")
            toast.success(`Transaction completed`, {
                action: <a target="_blank" href={getTxnOnExplorer(pendingTransaction.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                icon: <IoCheckmark />
            });
        } catch (error) {
            console.log(`Error on swap: ${error}`)
            toast.error(`"Transaction failed", ${error}`)
        }
    }

    const onMaxClick = () => {
        if (isBuy) {
            const maxCoins = (tokenReserves - Number(token.remain_token_reserves));
            const minAptos = swapAptosForExactTokens(
                Number(aptosReserves),
                Number(tokenReserves),
                maxCoins,
                config?.fee ?? 0
            ) / Math.pow(10, chainToken.decimals);
            if (minAptos < balances.x) {
                setAmountIn(minAptos.toString());
            } else {
                setAmountIn(balances.x.toString())
            }
        } else {
            setAmountIn(balances.y.toString())
        }
    }

    const onClaimToken = async () => {
        try {
            if (!account) throw new Error("Wallet not connected");
            const transaction: InputTransactionData = {
                data: {
                    function: `${CA}::mooner_money::claim_entry`,
                    functionArguments: [
                        token.pool_addr,
                    ]
                }
            };
            const pendingTransaction = await signAndSubmitTransaction(transaction);
            await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash });
            getBalances()
            toast.success(`Transaction completed`, {
                action: <a target="_blank" href={getTxnOnExplorer(pendingTransaction.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                icon: <IoCheckmark />
            });
        } catch (error) {
            console.log(`Error in token claim: ${error}`)
            toast.error(errorMessage(error));
        }
    }

    useEffect(() => {
        getBalances()
    }, [getBalances])

    return (
        <div className="rounded-lg shadow-sm">
            <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
                <div className='flex gap-1 items-center'>
                    <XSMedium className='text-muted'>Bought</XSMedium>
                    <Label14 className='text-success font-bold'>
                        {chainToken.price ?
                            `${beautifyNumber(userPNL.bought / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}`
                            : beautifyNumber(userPNL.bought / Math.pow(10, chainToken.decimals)
                            )
                        }
                    </Label14>
                </div>
                <div className='flex gap-1 items-center'>
                    <XSMedium className='text-muted'>Sold</XSMedium>
                    <Label14 className='text-danger font-bold'>{chainToken.price ? `${beautifyNumber(userPNL.sold / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}` : beautifyNumber(userPNL.sold / Math.pow(10, chainToken.decimals))}</Label14>
                </div>
                <div className='flex gap-1 items-center'>
                    <XSMedium className='text-muted'>Holding</XSMedium>
                    <Label14 className='font-bold'>{chainToken.price ? `${beautifyNumber(userPNL.hodl / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}` : beautifyNumber(userPNL.hodl / Math.pow(10, chainToken.decimals))}</Label14>
                </div>
                <div className='flex gap-1 items-center'>
                    <XSMedium className='text-muted'>PnL</XSMedium>
                    <Label14 className={`font-bold ${userPNL.pnl > 0 ? 'text-success' : 'text-danger'}`}>{chainToken.price ? `${beautifyNumber(userPNL.pnl / Math.pow(10, chainToken.decimals) * chainToken.price, { showDollar: true })}` : beautifyNumber(userPNL.pnl / Math.pow(10, chainToken.decimals))}</Label14>
                </div>
            </div>
            {
                token.is_completed ? (
                    <>
                        <GraduatedSwap token={token} />
                        {
                            connected && balances.y ?
                                <Button
                                    className='bg-success hover:bg-success/70 w-full mt-4'
                                    onClick={() => onClaimToken()}
                                    disabled={!connected || !balances.y}
                                >
                                    Claim your tokens to trade on thala
                                </Button>
                                : ''
                        }

                    </>
                ) :
                    (
                        <div className="space-y-4">
                            <div className="flex border rounded-[12px]">
                                <button
                                    onClick={() => {
                                        setIsBuy(true)
                                        setAmountIn("")
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-l-[12px] transition-all duration-200 cursor-pointer ${isBuy
                                        ? 'bg-success '
                                        : 'text-white'
                                        }`}
                                >
                                    <ButtonText className={`${isBuy ? "text-primary-foreground" : "text-white"}`}>Buy</ButtonText>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsBuy(false)
                                        setAmountIn("")
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-r-[12px]  transition-all duration-200 cursor-pointer ${!isBuy
                                        ? 'bg-danger text-primary-foreground'
                                        : 'text-white'
                                        }`}
                                >
                                    <ButtonText className={`${!isBuy ? "text-primary-foreground" : "text-white"}`}>Sell</ButtonText>
                                </button>
                            </div>

                            <div className='space-y-2'>
                                <div className='flex justify-between items-center'>
                                    <div className="relative w-full max-w-[80px]">
                                        <Settings
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <Input
                                            type="text"
                                            value={slippage}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const num = Number(value);
                                                if (!isNaN(num) && num < 100) {
                                                    setSlippage(
                                                        Math.max(1, num).toString()
                                                    )
                                                }
                                            }}
                                            placeholder="Enter slippage amount..."
                                            // className="pl-9 pr-3 min-w-[4rem] max-w-[5rem]"
                                            className="pl-9 pr-3 w-full"
                                        />
                                        <P className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</P>
                                    </div>

                                    {/* Wallet balnaces details */}
                                    <div className='flex gap-2'>
                                        <div className='flex items-center gap-1'>
                                            <CiWallet className='size-5' />
                                            <XSMedium>
                                                {
                                                    isBuy
                                                        ?
                                                        balances.x
                                                        :
                                                        balances.y
                                                }
                                            </XSMedium>
                                            <div className='size-5 rounded-full overflow-hidden border'>
                                                <Image src={isBuy ? chainToken.icon : token.image} alt={isBuy ? chainToken.symbol : token.symbol} height={100} width={100} className=' h-full w-full object-cover' />
                                            </div>
                                        </div>
                                        <Button variant={"ghost"} className='text-primary hover:bg-none p-1 cursor-pointer' onClick={() => onMaxClick()}>
                                            Max
                                        </Button>
                                    </div>
                                </div>

                                <Input placeholder='0.00' onChange={(e) => setAmountIn(e.target.value)} type="text" value={amountIn} className='text-lg font-bold' />
                                {
                                    chainToken.price && (
                                        <div className='flex gap-1 items-center'>
                                            <PiApproximateEquals />
                                            <XSMedium>
                                                {isBuy ? (
                                                    beautifyNumber(
                                                        Number(amountIn) * chainToken.price, {
                                                        showDollar: true
                                                    })
                                                ) : (
                                                    beautifyNumber(
                                                        getAmountOutWithFees(
                                                            Number(aptosReserves),
                                                            Number(tokenReserves),
                                                            Number(amountIn) * Math.pow(10, token.decimals),
                                                            config?.fee ?? 0
                                                        ) / Math.pow(10, chainToken.decimals) * chainToken.price, {
                                                        showDollar: true
                                                    })
                                                )}
                                            </XSMedium>
                                        </div>
                                    )
                                }
                            </div>
                            <div className='flex justify-between'>
                                {
                                    isBuy
                                        ?
                                        [5, 10, 20, 40].map(num => (
                                            <div
                                                key={num}
                                                onClick={() => {
                                                    if (balances.x < num) {
                                                        setAmountIn(balances.x.toString())
                                                    } else {
                                                        setAmountIn(num.toString())
                                                    }
                                                }}
                                                className={`px-4 flex items-center justify-center rounded-[6px] py-2 cursor-pointer transition-all duration-200 text-primary`}
                                            >
                                                <XSSemiBold>{num} {chainToken.symbol}</XSSemiBold>
                                            </div>
                                        ))
                                        :
                                        [25, 50, 75, 100].map(num => (
                                            <div
                                                key={num}
                                                onClick={() => {
                                                    const amount = (balances.y * num) / 100;
                                                    setAmountIn(amount.toString())
                                                }}
                                                className={`px-4 flex items-center justify-center rounded-[6px] py-2 cursor-pointer transition-all duration-200 text-primary`}
                                            >
                                                <XSSemiBold>{num}%</XSSemiBold>
                                            </div>
                                        ))
                                }
                            </div>


                            {
                                connected
                                    ?
                                    <Button
                                        className={`w-full ${isBuy
                                            ? "bg-success hover:bg-success/70"
                                            : "bg-danger hover:bg-danger/70"
                                            }`}
                                        onClick={() => onSwap()}
                                        disabled={!config}
                                    >
                                        <SwapText
                                            aptosReserves={aptosReserves}
                                            tokenReserves={tokenReserves}
                                            config={config}
                                            amountIn={amountIn}
                                            isBuy={isBuy}
                                            chainToken={chainToken}
                                            token={token}
                                        />
                                    </Button>
                                    :
                                    <WalletButton className="w-full" />
                            }
                        </div>
                    )
            }

        </div>
    )
}

function SwapText({ aptosReserves, tokenReserves, config, amountIn, isBuy, chainToken, token }: { aptosReserves: number, tokenReserves: number, amountIn: string, isBuy: boolean, config?: Config, chainToken: ChainToken, token: Token }) {
    if (!config) return `Loading...`
    if (isBuy) {
        const num = Number(amountIn);
        let text = '';
        if (isNaN(num)) {
            text = `Buy 0 ${token.symbol} for ${beautifyNumber(amountIn)} ${chainToken.symbol}`
        } else {
            const maxAptos = num * Math.pow(10, chainToken.decimals);

            const minCoins = swapExactAptosForTokens(
                Number(aptosReserves),
                Number(tokenReserves),
                maxAptos,
                config?.fee ?? 0
            ) / Math.pow(10, config?.decimals ?? 6);
            text = `Buy ${beautifyNumber(minCoins)} ${token.symbol} for ${beautifyNumber(amountIn)} ${chainToken.symbol}`
            return text
        }
    } else {
        const num = Number(amountIn);
        let text = '';
        if (isNaN(num)) {
            text = `Sell ${amountIn} ${token.symbol} for 0 ${chainToken.symbol}`
        } else {
            const maxCoins = num * Math.pow(10, token.decimals);

            const minAptos = getAmountOutWithFees(
                Number(aptosReserves),
                Number(tokenReserves),
                maxCoins,
                config?.fee ?? 0
            ) / Math.pow(10, chainToken.decimals);
            text = `Sell ${beautifyNumber(amountIn)} ${token.symbol} for ${beautifyNumber(minAptos)} ${chainToken.symbol}`
            return text
        }
    }
}
