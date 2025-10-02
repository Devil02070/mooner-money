import { cookies } from "next/headers"
import { Body } from "./Body";

type Params = {
    addr: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
    const cookieStore = await cookies();
    const tokenAddr = (await params).addr;
    const authToken = cookieStore.get("authToken")?.value;

    return (
        <Body tokenAddr={tokenAddr} authToken={authToken}/>
    )
}
