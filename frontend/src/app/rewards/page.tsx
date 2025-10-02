import { cookies } from "next/headers"
import { Body } from "./Body"
export default async function Page() {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("authToken")?.value;
    return (
        <Body authToken={authToken}/>
    )
}
