import { H1, PMedium } from "../ui/typography";

interface EmptyProps {
    title?: string;
    description?: string;
}
export default function Empty({ title, description }: EmptyProps) {
    return (
        <div className="flex items-center justify-center bg-card m-auto p-4 rounded-2xl w-full">
            <div className="not-found text-center">
                <H1>{title}</H1>
                <PMedium className="mt-4">{description}</PMedium>
                {/* <Image src='/empty-web.webp' alt="empty" height={160} width={150} className='mt-8 mx-auto' /> */}
            </div>
        </div>
    )
}