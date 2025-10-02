"use server";

import { cookies } from "next/headers";

export async function storeAuthToken(token: string) {
    (await cookies()).set("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
    });
}
export async function deleteAuthToken() {
    (await cookies()).delete("authToken");
}



export async function storeCodeChallengeAndVerifier(
    codeChallenge: string,
    codeVerifier: string
) {
    console.log("cookie saved stored");
    const cookieStore = await cookies();
    cookieStore.set(`code_challenge`, codeChallenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
    });

    cookieStore.set(`code_verifier`, codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
    });
}

export async function storeTwitterAccessToken(accessToken: string) {
    const cookieStore = await cookies();
    cookieStore.set(`twitterAccessToken`, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
    });
}