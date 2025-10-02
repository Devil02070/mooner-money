import { MeowMarquee } from '@/components/meow-marque'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Buy = () => {
    return (
        <div className="relative bg-[#D1FCFD]">
            <div className="py-[60px] md:py-[112px] max-w-6xl mx-auto px-5 sm:px-8 md:px-[80px] space-y-7 z-50">
                <h1
                    className="text-[36px] sm:text-[48px] md:text-[82px] text-center text-outline text-white font-bold leading-tight"
                    style={{ textShadow: "7px 12px 0 #000" }}
                >
                    How to Buy
                </h1>

                <div className="flex flex-col md:flex-row max-w-6xl gap-6 md:gap-10 mx-auto items-center md:items-start">
                    {/* Image Section */}
                    <Image
                        src="/meow-buy.webp"
                        width={532}
                        height={542}
                        alt="How to Buy Meow"
                        className="h-[200px] sm:h-[220px] md:h-[252px] w-auto"
                    />

                    {/* Text + Button Section */}
                    <div className="space-y-6 flex md:block flex-col items-center text-left mx-auto md:text-left w-full">
                        <div className="space-y-4 flex md:block flex-col items-center p-2 md:p-0">
                            <ul className="list-disc list-inside space-y-2">
                                <li className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                                    Step 1: Get Aptos wallet.
                                </li>
                                <li className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                                    Step 2: Grab APT.
                                </li>
                                <li className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                                    Step 3: Swap for $MEOW on Panora.
                                </li>
                                <li className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                                    Step 4: Pet your cat, you’re in.
                                </li>
                            </ul>
                        </div>

                        {/* Buy Button */}
                        <Link
                            href="https://app.panora.exchange/swap/aptos?pair=APT-MEOW"
                            target="_blank"
                            className="inline-block mx-auto"
                        >
                            <button
                                className="px-4 sm:px-5 py-4 sm:py-6 border border-black text-white rounded-xl cursor-pointer bg-[#1DD5D7] hover:scale-105 transition-transform duration-200"
                                style={{ boxShadow: "2.127px 3.646px 0 0 #000" }}
                            >
                                <h3
                                    className="text-outline text-lg sm:text-xl md:text-2xl font-normal"
                                    style={{ textShadow: "2.127px 3.646px 0 #000" }}
                                >
                                    Buy Now
                                </h3>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <MeowMarquee text="SAY MEOW" />
        </div>
    )
}

export default Buy
