import { redirect } from "next/navigation";
import { Body } from "./Body";
import { cookies } from "next/headers";
import { X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI } from "@/lib/env";

type SearchParams = {
    code?: string;
    state?: string;
};

export interface OAuthTokenResponse {
    token_type: "bearer";
    expires_in: number;
    access_token: string;
    refresh_token: string;
    scope: string;
}

export default async function OAuthTwitter({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const cookieStore = await cookies();
    const params = await searchParams;
    const { code, state } = params;
    const authToken = cookieStore.get("authToken")?.value;
    const code_verifier = cookieStore.get("code_verifier")?.value;
    // send user to where it came from
    let redirectPath = "/";
    if(state) {
        redirectPath = state;
    };

    if (!code || !code_verifier) redirect(redirectPath);

    const basicAuthToken = Buffer.from(
        `${X_CLIENT_ID}:${X_CLIENT_SECRET}`,
        "utf8"
    ).toString("base64");

    const options = new URLSearchParams({
        client_id: X_CLIENT_ID,
        redirect_uri: X_REDIRECT_URI,
        grant_type: "authorization_code",
        code_verifier,
        code,
    });

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuthToken}`,
        },
        body: options,
    });

    if (!response.ok) {
        console.error("Twitter OAuth failed:", await response.text());
        redirect(redirectPath); // Redirect to home on failure
    }

    const tokenResponse: OAuthTokenResponse = await response.json();

    return <Body tokenResponse={tokenResponse} authToken={authToken} redirectPath={redirectPath} />;
}
