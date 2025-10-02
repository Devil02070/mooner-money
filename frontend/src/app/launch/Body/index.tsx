"use client"

import { H1, PMedium } from '@/components/ui/typography'
import React from 'react'
import { Button } from '@/components/ui/button'
import { RiTwitterXFill } from 'react-icons/ri'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { authorizeTwitterUserRedirect } from '@/lib/twitter';
import { useApp } from '@/providers/AppProvider';
import { WalletButton } from '@/components/WalletButton'
import { Launch } from './Launch'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { errorMessage } from '@/utils/errorMessage'
import Image from 'next/image'
interface BodyProps {
    authToken?: string;
}
export const Body = ({ authToken }: BodyProps) => {
    const { user, onSignIn, isSigningIn, fetchingUser, config } = useApp();
    const { connected } = useWallet();

    if (!connected) {
        return (
            <div className='max-w-lg w-full mt-[10%] mx-auto'>
                <div className="flex items-center justify-center bg-card w-fit p-4 rounded-2xl">
                    <div className="not-found text-center">
                        <H1>Connect Your Wallet to Continue</H1>
                        <PMedium className="mt-4">To create your token, you need to connect your wallet first. This ensures your ownership and allows us to link the token to your account.</PMedium>
                        <Image src='/empty.png' alt="404" height={160} width={150} className='mt-8 mx-auto' />
                        <Button asChild className="btn-yellow rounded-pill mt-8">
                            <WalletButton />
                        </Button>
                    </div>
                </div>
            </div>

        )
    }

    if (!user) {
        return (
            <div className='max-w-md w-full rounded-xl p-4 bg-card flex flex-col items-center space-y-6 mt-[10%] mx-auto'>
                <H1 className='text-[1.8rem] sm:text-2xl text-center'>
                    Sign In
                </H1>
                <PMedium className='text-center'>
                    Please sign in to continue. SigningIn verifies your identity and
                    allows us to securely link your account for creating and managing tokens.
                </PMedium>

                <Button disabled={isSigningIn || fetchingUser} onClick={() => onSignIn()}>
                    {fetchingUser ? "Please wait" : isSigningIn ? "Signing In..." : "Sign In"}
                </Button>
            </div>
        );
    }


    if (!user.x_id) {
        return (
            <ConnectTwitter authToken={authToken} />
        )
    }

    if (!config) {
        return (
            "Please wait!! Blockchain data is still loading..."
        )
    }

    // Show Create Token form when ready
    return (
        <div className='p-4 sm:p-8 space-y-6 mx-auto'>
            <div className='flex gap-4 items-center'>
                <H1>Create token</H1>
            </div>
            <Launch config={config} />
        </div>
    )
}

function ConnectTwitter({ authToken }: { authToken?: string }) {
    const pathname = usePathname();
    const { onSignIn } = useApp()
    const onConnect = async () => {
        try {
            if (!authToken) {
                const token = await onSignIn();
                if (!token) return
            };
            await authorizeTwitterUserRedirect(pathname)
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }
    return (
        <div className='max-w-md w-full  mb-20 md:mb-0 rounded-xl p-4 bg-card flex flex-col items-center space-y-6 mt-[10%] mx-auto '>
            <H1 className=' text-[1.8rem] sm:text-2xl'>
                Connect Twitter to Create Your Token
            </H1>
            <PMedium className=''>
                You must connect your Twitter account before creating a token. This verifies your identity and links your token to your profile.
            </PMedium>
            <PMedium className=''>
                Mooner money tokens are powered by social identity. Connecting Twitter ensures your token is tied to you, your brand, and your community.
            </PMedium>
            <Button
                variant="outline"
                onClick={() => onConnect()}
                className='w-fit'
            >
                Connect With <RiTwitterXFill className='text-xl' />
            </Button>
        </div>
    )
}
