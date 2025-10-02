import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LuTwitter } from 'react-icons/lu'
import { RiTelegram2Fill } from 'react-icons/ri'

const Header = () => {
    return (
        <nav className='p-4 space-x-2 w-full mx-auto sticky  bg-transparent  flex  justify-between items-center'>
            {/* Logo */}
            <div
                className="p-2 bg-[#CE79FC] rounded-full border border-black w-16 h-16 flex items-center justify-center"
                style={{ boxShadow: "2.867px 2.606px 0 -1.824px #000" }}
            >
                <Image src="/meow-token.png" alt="Meow Token" quality={80} width={100} height={100} loading='lazy' />

            </div>



            {/* Social Icons */}
            <div className="flex justify-center gap-4 items-center">

                <Link href={"https://www.meowtos.fun"} className='bg-white rounded-xl border shadow-[2.127px_3.646px_0_0_#000] border-black pb-3 pt-2 px-2' >
                    <Image src={"/meow-fun-logo.svg"} height={100} quality={80} width={150} alt='' className='h-full' />
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
        </nav>
    )
}

export default Header
