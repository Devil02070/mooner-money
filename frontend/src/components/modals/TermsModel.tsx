"use client"

import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { H1, ButtonText, P, H3, PMedium } from "@/components/ui/typography"
import { Checkbox } from "../ui/checkbox"

type QuickGuideModalProps = {
    open?: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}

export function TermsModel() {
    const isMobile = useIsMobile()
    const [open, setOpen] = useState(false)
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const accepted = localStorage.getItem("disclaimer-accepted")
        if (accepted === "true") {
            setHasAcceptedTerms(true)
            setOpen(false)
        } else {
            setOpen(true)
        }
    }, [])

    const handleAcceptTerms = () => {
        localStorage.setItem("disclaimer-accepted", "true")
        setHasAcceptedTerms(true)
        setOpen(false)
    }

    if (!mounted || hasAcceptedTerms) {
        return null
    }

    if (!isMobile) {
        return <QuickGuideDialog open={open} setOpen={setOpen} onAccept={handleAcceptTerms} />
    }

    return <QuickGuideDrawer open={open} setOpen={setOpen} onAccept={handleAcceptTerms} />
}

// Desktop view: Dialog
function QuickGuideDialog({ open, setOpen, onAccept }: QuickGuideModalProps & { onAccept: () => void }) {
    const [isFormValid, setIsFormValid] = useState(false)

    return (
        <Dialog open={open} onOpenChange={(v) => v && setOpen(true)}>
            <DialogContent
                showCloseButton={false}
                // className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
                className="w-full max-w-lg flex flex-col max-h-[80vh]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogTitle >{''}</DialogTitle>
                <H1 className="text-center">Disclaimer</H1>

                <QuickGuideContent onAccept={onAccept} onValidityChange={setIsFormValid} />
                <DialogFooter>
                    <Button
                        onClick={onAccept}
                        className={`w-full mt-4 ${!isFormValid ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={!isFormValid}
                    >
                        <ButtonText className="text-black">I agree</ButtonText>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}

// Mobile view: Drawer
function QuickGuideDrawer({ open, setOpen, onAccept }: QuickGuideModalProps & { onAccept: () => void }) {
    const [isFormValid, setIsFormValid] = useState(false)

    return (
        <Drawer open={open} onOpenChange={(v) => v && setOpen(true)}>
            <DrawerContent
                className="bg-card flex flex-col h-[85dvh]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DrawerHeader className="flex-shrink-0">
                    <DrawerTitle>
                        {''}
                    </DrawerTitle>
                </DrawerHeader>
                <H1 className="text-center">Disclaimer</H1>
                <QuickGuideContent onAccept={onAccept} onValidityChange={setIsFormValid} className="px-2 mb-6" />
                <DrawerFooter className="flex-shrink-0">
                    <Button
                        onClick={onAccept}
                        className={`w-full ${!isFormValid ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={!isFormValid}
                    >
                        <ButtonText className="text-black">I agree</ButtonText>
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer >
    )
}

function QuickGuideContent({
    onValidityChange,
    className,
}: {
    onAccept: () => void
    onValidityChange?: (valid: boolean) => void
    className?: string
}) {
    const [termsChecked, setTermsChecked] = useState(false)
    const [responsibilityChecked, setResponsibilityChecked] = useState(false)

    const isFormValid = termsChecked && responsibilityChecked

    useEffect(() => {
        onValidityChange?.(isFormValid)
    }, [isFormValid, onValidityChange])

    return (
        <div className={`flex flex-col items-center gap-4 max-h-[50vh] overflow-hidden overflow-y-scroll  ${className || ""}`}>
            <P>Please check the boxes below to confirm your agreement to the mooner.money Terms and Conditions.</P>

            {/* Terms */}
            <div className="space-y-4 w-full mt-2">
                <H3>Terms of Use Agreement:</H3>
                <div className="flex gap-3 items-center">
                    <Checkbox
                        checked={termsChecked}
                        onCheckedChange={(checked) => setTermsChecked(checked === true)}
                        className="mt-1 flex-shrink-0 cursor-pointer"
                    />
                    <PMedium>
                        I have read, understood, and agree to be legally bound by mooner.money&apos;s Terms of Use, including any
                        future amendments. I acknowledge that this agreement is irrevocable and applies to all my uses of the
                        platform without requiring further confirmation for each instance.
                    </PMedium>
                </div>
            </div>

            {/* Responsibility */}
            <div className="space-y-4 w-full">
                <H3>Acknowledgment of Responsibility:</H3>
                <div className="flex gap-3 items-center">
                    <Checkbox
                        checked={responsibilityChecked}
                        onCheckedChange={(checked) => setResponsibilityChecked(checked === true)}
                        className="mt-1 flex-shrink-0 cursor-pointer"
                    />
                    <PMedium>
                        I acknowledge and agree that mooner.money provides tools for interacting with the blockchain but does not have
                        custody of my funds, the ability to transact on my behalf, or the power to reverse transactions. I
                        understand that mooner.money does not endorse or guarantee the value, utility, or legitimacy of any tokens
                        created. I accept full responsibility for my actions and agree to comply with all applicable laws and
                        regulations.
                    </PMedium>
                </div>
            </div>
        </div>
    )
}