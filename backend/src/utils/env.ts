import "dotenv/config.js";
export const jwtSecret = process.env.JWT_SECRET as string;
export const port = parseInt(process.env.PORT ?? "8787");
export const indexerAccessToken = process.env.INDEXER_ACCESS_TOKEN as string;
export const adminAccessToken = process.env.ADMIN_ACCESS_TOKEN as string;