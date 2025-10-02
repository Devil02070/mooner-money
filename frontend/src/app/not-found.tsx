import { Button } from '@/components/ui/button'
import { H1 } from '@/components/ui/typography'
import Link from 'next/link'

export default function NotFound() {
    return (
        <>
            <div className="outer-layer min-h-[calc(100vh-108px)] flex items-center justify-center">
                <div className="not-found text-center">
                    <H1>404 page not found</H1>
                    {/* <Image src='/404-not-found.png' alt="404" height={225} width={269} className='mt-20' /> */}
                    <Button asChild className="btn-yellow rounded-pill mt-8">
                        <Link href="/">
                            Go Back Home
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    )
}
