'use client'
import dynamic from "next/dynamic";
import { slackey } from "../fonts";
const WalletButton = dynamic(
    async () => {
        const { WalletButton } = await import("@/components/WalletButton");
        return { default: WalletButton };
    },
    {
        loading: () => (
            <Button
                type="button"
                className={"connect-wallet-btn"}
                size={"default"}
            >
                Connect Wallet
            </Button>
        ),
        ssr: false,
    }
);
import React, { useEffect, useState } from "react";
import { QuickGuideModal } from "../modals/QuickGuideModal";
import { RecentTrade } from "@/types/custom";
import Api from "@/lib/api";
import { socket } from "@/utils/socket-io-client";
import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/utils/constants";
import { ButtonText, PButtonLink } from "../ui/typography";
import { usePathname } from "next/navigation";
import SearchModal from "./SearchModal";
import { RecentTrades } from "./RecentTrades";
import { Button } from "../ui/button";
import RotatingText from "./RotatingText";
export function Header() {
    const pathname = usePathname()
    const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);

    useEffect(() => {
        async function getRecentTrades() {
            try {
                const data = (await Api.sendBackendRequest(`/api/trade/recent`)).data as RecentTrade[];
                setRecentTrades(data)
            } catch (error) {
                console.log(`[error-header-getRecentTrades]: ${error}`)
            }
        }
        getRecentTrades()
    }, [])

    useEffect(() => {
        const socketHandler = (data: RecentTrade) => {
            setRecentTrades((prev) => {
                return [data, ...prev]
            })
        }
        socket.on(`recent-trade`, socketHandler);
        return () => {
            socket.off(`token-traded`, socketHandler);
        };
    }, [])


    return (
        <React.Fragment>
            <div className='md:hidden flex p-4 py-3 rounded-t-lg border-t fixed bottom-0 bg-background right-0 left-0 z-50 w-full'>
                <div className="flex w-full  items-center gap-4">
                    <nav className="flex md:hidden justify-between md:justify-start w-full items-center">
                        {navItems.map((item, i) => {
                            const isActive = pathname === item.url;
                            return (
                                <ButtonText
                                    key={i}
                                    className={`py-3 px-4.5 rounded-full flex items-center gap-2 ${isActive
                                        ? "text-primary bg-card"
                                        : "text-white hover:text-primary-default"
                                        }`}
                                >
                                    {isActive && <item.icon size={18} />} {/* Show icon only if active */}
                                    {
                                        item.disabled ?
                                            <Button className=" py-3 px-0 bg-unset text-white rounded-full flex items-center gap-1" disabled>
                                                <PButtonLink>{item.title}</PButtonLink>
                                                <sup className="bg-card rounded-lg px-1 text-[8px] py-2">Soon</sup>
                                            </Button>
                                            :
                                            <Link prefetch href={`${item.url}`}>
                                                <PButtonLink>{item.title}</PButtonLink>
                                            </Link>
                                    }
                                </ButtonText>
                            );
                        })}
                    </nav>
                </div>
            </div>
            <header className="pt-3 bg-background sticky top-0 z-40">
                <div className="max-w-100dvw m-auto px-4 md:px-6">
                    <div className="flex items-center justify-between">
                        <div className="logo relative flex items-center gap-5">
                            <Logo />
                            <div className="md:flex hidden  items-center gap-4">
                                <nav className=" hidden md:flex justify-between md:justify-start w-full items-center">
                                    {
                                        navItems.map((item, i) => {
                                            return (
                                                <ButtonText key={i} className={`py-3 px-4.5 rounded-full ${pathname === item.url ? 'text-primary bg-card' : 'text-white hover:text-primary-default'}`} >
                                                    {
                                                        item.disabled ?
                                                            <Button className=" py-3 px-0 bg-unset text-white rounded-full flex items-center gap-1" disabled>
                                                                <PButtonLink>{item.title}</PButtonLink>
                                                                <sup className="bg-card rounded-lg px-2 text-[10px] py-3">Soon</sup>
                                                            </Button>
                                                            :
                                                            <Link prefetch href={`${item.url}`}>
                                                                <PButtonLink>{item.title}</PButtonLink>
                                                            </Link>
                                                    }
                                                </ButtonText>
                                            )
                                        })
                                    }
                                </nav>
                            </div>
                        </div>

                        <div className="flex justify-end items-center">
                            <div className="flex items-center gap-4">
                                <div className="hidden md:block">
                                    <SearchModal />
                                </div>
                                <div className="md:hidden">
                                    <SearchModal />
                                </div>
                                <QuickGuideModal />
                                <WalletButton />
                            </div>
                        </div>
                    </div>
                    <RecentTrades trades={recentTrades} />
                </div>
            </header>
        </React.Fragment>

    );
}

function Logo() {
    return (
        <Link prefetch href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <Image quality={100} src="/logo-icon.svg" alt="logo" height={29} width={32} className="" />
                <h1 className={`${slackey.className} text-2xl transform hidden md:block`}>
                    <span className="text-primary">Mooner</span>
                </h1>

                <RotatingText
                    texts={['Money', 'Memes', 'Tokens', 'Launch']}
                    mainClassName="hidden md:block ps-1 px-0 text-[#FC79C9] w-27 xl:w-22 text-xl overflow-hidden py-0.5 sm:py-1 md:py-1 justify-center rounded-lg"
                    staggerFrom={"last"}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2000}
                />
            </div>
            <div className="relative ml-1 rounded-lg p-[0.5px] md:p-[1px] bg-gradient-to-t from-gray-100 via-gray-400 to-gray-800 inline-block">
                <div className="bg-card rounded-lg px-2 py-[2px] text-[10px]">Beta</div>
            </div>
        </Link>
    )
}
