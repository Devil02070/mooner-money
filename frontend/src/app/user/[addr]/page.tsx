import React from 'react'
import { H1 } from '@/components/ui/typography'
import { UserInfo } from './UserInfo'
import { UserPNL } from './UserPNL'
import { cookies } from 'next/headers'
type Params = {
    addr: string;
}
export default async function Page({ params }: { params: Promise<Params> }) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("authToken")?.value;
    const address = (await params).addr;
    return (
        <section className='p-4 md:p-8  mb-20 md:mb-0 space-y-16'>
            <div className='space-y-8'>
                <H1>Dashboard</H1>
                <UserInfo address={address} authToken={authToken} />
            </div>
            <div className='space-y-8'>
                <UserPNL address={address} />
            </div>
        </section>
    )
}
