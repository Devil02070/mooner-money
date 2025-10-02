import { Metadata } from "next";
import { Body } from "./Body";
import { cookies } from "next/headers";
export const metadata: Metadata = {
    title: "Launch - Mooner Money",
    description: "Launch your own token in few seconds"
}
export default async function Page() {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("authToken")?.value;
    return <Body authToken={authToken}/>
}