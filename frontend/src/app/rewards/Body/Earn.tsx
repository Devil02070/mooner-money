"use client"

import EarningsModal from "@/components/modals/EarningsModal"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { H1, H1Xl, Label12, Label14, PMedium, XSMedium } from "@/components/ui/typography"
import Image from "next/image"
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { Leaderboard, Task } from "@/types/custom"
import Api from "@/lib/api"
import { shortenAddress } from "@/utils/shortenAddress"
import Link from "next/link"
import { beautifyNumber } from "@/utils/beautifyNumbers"
import { toast } from "sonner"
import { errorMessage } from "@/utils/errorMessage"
import { useApp } from "@/providers/AppProvider"
import { formatRank } from "@/utils/formatRank"
import { Loader } from "@/components/Loader"

interface EarnProps {
    authToken?: string;
}

export function Earn({ authToken }: EarnProps) {
    const { account } = useWallet();
    const { user } = useApp()
    const [open, setOpen] = useState(false);
    const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);


    const getTasks = useCallback(async () => {
        try {
            setIsLoadingTasks(true);
            const data = (await Api.sendBackendRequest(`/api/task/get?address=${account ? account.address.toString() : ""}`)).data;
            setTasks(data)
        } catch (error) {
            console.log(`[error-earn-getTasks]: ${error}`)
        } finally {
            setIsLoadingTasks(false);
        }
    }, [account])

    useEffect(() => {
        async function getLeaderboard() {
            try {
                setIsLoadingLeaderboard(true);
                const data = (await Api.sendBackendRequest('/api/auth/xp-leaderboard?offset=0&limit=10')).data as Leaderboard[];
                setLeaderboard(data);
            } catch (error) {
                setLeaderboard([])
                console.log(`[error-earn-getLeaderboard]: ${error}`)
            } finally {
                setIsLoadingLeaderboard(false);
            }
        }
        getLeaderboard()
    }, [])
    useEffect(() => {
        getTasks()
    }, [getTasks])


    const isInitialLoading = isLoadingTasks || isLoadingLeaderboard;

    if (isInitialLoading) {
        return <Loader />
    }

    return (
        <div className='p-4 md:p-8 space-y-[2.656rem]'>
            <div className='space-y-10'>
                <div className='flex gap-4 items-center'>
                    <H1 >Earning quest</H1>
                    <EarningsModal open={open} setOpen={setOpen} />
                </div>
                <div className='max-w-3xl flex flex-wrap md:gap-0 gap-4 justify-center md:justify-between mx-auto'>
                    <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg w-full sm:w-fit'>
                        <H1Xl>{user?.xp ?? 0} XP</H1Xl>
                        <Label14 className='text-muted'>Your Current XP</Label14>
                    </div>
                    <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg w-full sm:w-fit'>
                        <H1Xl>
                            {user?.rank ? formatRank(user?.rank ?? 0) : 0}
                            {/* {formatRank(user?.rank ?? 0)} */}
                        </H1Xl>
                        <Label14 className='text-muted'>Leaderboard rank</Label14>
                    </div>
                    <div className='text-center space-y-2 flex flex-col border-2 border-[#0a0a0a] p-4 px-10 rounded-lg w-full sm:w-fit'>
                        <H1Xl className='flex gap-2 justify-center'>
                            {/* 1
                            <div className='gap-1 flex items-center'>
                                <Image src={"/xp-image.svg"} alt="Xp Image" height={43} width={34} />
                                <Image src={"/is-equal.svg"} alt="Xp Image" height={12} width={12} />
                            </div>
                            XP to MOON */}
                            {user?.xp_earned ?? 0} XP
                        </H1Xl>
                        <Label14 className='text-muted'>Total Earned XP</Label14>
                    </div>
                </div>
            </div>

            <div className='space-y-8'>
                <H1>Guaranteed rewards</H1>
                <Tasks tasks={tasks} setTasks={setTasks} authToken={authToken} />
            </div>

            <div className='space-y-8'>
                <H1>LeaderBoard</H1>
                <RanksInfo leaderboard={leaderboard} />
            </div>
        </div>
    )
}

function Tasks({ tasks, authToken, setTasks }: { tasks: Task[], authToken?: string; setTasks: Dispatch<SetStateAction<Task[]>> }) {
    const { onSignIn } = useApp();

    const onClaimTask = async (task: Task) => {
        try {
            if (!authToken) {
                const token = await onSignIn();
                if (!token) return;
                authToken = token;
            };
            await Api.sendBackendRequest(`/api/task/claim/${task.id}`, "PUT", undefined, authToken);
            toast.success(`Successfully claimed ${task.xp} XP`);
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === task.id ? { ...t, claim_count: t.claim_count + 1 } : t
                )
            );
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }
    if (tasks.length === 0) return (
        <div className="flex items-center justify-center bg-card m-auto p-4 rounded-2xl w-full md:w-lg">
            <div className="not-found text-center">
                <H1>No active quests at the moment.</H1>
                <PMedium className="mt-4"> Fresh challenges will appear here soon.</PMedium>
                {/* <Image src='/empty-web.webp' alt="404" height={160} width={150} className='mt-8 mx-auto' /> */}
            </div>
        </div>
    )
    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className="bg-card flex-col md:flex-row  justify-between items-center flex gap-3 p-3 w-full rounded-[12px]"
                >
                    <div className="flex flex-col items-center md:items-start md:flex-row gap-3">
                        <div className="p-1 bg-background rounded-[8px] space-y-1 w-fit flex flex-col items-center">
                            <Image src={"/xp-bg.svg"} width={41} height={31} alt="" />
                            <Label14>+{task.xp} XP</Label14>
                        </div>

                        <div className="flex flex-col p-2 justify-between">
                            <Label14>{task.description}</Label14>
                            <div className="flex gap-2 items-center mt-2">
                                <div className="w-full md:w-40 bg-card-light rounded-full h-2 relative">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${task.progress}%` }}
                                    />
                                </div>
                                <XSMedium className="text-muted">{beautifyNumber(task.progress)}%</XSMedium>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="flex w-full md:w-fit items-center gap-2"
                        onClick={() => onClaimTask(task)}
                        disabled={task.progress < 100 || (task.repeatable === false && task.claim_count === 1)} // Disable until progress is complete
                    >
                        Claim {task.xp} XP
                    </Button>
                </div>
            ))}
        </div>
    )
}

function RanksInfo({ leaderboard }: { leaderboard: Leaderboard[] }) {

    return (
        <div className="max-w-7xl mx-auto">
            <Table className="rounded-xl">
                {/* Table Header */}
                <TableHeader className="bg-card-light rounded-2xl">
                    <TableRow>
                        <TableHead className="w-[150px] px-4.5 py-3">
                            <PMedium className="text-muted">Position</PMedium>
                        </TableHead>
                        <TableHead className="px-4.5 py-3 text-center">
                            <PMedium className="text-muted">XP Earned</PMedium>
                        </TableHead>
                        <TableHead className="px-4.5 py-3 text-right">
                            <PMedium className="text-muted">Account</PMedium>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-card">
                    {leaderboard.map((data, idx) => (
                        <TableRow key={data.address} className="border-b-0 hover:bg-none">
                            <TableCell className="flex items-center gap-3">
                                <Image
                                    src={data.x_display_picture ?? "/user-profile.png"}
                                    alt={`rank-${idx + 1}`}
                                    width={28}
                                    height={28}
                                    className="rounded-full"
                                />
                                <Label12>{formatRank(idx + 1)}</Label12>
                            </TableCell>

                            <TableCell className="text-center">
                                <Label12>{data.xp_earned}</Label12>
                            </TableCell>

                            <TableCell className="text-right">
                                <Link prefetch href={`/user/${data.address}`}>
                                    {
                                        data.x_username ? (
                                            <Label12>{data.x_username}</Label12>
                                        ) : (
                                            <Label12>{shortenAddress(data.address)}</Label12>
                                        )
                                    }
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}