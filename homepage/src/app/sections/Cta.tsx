import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Cta = () => {
    return (
        <div
            className="max-w-6xl relative mx-4 bg-[#FBF083] md:mx-auto p-5 sm:p-8 border h-[420px] sm:h-[460px] md:h-[500px] space-y-7 border-black rounded-xl"
            style={{ boxShadow: "7px 12px 0 0 #000" }}
        >
            {/* Heading */}
            <h1
                className="text-[36px] md:text-[48px] text-center z-10 text-outline sticky text-white font-bold leading-tight"
                style={{ textShadow: "rgb(0, 0, 0) 5px 7px 0px" }}
            >
                Purr into future
                <br />
                with meow
            </h1>

            {/* Buy Button */}
            <div className="w-full flex justify-center">
                <Link
                    href="https://app.panora.exchange/swap/aptos?pair=APT-MEOW"
                    target="_blank"
                    className="z-10"
                >
                    <button
                        className="px-4 sm:px-5 py-3 sm:py-5 border border-black text-white cursor-pointer rounded-xl bg-[#F9E320] hover:scale-105 transition-transform duration-200"
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

            {/* Bottom Image */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2">
                <Image
                    src="/meow-cta.webp"
                    alt="Meow CTA"
                    width={664}
                    height={864}
                    className="sm:w-[300px] sm:h-[400px] md:w-[332px] md:h-[431px] pointer-events-none"
                />
            </div>
        </div>
    )
}

export default Cta
