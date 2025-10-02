import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { LuTwitter } from 'react-icons/lu'
import { RiTelegram2Fill } from 'react-icons/ri'

const Footer = () => {
    return (
        <footer className="mt-10 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between gap-6 md:gap-0 py-7 px-5 sm:px-8 md:px-10 text-center md:text-left">

            {/* Logo */}
            <div
                className="p-2 bg-[#CE79FC] rounded-full border border-black w-16 h-16 flex items-center justify-center"
                style={{ boxShadow: "2.867px 2.606px 0 -1.824px #000" }}
            >
                <Image src="/meow-token.png" alt="Meow Token" width={100} height={100} />
            </div>

            {/* Copyright */}
            <p className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold">
                © 2025 $MEOW. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex justify-center gap-4 items-center">

                <Link href={"https://www.meowtos.fun"} className='bg-white rounded-xl border shadow-[2.127px_3.646px_0_0_#000] border-black pb-3 pt-2 px-2' >
                    <Image src={"/meow-fun-logo.svg"} height={100} width={150} alt='' className='h-full' />
                </Link>
                <Link href="https://x.com/Meowtos" target="_blank">
                    <div
                        className="p-2 bg-[#FAE94F] flex items-center justify-center rounded-full border border-black w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                        style={{ boxShadow: "2.867px 2.606px 0 -1.824px #000" }}
                    >
                        <LuTwitter className="size-5 sm:size-6" />
                    </div>
                </Link>

                <Link href="https://t.me/meowaptos" target="_blank">
                    <div
                        className="p-2 bg-[#FB79C8] flex items-center justify-center rounded-full border border-black w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                        style={{ boxShadow: "2.867px 2.606px 0 -1.824px #000" }}
                    >
                        <RiTelegram2Fill className="size-5 sm:size-6" />
                    </div>
                </Link>
            </div>
        </footer>
    )
}

export default Footer
