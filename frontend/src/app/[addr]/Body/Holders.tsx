"use client"

import { Label12, PMedium } from "@/components/ui/typography"
import { Holder } from "@/types/custom";
import { beautifyNumber } from "@/utils/beautifyNumbers";
import { shortenAddress } from "@/utils/shortenAddress";
import Link from "next/link";

interface HoldersProps {
    data: Holder[];
    dev: string;
}

export function Holders({ data }: HoldersProps) {
    return (
        <div className='bg-card p-4 rounded-[12px]'>
            <div className='flex text-muted justify-between'>
                <Label12>Holder</Label12>
                <Label12>Percentage</Label12>
            </div>
            <div className='mt-4 space-y-2 max-h-[25rem] overflow-hidden overflow-y-scroll scrollbar-hide'>
                {data.map(holder => (
                    <div key={holder.user_addr} className='flex justify-between'>
                        <PMedium>
                            {/* <Link href={holder.user?.x_username ? getAccountOnX(holder.user.x_username) : getAccountOnExplorer(holder.user_addr)} > */}
                            <Link href={`/user/${holder.user_addr}`} >
                                {holder.user?.x_username ? holder.user.x_username : shortenAddress(holder.user_addr)}
                            </Link>
                        </PMedium>
                        <PMedium>{beautifyNumber(holder.percentage)}%</PMedium>
                    </div>
                ))}
            </div>
        </div>
    )
}