'use client'
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ButtonText, H1, P } from "../ui/typography";
import { NETWORK } from "@/lib/env";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function TestnetModal() {
    const currentNetwork = NETWORK;
    const { account, disconnect, network } = useWallet()
    const [open, setOpen] = useState(false)
    useEffect(() => {
        if (account && network?.name !== currentNetwork) {
            setOpen(true)
        }

    }, [account])

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => v && setOpen(true)}>
                <DialogContent
                    showCloseButton={false}
                    className=" w-[90%] max-w-lg flex flex-col max-h-[80vh]"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogTitle >{''}</DialogTitle>
                    <H1 className="text-center">Unsupported Network</H1>
                    <P className="text-center">Please switch to Aptos {currentNetwork} using your wallet and then reconnect.</P>
                    <Button className="focus:outline-none w-fit m-auto"><ButtonText className="text-black" onClick={() => {
                        setOpen(false)
                        disconnect()
                    }}>Disconnect</ButtonText>
                    </Button>
                </DialogContent>
            </Dialog >
        </>
    )
}