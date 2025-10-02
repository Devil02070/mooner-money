"use client"

import React from "react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { H1, ButtonText, P, PSemiBold } from "@/components/ui/typography"
import { Info } from "lucide-react"
import { useApp } from "@/providers/AppProvider"
import { getAmountToRaise } from "@/lib/math"
export function QuickGuideModal() {
    const isMobile = useIsMobile()

    if (!isMobile) {
        return <QuickGuideDialog />
    }

    return <QuickGuideDrawer />
}

// Desktop view: Dialog
function QuickGuideDialog() {
    return (
        <Dialog >
            <DialogTrigger className="cursor-pointer">
                <ButtonText className='flex items-center gap-1'><Info size={16} />
                </ButtonText></DialogTrigger>
            <DialogContent showCloseButton={false} className="w-full flex flex-col" >
                <DialogTitle >{''}</DialogTitle>
                <H1 className="text-center">Quick Guide</H1>
                <QuickGuideContent />
                <DrawerFooter className="flex-shrink-0 p-0 mt-4">
                    <DrawerClose className="bg-primary text-primary-foreground text-[1rem] leading-[1.125rem] font-medium hover:bg-primary/90 px-4.5 py-3 h-[2.625rem] rounded-[12px] cursor-pointer">
                        <ButtonText className="text-black">Got it</ButtonText>
                    </DrawerClose>
                </DrawerFooter>
            </DialogContent>
        </Dialog>
    )
}

// Mobile view: Drawer
function QuickGuideDrawer() {
    return (
        <Drawer >
            <DialogTrigger className="cursor-pointer">
                <ButtonText className=' flex items-center gap-1'><Info size={16} />
                </ButtonText>
            </DialogTrigger>
            <DrawerContent className="max-h-[80vh] bg-card overflow-hidden">
                <DrawerTitle>{''}</DrawerTitle>
                <H1 className="text-center py-4">Quick Guide</H1>
                <QuickGuideContent />
                <DrawerFooter className="flex-shrink-0 ">
                    <DrawerClose className="bg-primary text-primary-foreground text-[1rem] leading-[1.125rem] font-medium hover:bg-primary/90 px-4.5 py-3 h-[2.625rem] rounded-[12px] cursor-pointer">
                        <ButtonText className="text-black">Got it</ButtonText>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

function QuickGuideContent({
    className,
}: {
    className?: string
}) {
    const { config, chainToken } = useApp()
    return (
        <div className={`flex flex-col items-center max-h-[50vh] overflow-hidden overflow-y-scroll gap-4 ${className || ""}`}>
            <P>
                Mooner money ensures token security by verifying the safety of each token created. All tokens launched on Mooner money are fair and transparent.
            </P>
            <ul className="space-y-4 list-decimal list-inside text-left">
                <PSemiBold><li>Select a token that interests you and aligns with your goals.</li></PSemiBold>
                <PSemiBold><li>Buy tokens through the bonding curve for a fair entry.</li></PSemiBold>
                <PSemiBold><li>Sell anytime to secure gains or limit losses as you choose.</li></PSemiBold>
                <PSemiBold><li>When {config ? getAmountToRaise(config.virtual_aptos_reserves, config.supply * Math.pow(10, config.decimals), config.locked_percentage) / Math.pow(10, chainToken.decimals) : 1200} APT is raised through purchases, the token advances to the next stage.</li></PSemiBold>
                <PSemiBold><li>Raised APT goes to Thala swap, with LP tokens burned for added security.</li></PSemiBold>
                <PSemiBold><li>Convert your tokens to start trading on Thala..</li></PSemiBold>
            </ul>

        </div >
    )
}
