"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string
    repeat?: number
    duration?: number
    fontSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
    strokeWidth?: string
}

// eslint-disable-next-line react/display-name
export const MeowMarquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
    ({
        className,
        text,
        repeat = 10,
        duration = 20,
        fontSize = "sm",
        strokeWidth = "1px",
        ...props
    }, ref) => {
        const { theme } = useTheme()
        const isDark = theme === "dark"

        return (
            <div className="lg:-rotate-7 -left-10 z-50 -right-10 bottom-0 lg:absolute w-[calc(100vw )] overflow-hidden">
                <div
                    ref={ref}
                    className={cn(
                        "relative w-full bg-[#FCEDCF] overflow-hidden ",
                        className
                    )}
                    {...props}
                >
                    {/* <>
                    <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-gradient-to-r from-background to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-gradient-to-l from-background to-transparent z-10" />
                </> */}
                    <motion.div
                        className="flex whitespace-nowrap"
                        animate={{
                            x: ["0%", "-50%"]
                        }}
                        transition={{
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                            duration,
                        }}
                    >
                        {[...Array(repeat)].map((_, index) => (
                            <div key={index} className="flex items-center my-3 mx-4">
                                <h1
                                    className={"text-ouline text-4xl text-white px-4"}
                                    style={{
                                        WebkitTextStroke: `${strokeWidth} ${isDark ? '#000' : '#000'}`,
                                        textShadow: "6.171px 10.579px 0 #000"
                                    }}
                                >
                                    {text}
                                </h1>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        )
    }
)