"use client"
import React from "react";
import { slackey } from "./fonts";
import Image from "next/image";

export const Loader = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="flex items-center gap-4 flex-col">
                <Image src="/logo-icon.svg" alt="logo" height={40} width={40} className="animate-bounce" />
                <div className="flex items-center gap-2">
                    <h1 className={`${slackey.className} text-2xl transform`}>
                        <span className="text-primary">Mooner</span>
                        <span className="text-[#FC79C9] ms-2">Money</span>
                    </h1>
                </div>
                {/* <div className="loader"></div> */}

            </div>
        </div >
    );
};
