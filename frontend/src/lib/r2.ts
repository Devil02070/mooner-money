import { S3Client } from "@aws-sdk/client-s3";
import {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY,
} from "./env";

const accessKeyId = CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = CLOUDFLARE_R2_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
    throw new Error(
        "CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY must be defined"
    );
}

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export default r2Client;
