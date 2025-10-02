"use client";

import { useEffect, useState, useRef } from "react";
import { OAuthTokenResponse } from "../page";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/env";

type BodyParams = {
    tokenResponse: OAuthTokenResponse;
    authToken?: string;
    redirectPath: string;
};

type Status = "loading" | "redirecting" | "error";

export function Body({ tokenResponse, authToken, redirectPath }: BodyParams) {
    const router = useRouter();
    const [status, setStatus] = useState<Status>("loading");
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const authenticateUser = async () => {
            try {
                setStatus("loading");

                const response = await fetch(
                    `${BACKEND_URL}/api/auth/connect-twitter`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: authToken ? `Bearer ${authToken}` : "",
                            "X-Access": tokenResponse.access_token,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Backend auth failed");
                }

                setStatus("redirecting");
                setTimeout(() => {
                    router.push(redirectPath);
                }, 1000);
            } catch (error) {
                console.error("OAuth authentication failed:", error);
                setStatus("error");
                setTimeout(() => router.push(redirectPath), 1000);
            }
        };

        authenticateUser();
    }, [authToken, router, tokenResponse.access_token]);

    const getMessage = () => {
        switch (status) {
            case "loading":
                return "Please wait while we verify your account...";
            case "redirecting":
                return "Authentication successful! Redirecting...";
            case "error":
                return "Authentication failed. Redirecting...";
            default:
                return "Processing...";
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="mb-4">
                    {status === "loading" && (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    )}
                    {status === "redirecting" && (
                        <div className="text-success text-2xl">✓</div>
                    )}
                    {status === "error" && (
                        <div className="text-danger text-2xl">✗</div>
                    )}
                </div>
                <p className="text-gray-600">{getMessage()}</p>
            </div>
        </div>
    );
}
