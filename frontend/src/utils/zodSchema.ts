import { z } from "zod"

const createTokenSchema = z.object({
    name: z.string().min(1, "Token name is required"),
    symbol: z.string().min(1, "Symbol is required"),
    description: z.string().min(1, "Description is required").max(250, "Max 250 characters allowed"),
    image: z.boolean().refine(v => v === true, { message: "Image is required" }),
    website: z.url().optional().nullable(),
    twitter: z.url().optional().nullable(),
    telegram: z.url().optional().nullable(),
    initial_amt: z.string().optional().nullable()
})
export {
    createTokenSchema
}