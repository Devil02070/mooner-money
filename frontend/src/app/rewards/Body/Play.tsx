"use client"

import React, { useState, useRef, useEffect } from "react"
import EarningsModal from "@/components/modals/EarningsModal"
import { ButtonText, H1, H3, PMedium } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { Account, Ed25519PrivateKey, PrivateKey, PrivateKeyVariants } from "@aptos-labs/ts-sdk"
import { CA, GAME_OWNER } from "@/lib/env"
import { aptosClient } from "@/lib/aptos"
import Api from "@/lib/api"
import { GameAsset, useApp } from "@/providers/AppProvider"
import { toast } from "sonner"
import { errorMessage } from "@/utils/errorMessage"
import { OutcomeModal } from "@/components/modals/OutcomeModal"
import { WinnerLog } from "@/types/custom"
import { AnimatePresence, motion } from "framer-motion"
import { shortenAddress } from "@/utils/shortenAddress"
import { socket } from "@/utils/socket-io-client"

export interface SpinOutcome {
    title: string;
    description: string;
    reward: string;
}
interface PlayProps {
    authToken?: string;
}
export function Play({ authToken }: PlayProps) {
    const { onSignIn, currentGame, gameAsset, user, setUser } = useApp()
    const { account } = useWallet();
    const [open, setOpen] = useState(false);
    const spinDuration = 5000;
    const [isSpinning, setIsSpinning] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number | null>(null)
    const [outcome, setOutcome] = useState<SpinOutcome>();
    async function onSpin() {
        try {
            if (!account?.address) throw new Error("Wallet not connected");
            if (!currentGame) throw new Error("Game not found");
            if (!authToken) {
                const token = await onSignIn();
                if (!token) return;
                authToken = token;
            };
            if (user?.xp === 0) throw new Error("You have 0 spins")
            startSpinAnimation()
            const privateKey = PrivateKey.formatPrivateKey(GAME_OWNER, PrivateKeyVariants.Ed25519);
            const sender = Account.fromPrivateKey({
                privateKey: new Ed25519PrivateKey(privateKey)
            });

            const simpleTransaction = await aptosClient.transaction.build.simple({
                data: {
                    function: `${CA}::mooner_spin::start_spin`,
                    functionArguments: [currentGame.game_addr, account.address.toString()],
                    typeArguments: []
                },
                sender: sender.accountAddress
            })

            const [userTransactionResponse] = await aptosClient.transaction.simulate.simple({ signerPublicKey: sender.publicKey, transaction: simpleTransaction })
            if (!userTransactionResponse.success) {
                throw new Error(userTransactionResponse.vm_status)
            }
            await Api.sendBackendRequest(`/api/auth/spin`, "PUT", undefined, authToken);
            const pendingTransaction = await aptosClient.signAndSubmitTransaction({ signer: sender, transaction: simpleTransaction });
            await aptosClient.waitForTransaction({ transactionHash: pendingTransaction.hash })
            const transactionResponse = await aptosClient.getTransactionByHash({ transactionHash: pendingTransaction.hash });
            let xpToUser = user ? user.xp - 1 : 0;
            if (transactionResponse.type === "user_transaction") {
                const events = transactionResponse.events;
                const spinEvent = events.find((event) => event.type === `${CA}::mooner_spin::SpinEvent`);
                if (spinEvent) {
                    const type = spinEvent.data.type;
                    const amount = spinEvent.data.amount;
                    let title = "Oops !!";
                    let description = "Better luck next time";
                    let reward = "";
                    if (type == 0) {
                        title = "Congrats !!"
                        description = `You just won`
                        reward = `${amount} XP`;
                        xpToUser += Number(amount)
                    } else if (type == 2) {
                        title = "Congrats !!"
                        description = `You just won`
                        reward = `${Number(amount) / Math.pow(10, gameAsset?.decimals ?? 6)} ${gameAsset?.symbol} tokens`
                    }
                    setOutcome({ title, description, reward })
                }
            }
            if (user) {
                setUser({ ...user, xp: xpToUser })
            }
        } catch (error) {
            setOutcome(undefined)
            toast.error(errorMessage(error))
            console.log(`Fatal error in spin: ${error}`)
        } finally {
            setIsSpinning(false)
        }
    }

    const startSpinAnimation = () => {
        const container = containerRef.current
        if (isSpinning || !container) {
            throw new Error(`An error occured, either is spinning or container not found`)
        }
        setIsSpinning(true)
        const startTime = Date.now()
        const initialSpeed = 50 // pixels per frame at start
        const minSpeed = 0.5 // minimum speed before stopping

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / spinDuration, 1)

            // Easing function for smooth deceleration (cubic-out)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentSpeed = initialSpeed * (1 - easeOut)

            // Apply the scroll
            container.scrollLeft += currentSpeed
            // Reset scroll position when reaching the end to create infinite loop
            const maxScroll = container.scrollWidth - container.clientWidth
            if (container.scrollLeft >= maxScroll) {
                container.scrollLeft = 0
            }
            // Continue animation if not finished and speed is above minimum
            if (currentSpeed > minSpeed) {
                animationRef.current = requestAnimationFrame(animate)
            } else {
                console.log("[v0] Animation complete")
                setIsSpinning(false)
            }
        }
        animationRef.current = requestAnimationFrame(animate)
    }

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])
    return (
        // <div className='p-6 md:p-8 space-y-[4rem] md:space-y-[8.25rem]'>
        <div className='p-6 md:p-8 space-y-10 md:space-y-15'>
            <div className='flex gap-4 flex-col md:flex-row items-center'>
                <div className="flex justify-between md:justify-start md:gap-4 w-full">
                    <H1>Spin & Win Rewards</H1>
                    <ButtonText className='rounded-[6px] md:block hidden bg-card p-1'>1 XP = 1 Spin</ButtonText>
                    <EarningsModal open={open} setOpen={setOpen} />
                </div>
                <PMedium className='rounded-[6px] block md:hidden bg-card p-1'>1 XP = 1 Spin</PMedium>
            </div>
            <div className="text-center space-y-6">

                <div
                    ref={containerRef}
                    className="overflow-x-auto overflow-y-hidden mx-auto"
                    style={{
                        width: "100%", // Fixed width smaller than content
                        maxWidth: "100vw", // Responsive max width
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    <div className="flex gap-3 -ms-10 md:-ms-20" style={{ width: "max-content" }}>
                        {/* Create multiple sets for infinite scroll effect */}
                        {Array.from({ length: 4 }, (_, setIndex) => (
                            <React.Fragment key={setIndex}>
                                <Image src={"/mooner-spin.png"} width={217} height={218} alt="" className="h-30 w-30 md:h-54 md:w-54 flex-shrink-0" />
                                <Image src={"/mooner-spin-1.png"} width={217} height={218} alt="" className="h-30 w-30 md:h-54 md:w-54 flex-shrink-0" />
                                <Image src={"/mooner-spin-2.png"} width={217} height={218} alt="" className="h-30 w-30 md:h-54 md:w-54 flex-shrink-0" />
                                <Image src={"/mooner-spin-3.png"} width={217} height={218} alt="" className="h-30 w-30 md:h-54 md:w-54 flex-shrink-0" />
                                <Image src={"/mooner-spin-4.png"} width={217} height={218} alt="" className="h-30 w-30 md:h-54 md:w-54 flex-shrink-0" />
                                <Image src={"/mooner-spin-5.png"} width={217} height={218} alt="" className="h-30 w-30 md:h-54 md:w-54 flex-shrink-0" />
                            </React.Fragment>
                        ))}
                        {/* {Array.from({ length: 4 }, (_, setIndex) => (
                            <React.Fragment key={setIndex}>
                                <Image src={"/mooner-spin.png"} width={217} height={218} alt="" className="flex-shrink-0" />
                                <Image src={"/mooner-spin-1.png"} width={217} height={218} alt="" className="flex-shrink-0" />
                                <Image src={"/mooner-spin-2.png"} width={217} height={218} alt="" className="flex-shrink-0" />
                                <Image src={"/mooner-spin-3.png"} width={217} height={218} alt="" className="flex-shrink-0" />
                                <Image src={"/mooner-spin-4.png"} width={217} height={218} alt="" className="flex-shrink-0" />
                                <Image src={"/mooner-spin-5.png"} width={217} height={218} alt="" className="flex-shrink-0" />
                            </React.Fragment>
                        ))} */}
                    </div>
                </div>
                <Button onClick={() => onSpin()} disabled={isSpinning} className="px-8 py-2 text-lg">
                    Spin
                </Button>
            </div>
            <WinnerLogs />
            <OutcomeModal outcome={outcome} setOutCome={setOutcome} />
        </div>
    )
}
const OPACITIES = [
    "!opacity-100",
    "!opacity-75",
    "!opacity-50",
    "!opacity-25"
];
function WinnerLogs({ gameAsset }: { gameAsset?: GameAsset }) {
    const [wins, setWins] = useState<WinnerLog[]>([]);

    useEffect(() => {
        const socketHandler = (data: WinnerLog) => {
            setWins((prev) => {
                const copy = [...prev];
                if (copy.length >= 4) {
                    copy.pop();
                }
                return [data, ...copy]
            })
        }
        socket.on(`spin-win`, socketHandler);
        return () => {
            socket.off(`spin-win`, socketHandler);
        };
    }, [])
    return (
        <main className="p-6 flex flex-col items-center gap-6">
            <div className="space-y-3 flex flex-col items-center mx-auto">
                <AnimatePresence initial={false}>
                    {wins.map((win, idx) => {
                        const opacityClass = OPACITIES[idx] ?? OPACITIES[OPACITIES.length - 1]
                        return (
                            <motion.div
                                key={idx}
                                layout
                                initial={{ y: -14, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 14, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                                className={`rounded-xl flex gap-3 p-3 bg-card w-fit ${opacityClass}`}
                                aria-live={idx === 0 ? "polite" : undefined}
                            >
                                <H3 className="text-pretty">{shortenAddress(win.claimer)} Just won</H3>
                                <H3>{win.win_type === 0 ? `${win.amount} XP` : `${Number(win.amount) / Math.pow(10, gameAsset?.decimals ?? 6)}`}</H3>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {/* {wins.length === 0 && (
                <div className="rounded-xl flex gap-3 p-3 bg-card w-fit opacity-60">
                    <H3>No wins yet</H3>
                    <Image src={"/xp-win.svg"} height={32} width={24} alt="Win badge" />
                </div>
            )} */}
            
            </div>
        </main>
    )
}