"use client"

import { Button } from "@/components/ui/button"
import { H3, XSMedium } from "@/components/ui/typography"
import Api from "@/lib/api"
import { authorizeTwitterUserRedirect } from "@/lib/twitter"
import { useApp, User } from "@/providers/AppProvider"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { RiTwitterXFill, RiTwitterXLine } from "react-icons/ri"
import { shortenAddress } from "@/utils/shortenAddress"
import Link from "next/link"
import { getAccountOnExplorer, getAccountOnX, getMultipleFungibleAssetBalances } from "@/lib/aptos"
import { CiWallet } from "react-icons/ci"
import { toast } from "sonner"
import { errorMessage } from "@/utils/errorMessage"
import { MdOutlineVerified } from "react-icons/md"
interface UserInfoProps {
    address: string;
    authToken?: string;
}
export function UserInfo({ address, authToken }: UserInfoProps) {
    const { chainToken, onSignIn } = useApp()
    const { account } = useWallet()
    const [user, setUser] = useState<User>({
        rank: 0,
        xp_earned: 0,
        address,
        xp: 0,
    });
    const [balance, setBalance] = useState(0);
    const onConnectX = async () => {
        try {
            if (!authToken) {
                const token = await onSignIn();
                if (!token) throw new Error("Request cancelled")
            };
            await authorizeTwitterUserRedirect(`/user/${address}`);
        } catch (error) {
            console.log(`[error-UserInfo-onConnectX]: ${error}`)
            toast.error(errorMessage(error));
        }
    }
    useEffect(() => {
        async function getBalance() {
            try {
                const amounts = await getMultipleFungibleAssetBalances(
                    address,
                    [chainToken.fa_addr]
                );
                setBalance(amounts[0] / Math.pow(10, chainToken.decimals))
            } catch (error) {
                setBalance(0)
                console.log(`[error-user-getBalance]: ${error}`)
            }
        }
        getBalance()
    }, [])
    useEffect(() => {
        async function getUser() {
            try {
                const data = (await Api.sendBackendRequest(`/api/auth/${address}/get`)).data as User;
                setUser(data)
            } catch (error) {
                console.log(`[error-user-getUser]: ${error}`)
            }
        }
        getUser()
    }, [])
    return (
        <div className='flex gap-4 items-center'>
            <div>
                <Image
                    src={user.x_display_picture ?? "/logo-icon.svg"}
                    alt={address}
                    width={46}
                    height={46}
                    className='h-11.5 w-11.5 object-cover rounded-full'
                />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <H3>
                        <Link target="_blank" href={getAccountOnExplorer(address)}>{user.x_username ? user.x_username : shortenAddress(address)}</Link>
                    </H3>
                    {user.x_username && <Link target="_blank" href={getAccountOnX(user.x_username)}><RiTwitterXLine className="h-4 w-4" /></Link>}
                    {user.x_verified && <MdOutlineVerified className="text-blue-500 h-4 w-4" />}
                </div>

                <div className='space-y-1'>
                    <div className='flex mt-1 items-center gap-1'>
                        <CiWallet className='size-5' />
                        <XSMedium>{balance}</XSMedium>
                        <Image src={chainToken.icon} alt={chainToken.symbol} height={16} width={16} className="border rounded-full" />
                    </div>
                </div>
            </div>
            {
                account && account.address.toString() === address && (
                    !user || !user.x_id && (
                        <Button
                            variant="outline"
                            onClick={() => onConnectX()}
                        >
                            Connect With <RiTwitterXFill />
                        </Button>
                    )
                )
            }
        </div>
    )
}