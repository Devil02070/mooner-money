import { deleteAuthToken } from "./cookieStore";
import { BACKEND_URL } from "./env";

type Headers = Record<string, string>;

export const dummyImage =
    "https://pbs.twimg.com/profile_images/1920309549870755840/69csM3EN_400x400.jpg";
export default class Api {
    static BACKEND_URL = BACKEND_URL ?? "http://localhost:8787";
    static DISCORD_API_URL = "https://discord.com/api";
    static TWITTER_API_URL = "https://api.x.com";

    // Body must be JSON.stringify'ed before sending data in request
    static async sendBackendRequest(
        apiUrl: string,
        method: string = "GET",
        body?: string | URLSearchParams,
        token?: string,
        extraHeaders?: Headers
    ) {
        const headers: Headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        if (extraHeaders) {
            Object.assign(headers, extraHeaders);
        }
        const res = await fetch(`${Api.BACKEND_URL}${apiUrl}`, {
            method,
            headers,
            body,
            priority: "high",

        });

        // In case it's not the json
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            if (data?.code === 401) {
                deleteAuthToken();
            }

            const error = new Error(
                data?.message ?? "An unknown error has occurred"
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).status = res.status; // 👈 add status
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).data = data; // 👈 add response data
            throw error;
        }

        return data;
    }

    // Body must be JSON.stringify'ed before sending data in request
    static async sendDiscordRequest(
        apiUrl: string,
        method: string = "GET",
        body?: string | URLSearchParams,
        token?: string,
        extraHeaders?: Headers
    ) {
        const headers: Headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        if (extraHeaders) {
            Object.assign(headers, extraHeaders);
        }
        const res = await fetch(`${Api.DISCORD_API_URL}${apiUrl}`, {
            method,
            headers,
            body,
            priority: "high",
        });
        if (!res.ok) {
            const error = await res.json();
            if (error?.code === 401) {
                // clear the access from cookies
            }
            throw new Error(error.message ?? "An unknown error has occured");
        }
        return await res.json();
    }

    // Body must be JSON.stringify'ed before sending data in request
    static async sendTwitterRequest(
        apiUrl: string,
        method: string = "GET",
        body?: string | URLSearchParams,
        token?: string,
        extraHeaders?: Headers
    ) {
        const headers: Headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        if (extraHeaders) {
            Object.assign(headers, extraHeaders);
        }
        const res = await fetch(`${Api.TWITTER_API_URL}${apiUrl}`, {
            method,
            headers,
            body,
            priority: "high",
        });
        if (!res.ok) {
            const error = await res.json();
            console.log(error);
            if (error?.status === 401) {
            }
            throw new Error(error.message ?? "An unknown error has occured");
        }
        return await res.json();
    }
}
