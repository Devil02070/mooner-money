import Image from 'next/image'
import React from 'react'

const Vision = () => {
    return (
        <div className="py-[60px] md:py-[112px] px-5 sm:px-8 md:px-[80px] space-y-7">
            <div className="flex  md:flex-row max-w-6xl items-center gap-6 md:gap-10 mx-auto">

                {/* Text Section */}
                <div className="space-y-4 p-2 md:p-0 text-left md:text-left">
                    <h1
                        className="text-[36px] text-center sm:text-[48px] md:text-[82px] text-outline text-white font-bold leading-tight"
                        style={{ textShadow: "7px 12px 0 #000" }}
                    >
                        Our vision <br /> with meow
                    </h1>

                    <div className="flex md:hidden justify-center md:justify-end">
                        <Image
                            src="/meow-vision.webp"
                            width={532}
                            height={542}
                            alt="Meow Vision"
                            className="h-[200px] sm:h-[220px] md:h-[252px] w-auto"
                        />
                    </div>

                    <p className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                        $MEOW aims to be the face of fun on Aptos:
                    </p>

                    <ul className="list-disc list-inside space-y-2">
                        <li className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                            Community-first: No central overlords. The holders drive the movement.
                        </li>
                        <li className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                            Culture-driven: Memes are the fastest way to spread ideas. We embrace it.
                        </li>
                    </ul>
                </div>

                {/* Image Section */}
                <div className="hidden md:flex justify-center md:justify-end">
                    <Image
                        src="/meow-vision.webp"
                        width={262}
                        height={252}
                        alt="Meow Vision"
                        className="h-[200px] sm:h-[220px] md:h-[252px] w-auto"
                    />
                </div>
            </div>
        </div>
    )
}

export default Vision
