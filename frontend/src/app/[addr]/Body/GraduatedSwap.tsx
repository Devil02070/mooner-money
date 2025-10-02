'use state'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P, XSMedium } from "@/components/ui/typography";
import { aptosClient, getMultipleFungibleAssetBalances, getTxnOnExplorer } from "@/lib/aptos";
import { CA, THALA } from "@/lib/env";
import { useApp } from "@/providers/AppProvider";
import { Token } from "@/types/custom";
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CiWallet } from "react-icons/ci";
import { IoCheckmark, IoSwapVerticalOutline } from "react-icons/io5";
import { calcOutGivenInWeighted } from "@thalalabs/thalaswap-math"
import { toast } from "sonner";
import { WalletButton } from "@/components/WalletButton";
import { errorMessage } from "@/utils/errorMessage";
interface SwapProps {
    token: Token;
}
export default function GraduatedSwap({ token }: SwapProps) {
    const { account, signAndSubmitTransaction, connected } = useWallet()
    const { chainToken } = useApp()
    const [fromAmount, setfromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [poolObj, setPoolObj] = useState<string>();
    const [isEmpty, setIsEmpty] = useState(false)
    const [poolBalances, setPoolBalances] = useState<number[]>();

    const [balances, setBalances] = useState({
        x: 0,
        y: 0
    })
    const [fromToken, setFromtoken] = useState({
        fa_addr: token.main_addr,
        image: token.image,
        decimals: token.decimals,
        balance: balances.y
    });
    const [toToken, setTotoken] = useState({
        fa_addr: chainToken.fa_addr,
        image: chainToken.icon,
        decimals: chainToken.decimals,
        balance: balances.x
    });
    const getBalances = useCallback(async () => {
        try {
            if (!account?.address) throw new Error("Wallet not connected")
            const amounts = await getMultipleFungibleAssetBalances(
                account.address.toString(),
                [chainToken.fa_addr, token.main_addr]
            );
            const b = {
                x: amounts[0] / Math.pow(10, chainToken.decimals),
                y: amounts[1] / Math.pow(10, token.decimals)
            }
            setBalances(b);
            setFromtoken({ ...fromToken, balance: fromToken.fa_addr === chainToken.fa_addr ? b.x : b.y })
            setTotoken({ ...toToken, balance: toToken.fa_addr === chainToken.fa_addr ? b.x : b.y })
        } catch (error) {
            setBalances({ x: 0, y: 0 })
            console.log(`[error-swap-getBalances]: ${error}`)
        }
    }, [account, token, chainToken])

    const handleSwitch = () => {
        setFromtoken(toToken)
        setTotoken(fromToken)
        setfromAmount('')
    }
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = e;
        if (key === "Backspace" || key === "Delete" || key === "ArrowLeft" || key === "ArrowRight" || key === "Tab") { return; }
        if (!/[0-9.]/.test(key)) {
            e.preventDefault();
        }
        if (key === "." && e.currentTarget.value.includes(".")) {
            e.preventDefault();
        }
    };

    const handleInputAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setfromAmount(value);
        setIsEmpty(false);

        if (!poolBalances) return;

        const amountIn = Number(value) * Math.pow(10, fromToken.decimals);
        let t = 0;

        if (fromToken.fa_addr === chainToken.fa_addr) {
            t = calcOutGivenInWeighted(poolBalances[0], 50, poolBalances[1], 50, amountIn / Math.pow(10, fromToken.decimals), 0.03);
        } else {
            t = calcOutGivenInWeighted(poolBalances[1], 50, poolBalances[0], 50, amountIn / Math.pow(10, fromToken.decimals), 0.03);
        }

        setToAmount(t.toString());
    };
    const handleMax = () => {
        const value = fromToken.balance.toString();
        setfromAmount(value);
        handleInputAmount({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
    };


    const getPoolBalances = useCallback(async () => {
        try {
            if (!poolObj) return;
            const [reserves] = await aptosClient.view({
                payload: {
                    function: `${THALA}::pool::pool_balances`,
                    typeArguments: [],
                    functionArguments: [
                        poolObj
                    ]
                }
            });
            if (!reserves) throw new Error("No reserves found");
            if (!Array.isArray(reserves)) throw new Error("Invalid reserves");

            const aptos = Number(reserves[0] / Math.pow(10, chainToken.decimals))
            const tkn = Number(reserves[1] / Math.pow(10, token.decimals))
            setPoolBalances([aptos, tkn])
        } catch (error) {
            console.log(`Error getting pool balances: ${error}`)
        }
    }, [poolObj])

    const onSwapClick = async () => {
        if (!fromAmount) {
            setIsEmpty(true)
            return;
        }
        try {
            const amountIn = Number(fromAmount) * Math.pow(10, fromToken.decimals)
            // if (!poolBalances) return;
            // let t = 0
            // if(fromToken.fa_addr === chainToken.fa_addr) {
            //     t = calcOutGivenInWeighted(poolBalances[0], 50, poolBalances[1], 50, amountIn / Math.pow(10, fromToken.decimals), 0.03);

            // } else {
            //     t = calcOutGivenInWeighted(poolBalances[1], 50, poolBalances[0], 50, amountIn / Math.pow(10, fromToken.decimals), 0.03);
            // }
            const transaction: InputTransactionData = {
                data: {
                    function: `${THALA}::pool::swap_exact_in_weighted_entry`,
                    functionArguments: [
                        poolObj,
                        fromToken.fa_addr,
                        amountIn,
                        toToken.fa_addr,
                        Number(toAmount) * Math.pow(10, toToken.decimals)
                    ]
                }
            }
            const response = await signAndSubmitTransaction(transaction);
            await aptosClient.waitForTransaction({ transactionHash: response.hash });
            toast.success(`Transaction completed`, {
                action: <a target="_blank" href={getTxnOnExplorer(response.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                icon: <IoCheckmark />
            });
            getBalances();
            setfromAmount("")
            setToAmount("")

        } catch (err) {
            console.log(`Error in thala swap: ${err}`)
            toast.error(errorMessage(err))
        }
    }


    useEffect(() => {
        getBalances()
    }, [getBalances])

    useEffect(() => {
        getPoolBalances()
        const interval = setInterval(() => {
            getPoolBalances()
        }, 30000)
        return () => clearInterval(interval)
    }, [getPoolBalances])

    useEffect(() => {
        async function getPoolObj() {
            try {
                const [obj] = await aptosClient.view({
                    payload: {
                        function: `${CA}::mooner_money::get_thala_pool`,
                        typeArguments: [],
                        functionArguments: [
                            [
                                chainToken.fa_addr,
                                token.main_addr
                            ],
                            [
                                50,
                                50
                            ],
                            30
                        ]
                    }
                });
                setPoolObj(obj!.toString())

            } catch (error) {
                console.log(`Error getting pool obj: ${error}`)
            }
        }
        getPoolObj()
    }, [])
    return (
        <>
            <div className="space-y-2">
                <div className='space-y-2'>
                    <div className='flex justify-end items-center'>
                        <div className='flex gap-2 justify-end items-center'>
                            <div className='flex items-center gap-1 justify-end'>
                                <CiWallet className='size-5' />
                                <XSMedium>{fromToken.balance}</XSMedium>
                                <div className='size-5 rounded-full overflow-hidden border'>
                                    <Image src={fromToken.image} alt="token" height={100} width={100} className=' h-full w-full object-cover' />
                                </div>
                            </div>
                            <Button variant={"ghost"} className='text-primary hover:bg-none p-1 cursor-pointer' onClick={() => handleMax()} >Max</Button>
                        </div>
                    </div>
                    <Input
                        type="text"
                        value={fromAmount}
                        // onChange={(e) => {
                        //     setfromAmount(e.target.value)
                        //     setIsEmpty(false)
                        // }}
                        onChange={handleInputAmount}
                        inputMode="decimal"
                        onKeyDown={handleKeyPress}
                        placeholder='0.00'
                        className='text-lg font-bold'
                    />
                    {
                        isEmpty && <P className="text-danger">Please enter token amount.</P>
                    }
                </div>

                <IoSwapVerticalOutline className="h-7 w-7 text-primary rounded mx-auto cursor-pointer mb-0" onClick={() => handleSwitch()} />

                <div className='space-y-2'>
                    <div className='flex justify-end items-center'>
                        <div className='flex gap-2 justify-end items-center'>
                            <div className='flex items-center gap-1 justify-end'>
                                <CiWallet className='size-5' />
                                <XSMedium>{toToken.balance}</XSMedium>
                                <div className='size-5 rounded-full overflow-hidden border'>
                                    <Image src={toToken.image} alt="token" height={100} width={100} className=' h-full w-full object-cover' />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Input
                        type="text"
                        value={toAmount}
                        placeholder='0.00'
                        className='text-lg font-bold'
                        disabled />

                    {/* <div className='flex gap-1 items-center'>
                        <PiApproximateEquals />
                        <XSMedium>${0}</XSMedium>
                    </div> */}
                </div>
                {
                    connected ? (
                        <Button
                            className="mt-4 mx-auto w-full"
                            disabled={fromToken.balance < Number(fromAmount)}
                            onClick={() => onSwapClick()}
                        >
                            Swap
                        </Button>
                    ) :
                        (
                        <WalletButton />
                    )
                }

            </div>
        </>
    )
}