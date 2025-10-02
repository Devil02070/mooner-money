import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_PUBLIC_URL, CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_SECRET_ACCESS_KEY } from "../lib/env";

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY
    }
})

type FileInput = {
    tokenAddress: string;
    name: string;
    size: number;
    type: string;
}

export const handleDropFile = async (input: FileInput, blob: Blob) => {
    const fileName = input.name;
    const size = input.size;
    const sizeLimit = 5 * 1024 ** 2; // 5MB

    const fileType = input.type;
    const validFormats = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!validFormats.includes(fileType)) {
        throw new Error("Only PNG, JPEG, GIF, WEBP files are supported.");
    }

    if (size > sizeLimit) {
        throw new Error("File size is too large");
    };
    const safeFileName = fileName.toLowerCase().replace(/\s+/g, '');

    const objectKey = `${input.tokenAddress}/${safeFileName}`;
    const cmd = new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: objectKey,
        ContentLength: size,
        ContentType: fileType,
    });

    const imageUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${objectKey}`
    const presignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    await fetch(presignedUrl, {
        method: "PUT",
        headers: {
            "Content-Type": fileType,
            "Content-Length": size.toString()
        },
        body: blob, // this must be the actual File or Blob object
    });
    return { presignedUrl, imageUrl }
}