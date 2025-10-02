"use client"
import { groupAndSortWallets, useWallet, WalletItem, isInstallRequired, AdapterWallet, AdapterNotDetectedWallet } from "@aptos-labs/wallet-adapter-react"
import Image from "next/image"
import React, { Dispatch, SetStateAction, useState } from "react"
import { Button } from "../ui/button"
import { ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { ButtonText, H1 } from "../ui/typography"
import { useIsMobile } from "@/hooks/use-mobile"

type WalletModalProps = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export function WalletModal({ open, setOpen }: WalletModalProps) {
    const isMobile = useIsMobile()

    if (!isMobile) {
        return <WalletDialog open={open} setOpen={setOpen} />
    }

    return <WalletDrawer open={open} setOpen={setOpen} />
}

function WalletDialog({ open, setOpen }: WalletModalProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogContent showCloseButton={false} className="max-h-[calc(100vh-2rem)] flex flex-col">
                <Button variant={"ghost"} onClick={() => setOpen(false)} className="text-primary absolute right-2 top-2">ESC</Button>
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-center">
                        {''}
                    </DialogTitle>
                </DialogHeader>
                <H1 className="mb-10 text-center">Connect Wallet</H1>
                <WalletModalContent setOpen={setOpen} />
            </DialogContent>
        </Dialog>
    )
}

function WalletDrawer({ open, setOpen }: WalletModalProps) {
    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="max-h-[80vh] bg-card overflow-hidden" >
                <DrawerHeader>
                    <DrawerTitle>
                        {''}
                    </DrawerTitle>
                </DrawerHeader>
                <H1 className="mb-6 text-center">Connect Wallet</H1>
                <WalletModalContent setOpen={setOpen} className="" />
            </DrawerContent>
        </Drawer>
    )
}

function WalletModalContent({ setOpen, className }: { setOpen: Dispatch<SetStateAction<boolean>>, className?: string }) {
    const { wallets = [], notDetectedWallets = [] } = useWallet()
    const { availableWallets, installableWallets, aptosConnectWallets } = groupAndSortWallets([...wallets, ...notDetectedWallets])
    const [showMoreOptions, setShowMoreOptions] = useState(false)

    return (
        <div className={`flex-1 overflow-y-auto pb-4 ${className || ''}`}>
            {/* Social Login Options */}
            <div className="space-y-4">
                {
                    (aptosConnectWallets.map(wallet => (
                        <WalletItem wallet={wallet} onConnect={() => setOpen(false)} key={wallet.name}>
                            <WalletItem.ConnectButton asChild>
                                <Button
                                    type="button"
                                    className="w-full sm:w-[60%] hover:bg-background/40 bg-background rounded-full cursor-pointer mx-auto flex items-center justify-center gap-4 p-2"
                                >
                                    <ButtonText>{wallet.name}</ButtonText>
                                    <Image
                                        src={wallet.icon}
                                        width={20}
                                        height={20}
                                        alt={wallet.name}
                                        className="w-5 h-5"
                                        priority
                                    />
                                </Button>
                            </WalletItem.ConnectButton>
                        </WalletItem>
                    )))
                }
            </div>

            {/* Divider */}
            <div className="flex items-center w-[60%] mx-auto gap-4 py-5">
                <div className="flex-1 h-px bg-muted"></div>
                <span className="text-muted text-lg">or</span>
                <div className="flex-1 h-px bg-muted"></div>
            </div>

            {/* Wallet Options */}
            <div>
                {availableWallets.map(wallet => (
                    <WalletRow wallet={wallet} onConnect={() => setOpen(false)} key={wallet.name} />
                ))}
            </div>

            {/* More Options */}
            <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full flex items-center justify-center gap-2 p-1 cursor-pointer transition-colors"
                aria-expanded={showMoreOptions}
                aria-label="Show more wallet options"
            >
                <ButtonText className="text-primary">See More</ButtonText>
                <ChevronDown
                    size={20}
                    className={`transform text-primary transition-transform duration-300 ${showMoreOptions ? "rotate-180" : ""}`}
                />
            </button>

            {/* Additional Options (when expanded) */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showMoreOptions ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`} >
                <div className="rounded-xl">
                    {installableWallets.map(wallet => (
                        <WalletRow wallet={wallet} onConnect={() => setOpen(false)} key={wallet.name} />
                    ))}
                </div>
            </div>
        </div>
    )
}

interface WalletRowProps {
    wallet: AdapterWallet | AdapterNotDetectedWallet;
    onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
    return (
        <WalletItem key={wallet.name} wallet={wallet} onConnect={onConnect}>
            <div className="flex items-center justify-between p-1 md:p-2.5 rounded transition-colors mb-2" >
                <div className="flex items-center gap-2.5">
                    <div className="rounded-xl flex items-center justify-center">
                        <WalletItem.Icon className="object-contain h-8 w-8" />
                    </div>
                    <WalletItem.Name className="text-[1rem]  leading-[1rem] font-medium tracking-[0]" />
                </div>

                {isInstallRequired(wallet) ? (
                    <Button variant="outline" asChild className="border-primary text-primary bg-transparent">
                        <WalletItem.InstallLink />
                    </Button>
                ) : (
                    <WalletItem.ConnectButton asChild>
                        <Button>Detected</Button>
                    </WalletItem.ConnectButton>
                )}
            </div>
        </WalletItem>
    )
}