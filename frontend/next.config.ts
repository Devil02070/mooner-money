import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        NETWORK: process.env.NETWORK,
        GAME_OWNER: process.env.GAME_OWNER,
        CA: process.env.CA,
        BACKEND_URL: process.env.BACKEND_URL,
        CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL,
        CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        CLOUDFLARE_R2_SECRET_ACCESS_KEY:
            process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        X_CLIENT_ID: process.env.X_CLIENT_ID,
        X_CLIENT_SECRET: process.env.X_CLIENT_SECRET,
        X_REDIRECT_URI: process.env.X_REDIRECT_URI,
        THALA: process.env.THALA
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            }
        ],
        unoptimized: true
    },
    /* other config options here */
};

export default nextConfig;
