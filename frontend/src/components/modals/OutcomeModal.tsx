"use client"

import React, { Dispatch, SetStateAction } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
} from "@/components/ui/drawer"
import { H3, Label12, XS } from "../ui/typography"
import { useIsMobile } from "@/hooks/use-mobile"
import { SpinOutcome } from "@/app/rewards/Body/Play"

type OutcomeModalProps = {
    outcome?: SpinOutcome;
    setOutCome: Dispatch<SetStateAction<SpinOutcome | undefined>>;
}

export function OutcomeModal({ outcome, setOutCome }: OutcomeModalProps) {
    const isMobile = useIsMobile()
    const setOpen = (e: boolean) => {
        if (e === false) {
            setOutCome(undefined)
        }
    }
    if (!isMobile) {
        return <OutcomeDialog open={outcome !== undefined} setOpen={setOpen} outcome={outcome} />
    }
    return <OutcomeDrawar open={outcome !== undefined} setOpen={setOpen} outcome={outcome} />
}
interface CommonProps {
    open: boolean,
    setOpen: (e: boolean) => void,
    outcome?: SpinOutcome
}
function OutcomeDialog({ open, setOpen, outcome }: CommonProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogContent showCloseButton={false} className="w-full  max-w-full bg-card rounded-3xl shadow-2xl p-8 max-h-[calc(100vh-2rem)] flex flex-col">
                {outcome && <Content outcome={outcome} />}
            </DialogContent>
        </Dialog>
    )
}

function OutcomeDrawar({ open, setOpen, outcome }: CommonProps) {
    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="max-h-[80vh] bg-card overflow-hidden" >
                {outcome && <Content outcome={outcome} className={"px-4"} />}
            </DrawerContent>
        </Drawer>
    )
}

function Content({ outcome, className }: { outcome: SpinOutcome, className?: string }) {
    return (
        <div
            className={`flex-1 text-center overflow-y-auto md:px-6 pb-6 ${className || ''}`}
        >
            <div
                className="p-4 size-40 mx-auto rounded-2xl flex flex-col gap-3"
                style={{
                    backgroundImage: 'url(/mooner-spin-5.png)',
                    backgroundSize: 'cover',        // cover the div
                    backgroundPosition: 'center',   // center the image
                    backgroundRepeat: 'no-repeat',  // prevent repeating
                }}
            >
                <div className="bg-card rounded-2xl h-full flex items-center justify-center gap-3 flex-col p-3">
                    <div className="flex flex-col gap-1">
                        <Label12 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            {outcome.title}
                        </Label12>
                        <XS className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            {outcome.description}
                        </XS>

                    </div>
                    <div className="flex items-center gap-2">
                        <H3>{outcome.reward}</H3>
                        {/* <Image src={"/xp-image.svg"} width={32} height={24} alt="" /> */}
                    </div>
                </div>
            </div>
        </div>

    )
}

