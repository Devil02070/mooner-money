"use client";

import React, { useState } from "react";
import {
    ChevronDown,
    Copy,
    Check,
    ChevronRight,
    LogOut,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "usehooks-ts";
import { useIsMobile } from "@/hooks/use-mobile";
import { truncateAddress, useWallet } from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";
import { WalletModal } from "./modals/WalletModal";
import { shortenAddress } from "@/utils/shortenAddress";
import { PMedium, Small } from "./ui/typography";
import Link from "next/link";
import clsx from "clsx";
import { deleteAuthToken } from "@/lib/cookieStore";
import { useApp } from "@/providers/AppProvider";

interface WalletButtonProps {
    className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
    const { account, wallet, isLoading, disconnect } = useWallet();
    const { user } = useApp()
    const [, copy] = useCopyToClipboard();
    const isMobile = useIsMobile();
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    const handleCopyAddress = async (walletAddress: string) => {
        try {
            await copy(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 5000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="relative rounded-md overflow-hidden border-[1.5px] p-2.5 md:p-3 flex items-center gap-2 justify-center">
                <span className="hidden lg:block">Connecting...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
        );
    }

    // If wallet is not connected
    if (!account)
        return (
            <>
                <Button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={clsx("connect-wallet-btn ", className)}
                    size={isMobile ? "icon" : "default"}
                >
                    {isMobile ? <Wallet className="h-5 w-5" /> : "Connect Wallet"}
                </Button>

                {/* Wallet Modal */}
                <WalletModal open={open} setOpen={setOpen} />
            </>
        );

    // If wallet is connected
    return (
        <DropdownMenu>
            {isMobile ? (
                <DropdownMenuTrigger className={clsx(
                    "relative rounded-md overflow-hidden border-[1.5px] p-1",
                    className
                )}>
                    <Image
                        src={user?.x_display_picture ?? "/logo-icon.svg"}
                        alt={wallet ? wallet.name : ""}
                        height={28}
                        width={28}
                        className="rounded object-cover"
                    />
                </DropdownMenuTrigger>
            ) : (
                <DropdownMenuTrigger className="w-max relative rounded-[12px] overflow-hidden border flex items-center gap-2 p-1 focus:outline-none cursor-pointer">
                    <Image
                        src={user?.x_display_picture ?? "/logo-icon.svg"}
                        alt={wallet ? wallet.name : ""}
                        height={30}
                        width={30}
                        className="h-8 w-8 rounded object-cover"
                    />
                    {account.ansName
                        ? shortenAddress(account.ansName.toString())
                        : shortenAddress(account.address.toString())}
                    <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
            )}

            <DropdownMenuContent
                align="end"
                className="w-72 z-50 p-0 shadow md:shadow-md"
            >
                <DropdownMenuItem className="py-3 px-4 cursor-pointer relative border-b rounded-none">
                    <div className="relative overflow-hidden">
                        <Image
                            src={user?.x_display_picture ?? "/logo-icon.svg"}
                            alt={wallet ? wallet.name : ""}
                            height={30}
                            width={30}
                            className="h-8 w-8 rounded object-cover"
                        />
                    </div>
                    <div className="space-y-1">
                        <PMedium
                            className="flex items-center gap-2 text-text-secondary font-semibold"
                            onClick={() => handleCopyAddress(account.address.toString())}
                        >
                            {account.ansName
                                ? shortenAddress(account.ansName.toString())
                                : truncateAddress(account.address.toString())}
                            {copied ? (
                                <Check className="w-3 h-3 text-success" />
                            ) : (
                                <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            )}
                        </PMedium>
                    </div>
                </DropdownMenuItem>

                <Link href={`/user/${account.address}`}>
                    <DropdownMenuItem className="p-4 py-3 border-b justify-between cursor-pointer hover:bg-none rounded-none text-text-error font-semibold">
                        <Small> Dashboard </Small>
                        <ChevronRight />
                    </DropdownMenuItem>
                </Link>

                {/* <DropdownMenuItem onClick={async () => await authorizeTwitterUserRedirect()} className="p-4 border-b justify-between cursor-pointer hover:bg-none rounded-none text-text-error font-semibold">
                    <Small> Connect with Twitter </Small>
                    <ChevronRight />
                </DropdownMenuItem> */}

                <DropdownMenuItem
                    className="p-4 py-3 justify-between cursor-pointer hover:bg-none rounded-none text-text-error font-semibold"
                    onClick={() => {
                        deleteAuthToken()
                        disconnect()
                    }}
                >
                    <Small className="text-danger"> Disconnect </Small>
                    <LogOut className="text-danger" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
