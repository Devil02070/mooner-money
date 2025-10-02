import { MeowMarquee } from '@/components/meow-marque'
import Image from 'next/image'
import React from 'react'

const About = () => {
    return (
        <div className="relative bg-[#FDD1EB]">
            <div className="py-[60px] md:py-[112px] max-w-6xl mx-auto px-5 sm:px-8 md:px-[80px] space-y-7">
                <h1
                    className="text-[36px] sm:text-[48px] md:text-[82px] text-outline text-white font-bold leading-tight"
                    style={{ textShadow: '7px 12px 0 #000' }}
                >
                    About meow
                </h1>

                <div className="flex flex-col md:flex-row max-w-5xl gap-6 md:gap-10 bg-[#FDD1EB] items-start md:items-start">
                    <Image
                        src="/meow-about.webp"
                        width={532}
                        height={542}
                        alt="About Meow"
                        className="h-[200px] sm:h-[220px] md:h-[252px] w-auto"
                    />

                    {/* Text container */}
                    <div className="space-y-4 p-2 md:p-0 h-auto text-left md:text-left">
                        <p className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold leading-relaxed">
                            MEOW isn’t just a token—it’s the loudest purr on Aptos. We’re here to scratch up the old rules and drop nine lives of pure chaos, memes, and community vibes.
                        </p>
                        <p className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold leading-relaxed">
                            Cats already run the internet. Now they’re claiming the blockchain. $MEOW is fun-first, fast, and unapologetically feral. But don’t get it twisted—we’re not just here for quick scratches. We’re here to claw our way into culture and stick around.
                        </p>
                    </div>
                </div>
            </div>

            <MeowMarquee text="PURR INTO FUTURE" />
        </div>
    )
}

export default About
