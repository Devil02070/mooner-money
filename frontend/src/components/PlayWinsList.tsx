"use client"

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"
import { H3 } from "./ui/typography"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"

type Win = {
    id: string
    name: string
    amount: number
}

export type PlayWinsListHandle = {
    pushWin: (win: Omit<Win, "id">) => void
}

type PlayWinsListProps = {
    initialWins?: Omit<Win, "id">[]
    maxItems?: number
}

const OPACITIES = [
    "!opacity-100",
    "!opacity-75",
    "!opacity-50",
    "!opacity-25"
];

const PlayWinsList = forwardRef<PlayWinsListHandle, PlayWinsListProps>(function PlayWinsList(
    { initialWins = [], maxItems = 4 },
    ref,
) {
    const seeded = useMemo<Win[]>(
        () =>
            initialWins.slice(0, maxItems).map((w, i) => ({
                id: `${i}-${w.name}-${w.amount}`,
                name: w.name,
                amount: w.amount,
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const [wins, setWins] = useState<Win[]>(seeded)
    const idCounter = useRef(0)

    useImperativeHandle(ref, () => ({
        pushWin: (win: Omit<Win, "id">) => {
            const id = `win-${Date.now()}-${idCounter.current++}`
            setWins((prev) => {
                const next = [{ id, ...win }, ...prev]
                return next.slice(0, maxItems)
            })
        },
    }))

    return (
        <div className="space-y-3 flex flex-col items-center mx-auto">
            <AnimatePresence initial={false}>
                {wins.map((win, idx) => {
                    const opacityClass = OPACITIES[idx] ?? OPACITIES[OPACITIES.length - 1]

                    return (
                        <motion.div
                            key={win.id}
                            layout
                            initial={{ y: -14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 14, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                            className={`rounded-xl flex gap-3 p-3 bg-card w-fit ${opacityClass}`}
                            aria-live={idx === 0 ? "polite" : undefined}
                        >
                            <H3 className="text-pretty">{win.name} Just won</H3>
                            <H3>{win.amount}</H3>
                            <Image src={"/xp-win.svg"} height={32} width={24} alt="Win badge" />
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
    )
})

export default PlayWinsList
