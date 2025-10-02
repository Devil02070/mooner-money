"use client"

import EarningsModal from "@/components/modals/EarningsModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { H1, H1Xl, H2, Label12, Label14, PMedium, PSemiBold, XSMedium, XSSemiBold } from "@/components/ui/typography"
import { LockOpen } from "lucide-react"
import Image from "next/image"
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react"
import { CiWallet } from "react-icons/ci"
import { IoCheckmark, IoLockClosed } from "react-icons/io5"
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react"
import { StakeAsset, StakeObj, useApp } from "@/providers/AppProvider"
import { toast } from "sonner"
import { errorMessage } from "@/utils/errorMessage"
import { WalletButton } from "@/components/WalletButton"
import { CA } from "@/lib/env"
import { aptosClient, getMultipleFungibleAssetBalances, getTxnOnExplorer } from "@/lib/aptos"
import Api from "@/lib/api"
import { Position, StakeStats } from "@/types/custom"
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from "dayjs/plugin/duration"
import { useCountdown } from "@/hooks/useCountdown"
import { beautifyNumber } from "@/utils/beautifyNumbers"
import { Loader } from "@/components/Loader"
import Link from "next/link"
dayjs.extend(duration)
dayjs.extend(relativeTime);


export function Stake() {
    const { stakeAsset, stakeObj, chainToken } = useApp();
    const { connected, account, signAndSubmitTransaction } = useWallet();
    const [open, setOpen] = useState(false);
    const [stakeAmount, setStakeAmount] = useState("");
    const [balance, setBalance] = useState(0);
    const [positions, setPositions] = useState<Position[]>([]);
    const [feeRewards, setFeeRewards] = useState("");
    const [stats, setStats] = useState<StakeStats>({
        totalFeeClaimed: 0,
        totalStaked: 0,
        totalStakers: 0
    })
    const getBalance = useCallback(async () => {
        try {
            if (!account?.address) throw new Error("Wallet not connected");
            if (!stakeAsset) throw new Error("Stake asset not found")
            const amounts = await getMultipleFungibleAssetBalances(
                account.address.toString(),
                [stakeAsset.fa_addr]
            );
            setBalance(amounts[0] / Math.pow(10, stakeAsset.decimals))
        } catch (error) {
            setBalance(0)
            console.log(`[error-launch-getBalance]: ${error}`)
        }
    }, [account, stakeAsset]);

    const getPositions = useCallback(async () => {
        try {
            if (!account?.address) throw new Error("Wallet not connected");
            if (!stakeObj) throw new Error("Stake object not found")
            const data = (await Api.sendBackendRequest(`/api/stake/${account.address.toString()}/get/${stakeObj.stake_addr}`)).data as Position[];
            setPositions(data);
        } catch (error) {
            setPositions([])
            console.log(`[error-stake-getPositions]: ${error}`)
        }
    }, [account, stakeObj]);

    const getFeeRewards = useCallback(async () => {
        try {
            if (positions.length === 0) throw new Error("No positions found");
            const vector = positions.map(p => p.position_addr);
            const [amount] = (await aptosClient.view({
                payload: {
                    function: `${CA}::staking::get_claimable_rewards`,
                    functionArguments: [vector]
                }
            }));
            setFeeRewards(amount!.toString())
        } catch (error) {
            setFeeRewards("")
            console.log(`[error-launch-getBalance]: ${error}`)
        }
    }, [positions]);
    const onStake = async (asset: StakeAsset, obj: StakeObj) => {
        try {
            const amount = Number(stakeAmount);
            if (isNaN(amount)) throw new Error("Amount must be a number");
            if (amount === 0) throw new Error("Zero input amount");
            if (!connected) throw new Error("Wallet not connected")
            const transaction: InputTransactionData = {
                data: {
                    function: `${CA}::staking::stake`,
                    functionArguments: [obj.stake_addr, Math.floor(amount * Math.pow(10, asset.decimals))]
                }
            };
            const pendingTransaction = await signAndSubmitTransaction(transaction);
            await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash });
            setStakeAmount("")
            toast.success(`Transaction completed`, {
                action: <a target="_blank" href={getTxnOnExplorer(pendingTransaction.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                icon: <IoCheckmark />
            });
        } catch (error) {
            console.log(`[error-stake-onStake]: ${error}`)
            toast.error(errorMessage(error));
        }
    }

    const onClaim = async () => {
        try {
            if (!connected) throw new Error("Wallet not connected")
            const amount = Number(feeRewards);
            if (amount === 0) throw new Error("Zero amount");
            const transaction: InputTransactionData = {
                data: {
                    function: `${CA}::staking::claim_all`,
                    functionArguments: [positions.map(p => p.position_addr)]
                }
            };
            const pendingTransaction = await signAndSubmitTransaction(transaction);
            await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash });
            setFeeRewards("")
            toast.success(`Transaction completed`, {
                action: <a target="_blank" href={getTxnOnExplorer(pendingTransaction.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                icon: <IoCheckmark />
            });
        } catch (error) {
            console.log(`[error-stake-onStake]: ${error}`)
            toast.error(errorMessage(error));
        }
    }

    const onUnstake = async (position: string) => {
        try {
            if (!account) throw new Error("Wallet not connected");
            const transaction: InputTransactionData = {
                data: {
                    function: `${CA}::staking::unstake`,
                    functionArguments: [position]
                }
            };
            const pendingTransaction = await signAndSubmitTransaction(transaction);
            await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash });
            setPositions(prev => prev.filter(p => p.position_addr !== position));
            toast.success(`Transaction completed`, {
                action: <a target="_blank" href={getTxnOnExplorer(pendingTransaction.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                icon: <IoCheckmark />
            });
        } catch (error) {
            console.log(`[error-stake-onUnstake]: ${error}`);
            toast.error(errorMessage(error))
        }
    }

    const getStats = useCallback(async() => {
        try {
            if(!stakeObj) throw new Error("Stake address not fetched yet")
            const data = (await Api.sendBackendRequest(`/api/stake/${stakeObj.stake_addr}/stats`)).data as StakeStats;
            setStats(data);
        } catch (error) {
            console.log(`Error in fetching stake stats: ${error}`)
        }
    },[stakeObj])


    useEffect(() => {
        getBalance()
    }, [getBalance])
    useEffect(() => {
        getPositions()
    }, [getPositions])
    useEffect(() => {
        getFeeRewards()
    }, [getFeeRewards])
    useEffect(() => {
        getStats()
    },[getStats])
    if (!stakeAsset || !stakeObj) {
        // return "Please wait!! Blockchain data is still loading.."
        return <Loader />;
    }

    return (
        <div className='p-4 md:p-8 space-y-[2.656rem]'>
            <div className='space-y-10 md:space-y-11'>
                <div className='flex gap-4 items-center'>
                    <H1>{stakeAsset.symbol} Staking</H1>
                    <EarningsModal open={open} setOpen={setOpen} />
                </div>
                <div className='max-w-3xl flex flex-wrap md:gap-0 gap-4 justify-center md:justify-center mx-auto'>
                    <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg w-full sm:w-fit'>
                        <H1Xl>{beautifyNumber(parseInt(stakeObj.stake_amount) / Math.pow(10, stakeAsset.decimals))}</H1Xl>
                        <Label14 className='text-muted'>${stakeAsset.symbol} staked</Label14>
                    </div>
                    <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg'>
                        <H1Xl>{beautifyNumber(stats.totalFeeClaimed / Math.pow(10, chainToken.decimals))}</H1Xl>
                        <Label14 className='text-muted'>APT Claimed</Label14>
                    </div>
                    <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg w-full sm:w-fit'>
                        <H1Xl>{beautifyNumber(stats.totalStakers)}</H1Xl>
                        <Label14 className='text-muted'>No. of stakers</Label14>
                    </div>
                    {/* <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg w-full sm:w-fit'>
                        <H1Xl>{beautifyNumber(parseInt(stakeObj.fee_amount) / Math.pow(10, chainToken.decimals))}</H1Xl>
                        <Label14 className='text-muted'>Current APT Pool</Label14>
                    </div> */}
                </div>
            </div>
            <div className='space-y-2 max-w-sm mx-auto'>
                <div className='bg-card space-y-2 p-3 rounded-[12px] max-w-sm'>
                    <Label12>You&apos;re staking</Label12>
                    <Input placeholder='0.00' className='border-none pl-0 !text-lg !font-bold !placeholder:text-lg !placeholder:font-bold' value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
                    <div className=' flex justify-between items-center'>
                        <div className='flex items-center gap-1'>
                            <CiWallet className='size-5' />
                            <XSMedium>{balance}</XSMedium>
                            <div className='size-5 rounded-full overflow-hidden'>
                                <Image src={stakeAsset.icon} alt={stakeAsset.symbol} height={100} width={100} className=' h-full w-full' />
                            </div >
                        </div>

                        {/* <div className='flex items-center gap-1'>
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
                            <div className='size-5 rounded-full overflow-hidden'>
                                <Image src={isBuy ? chainToken.icon : token.image} alt={isBuy ? chainToken.symbol : token.symbol} height={100} width={100} className=' h-full w-full' />
                            </div>
                        </div> */}
                        <div>
                            <XSMedium className='text-muted'>Duration - {dayjs.duration(Number(stakeObj.min_lock_duration), "seconds").asDays()} Days</XSMedium>
                        </div>
                    </div>
                    <div className='flex justify-center'>
                        {
                            !connected ?
                                <WalletButton />
                                :
                                <div className="flex  w-full justify-between">

                                    <Link href={"https://app.panora.exchange/swap/aptos?pair=APT-MOON"} target="_blank">
                                        <Button variant={"ghost"} className="text-primary">
                                            Buy Moon
                                        </Button>
                                    </Link>
                                    <Button className='flex items-center' onClick={() => onStake(stakeAsset, stakeObj)}>
                                        Stake now <IoLockClosed />
                                    </Button>


                                </div>
                        }
                    </div>
                </div>
                <div className='bg-card space-y-2 p-3 rounded-[12px] max-w-sm'>
                    <Label12>Your Earnings</Label12>
                    <div className='flex justify-between items-center'>
                        <div className="flex items-center gap-.5">
                            <Image src={chainToken.icon} alt={chainToken.symbol} height={14} width={14} className='size-5 rounded-full mr-1' />
                            <H2 className="text-primary">{feeRewards ? Number(feeRewards) / Math.pow(10, chainToken.decimals) : 0}</H2>
                        </div>
                        <Button className='flex items-center' onClick={() => onClaim()}>
                            Claim
                        </Button>
                    </div>
                    <div className='flex items-center gap-1 justify-center'>
                        <XSMedium className='text-muted'>Fee Claimed till now </XSMedium>
                        <XSSemiBold>{positions.reduce((sum, acc) => sum + Number(acc.claimed), 0) / Math.pow(10, chainToken.decimals)} {chainToken.symbol}</XSSemiBold>
                    </div>
                </div>
            </div>
            <div className='space-y-8'>
                <H1>My Stake Position</H1>
                {
                    positions.length === 0 ?
                        <div className="flex items-center justify-center bg-card m-auto p-4 rounded-2xl w-full md:w-lg">
                            <div className="not-found text-center">
                                <H1>No positions staked. </H1>
                                <PMedium className="mt-4">Put your tokens to work and start earning.</PMedium>
                                {/* <Image src='/empty-web.webp' alt="404" height={160} width={150} className='mt-8 mx-auto' /> */}
                            </div>
                        </div>
                        :
                        <>
                            <MyStaking positions={positions} stakeObj={stakeObj} stakeAsset={stakeAsset} setPositions={setPositions} onUnstake={onUnstake} />
                            <MyStakingMobile positions={positions} stakeObj={stakeObj} stakeAsset={stakeAsset} setPositions={setPositions} onUnstake={onUnstake} />
                        </>
                }

            </div>
        </div>
    )
}
type MyStakingProps = {
    positions: Position[];
    stakeObj: StakeObj;
    stakeAsset: StakeAsset;
    setPositions: Dispatch<SetStateAction<Position[]>>;
    onUnstake: (value: string) => void;
}


function MyStaking({ positions, stakeAsset, onUnstake }: MyStakingProps) {
    const { chainToken } = useApp();
    // const { account, signAndSubmitTransaction } = useWallet()
    // const onUnstake = async (position: string) => {
    //     try {
    //         if (!account) throw new Error("Wallet not connected");
    //         const transaction: InputTransactionData = {
    //             data: {
    //                 function: `${CA}::staking::unstake`,
    //                 functionArguments: [position]
    //             }
    //         };
    //         const pendingTransaction = await signAndSubmitTransaction(transaction);
    //         await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash });
    //         setPositions(prev => prev.filter(p => p.position_addr !== position));
    //         toast.success(`Transaction completed`, {
    //             action: <a target="_blank" href={getTxnOnExplorer(pendingTransaction.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
    //             icon: <IoCheckmark />
    //         });
    //     } catch (error) {
    //         console.log(`[error-stake-onUnstake]: ${error}`);
    //         toast.error(errorMessage(error))
    //     }
    // }
    return (
        <div className="max-w-7xl hidden md:block mx-auto">
            <Table className="rounded-xl">
                <TableHeader className="bg-card-light rounded-2xl">
                    <TableRow>
                        <TableHead className="px-4.5 py-3">
                            <PMedium className="text-muted">Token Amount</PMedium>
                        </TableHead>
                        <TableHead className="px-4.5 py-3 text-center">
                            <PMedium className="text-muted">Unlock Countdown</PMedium>
                        </TableHead>
                        <TableHead className="w-[150px] px-4.5 py-3">
                            <PMedium className="text-muted">Claimed</PMedium>
                        </TableHead>
                        <TableHead className="px-4.5 py-3 text-right">
                            <PMedium className="text-muted">Manage</PMedium>
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody className="bg-card">
                    {positions.map(position => (
                        <TableRow key={position.position_addr} className="border-b-0 hover:bg-none">
                            <TableCell className="flex items-center gap-2">
                                <Image
                                    src={stakeAsset.icon}
                                    alt={stakeAsset.symbol}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                />
                                <Label12>{position.amount / Math.pow(10, stakeAsset.decimals)}</Label12>
                            </TableCell>
                            <TableCell className="text-center">
                                <Label12><CountDown unlockTs={position.unlock_ts} /></Label12>
                            </TableCell>
                            <TableCell className="text-center">
                                <Label12>{position.claimed / Math.pow(10, chainToken.decimals)}</Label12>
                            </TableCell>
                            <TableCell className="text-right flex items-center gap-2 justify-end">
                                {
                                    dayjs().unix() > position.unlock_ts ? (
                                        <Button size="icon" onClick={() => onUnstake(position.position_addr)}>
                                            <LockOpen />
                                        </Button>
                                    ) : (
                                        <Button size="icon" disabled>
                                            <IoLockClosed />
                                        </Button>
                                    )
                                }

                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function CountDown({ unlockTs }: { unlockTs: number }) {
    const { countdown } = useCountdown(unlockTs)
    return `${countdown}`
}




function MyStakingMobile({ positions, stakeAsset, onUnstake }: MyStakingProps) {
    const { chainToken } = useApp();
    return (
        <div className="flex flex-col md:hidden space-y-4">
            {
                positions.map((position, i) => {
                    return (
                        <div key={i} className="bg-card space-y-4 rounded-lg p-2">
                            <div className="flex justify-between">
                                <PMedium className="text-muted">Token Amount</PMedium>
                                <div className="flex items-center">
                                    <Image
                                        src={stakeAsset.icon}
                                        alt={stakeAsset.symbol}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                    />
                                    <PSemiBold>{position.amount / Math.pow(10, stakeAsset.decimals)}</PSemiBold>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <PMedium className="text-muted">Unlock Countdown</PMedium>
                                <PSemiBold><CountDown unlockTs={position.unlock_ts} /></PSemiBold>
                            </div>
                            <div className="flex justify-between">
                                <PMedium className="text-muted">Claimed</PMedium>
                                <PMedium className="text-muted">{position.claimed / Math.pow(10, chainToken.decimals)}</PMedium>
                            </div>
                            <div className="text-center flex gap-2 justify-center items-center">
                                {
                                    dayjs().unix() > position.unlock_ts ? (
                                        <Button size="icon" onClick={() => onUnstake(position.position_addr)}>
                                            <LockOpen />
                                        </Button>
                                    ) : (
                                        <Button size="icon" disabled>
                                            <IoLockClosed />
                                        </Button>
                                    )
                                }
                            </div>
                        </div>
                    )
                })
            }


            {/* <div className="bg-card space-y-4 rounded-lg p-2">
                <div className="flex justify-between">
                    <PMedium className="text-muted">Unlock time</PMedium>
                    <PSemiBold>Time competed</PSemiBold>
                </div>
                <div className="flex justify-between">
                    <PMedium className="text-muted">Token Balance</PMedium>
                    <PSemiBold>3.1K Moon</PSemiBold>
                </div>
                <div className="flex justify-between">
                    <PMedium className="text-muted">Position</PMedium>
                    <div className="flex items-center gap-1">
                        <div className="size-6 rounded-full overflow-hidden">
                            <Image src={"/user-profile.png"} alt="" height={100} width={100} className="rounded-full" />
                        </div>
                        <PSemiBold>1458 th</PSemiBold>
                    </div>
                </div>

                <div className="text-center flex gap-2 justify-center items-center">
                    <Button size={"icon"}>
                        <Unlock />
                    </Button>
                    <Button>
                        Restore
                    </Button>
                </div>
            </div> */}
        </div>
    )
}