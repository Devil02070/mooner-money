import type { Context } from "hono";
import prismadb from "../lib/prisma.js";
import { sign } from 'hono/jwt';
import { jwtSecret } from "../utils/env.js";
import { deserializeSignInOutput, verifySignInMessage, verifySignInSignature, type AptosSignInInput } from "@aptos-labs/siwa";
import type { TwitterUser } from "../utils/twitter.js";
export default {
    async connect(c: Context) {
        try {
            const { output, input } = await c.req.json();
            const deserializedOutput = deserializeSignInOutput(output);
            const signatureVerification = await verifySignInSignature(deserializedOutput);
            if (!signatureVerification.valid) {
                throw new Error(signatureVerification.errors[0]);
            };

            if (!input) {
                throw new Error("input_not_found")
            };
            const messageVerification = await verifySignInMessage({
                input: deserializedOutput.input,
                expected: input as AptosSignInInput,
                publicKey: deserializedOutput.publicKey,
            });
            if (!messageVerification.valid) {
                throw new Error("Failed to verify message")
            };

            let account = await prismadb.accounts.findFirst({
                where: {
                    address: deserializedOutput.input.address.toString()
                }
            });

            if (!account) {
                account = await prismadb.accounts.create({
                    data: {
                        address: deserializedOutput.input.address.toString(),
                    }
                })
            };
            const token = await sign({ address: account.address }, jwtSecret);
            return c.json({ data: token })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },
    async twitterAuth(c: Context) {
        try {
            const { address } = c.get("jwtPayload");
            if (!address) throw new Error("You are not authorized to perform this action");
            const twitterUser = c.get("twitterUser") as TwitterUser;
            if (!twitterUser) throw new Error("Unable to get twitter user");
            const exists = await prismadb.accounts.findFirst({
                where: {
                    x_id: twitterUser.id
                }
            });
            if(exists) throw new Error("Account already connected with another address")
            const account = await prismadb.accounts.findUnique({
                where: { address }
            });
            if (!account) throw new Error("Account not found by address");
            await prismadb.accounts.update({
                where: { address },
                data: {
                    x_username: twitterUser.username,
                    x_id: twitterUser.id,
                    x_display_picture: twitterUser.profile_image_url,
                    x_description: twitterUser.description,
                    x_name: twitterUser.name,
                    x_verified: twitterUser.verified
                }
            });
            return c.json({ message: "Twitter account connected successfully" })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async disconnectTwitter(c: Context) {
        try {
            const { address } = c.get("jwtPayload");
            if (!address) throw new Error("You are not authorized to perform this action");
            const account = await prismadb.accounts.findUnique({
                where: { address }
            });
            if (!account) throw new Error("Account not found by address");
            await prismadb.accounts.update({
                where: { address },
                data: {
                    x_username: null,
                    x_id: null,
                    x_display_picture: null,
                    x_description: null,
                    x_verified: false,
                    x_name: null
                }
            });
            return c.json({ message: "Twitter account disconnected successfully" })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async getAccount(c: Context) {
        try {
            const address = c.req.param("address");
            const account = await prismadb.accounts.findUnique({
                where: { address }
            })
            if (!account) throw new Error("Account not found by address")
            const higherRankedCount = await prismadb.accounts.count({
                where: {
                    xp_earned: {
                        gt: account.xp_earned, 
                    },
                },
            });

            const rank = higherRankedCount + 1;
            return c.json({ data: { ...account, rank } })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async spin(c: Context) {
        try {
            const { address } = c.get("jwtPayload");
            const account = await prismadb.accounts.findUnique({
                where: { address }
            })
            if (!account) throw new Error("Account not found by address")
            if (account.xp <= 0) throw new Error("You have 0 spins");
            await prismadb.accounts.update({
                data: {
                    xp: account.xp - 1
                },
                where: {
                    address
                }
            })
            return c.json({ data: "Spinning..." })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async getXpLeaderboard(c: Context) {
        try {
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
            const data = await prismadb.accounts.findMany({
                orderBy: {
                    xp_earned: "desc",
                },
                skip: offset * limit,
                take: limit,
                select: {
                    address: true,
                    x_username: true,
                    x_display_picture: true,
                    xp_earned: true,
                }
            })

            return c.json({ data })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    }
}