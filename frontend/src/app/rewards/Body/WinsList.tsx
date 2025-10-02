"use client"

import { useEffect, useRef } from "react"
import PlayWinsList, { PlayWinsListHandle } from "@/components/PlayWinsList"

const NAMES = [
    "Maria Gonzalez",
    "Liam Carter",
    "Ava Chen",
    "Noah Kim",
    "Sofia Rossi",
    "Ethan Patel",
    "Olivia Davis",
    "Lucas Martin",
]

function randomWin() {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)]
    const amount = [250, 500, 750, 1000, 1500, 2000][Math.floor(Math.random() * 6)]
    return { name, amount }
}

export default function PlayWinsPage() {
    const ref = useRef<PlayWinsListHandle>(null)

    // Demo: auto-add a win every ~4s
    useEffect(() => {
        const id = setInterval(() => {
            ref.current?.pushWin(randomWin())
        }, 4000)
        return () => clearInterval(id)
    }, [])

    return (
        <main className="p-6 flex flex-col items-center gap-6">
            <PlayWinsList
                ref={ref}
                initialWins={[]}
                maxItems={5}
            />

            {/* <div className="flex gap-3">
                <Button onClick={() => ref.current?.pushWin(randomWin())}>Add random win</Button>
            </div> */}
        </main>
    )
}
