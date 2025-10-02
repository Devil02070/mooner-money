import type { Context } from "hono";
import prismadb from "../lib/prisma.js";
import { replacer } from "../utils/helper.js";

export default {
    async getPositions(c: Context) {
        try {
            const user = c.req.param("user");
            const stake_addr = c.req.param("stake_addr");
            const is_removed = c.req.query("is_removed") ? true : false;
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
            const sortBy = c.req.query('sort_by') ?? "txn_version";
            const sortOrder = c.req.query('sort_order') ?? "desc";
            const prismaOptions = {
                where: {
                    user,
                    is_removed,
                    stake_addr
                },
                skip: offset * limit,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder
                }
            }
            const data = await prismadb.stakings.findMany(prismaOptions);
            return c.json({ data: JSON.parse(JSON.stringify(data, replacer)) })
        } catch (error: any) {
            return c.json({ message: error.message })
        }
    },
    async getStats(c: Context) {
        try {
            const stakeAddr = c.req.param("stake_addr");
            // Active stakers + staked
            const active = await prismadb.$queryRawUnsafe<{
                total_stakers: bigint;
                total_staked: bigint;
            }[]>(`
            SELECT
                COUNT(DISTINCT user) AS total_stakers,
                COALESCE(SUM(amount), 0) AS total_staked
            FROM stakings
            WHERE stake_addr = '${stakeAddr}'
              AND is_removed = false
        `);

            // All-time fee claimed
            const fees = await prismadb.$queryRawUnsafe<{
                total_fee_claimed: bigint;
            }[]>(`
            SELECT
                COALESCE(SUM(claimed), 0) AS total_fee_claimed
            FROM stakings
            WHERE stake_addr = '${stakeAddr}'
        `);

            const stats = {
                totalStakers: Number(active[0].total_stakers),
                totalStaked: Number(active[0].total_staked),
                totalFeeClaimed: Number(fees[0].total_fee_claimed),
            };


            return c.json({data:stats});
        } catch (error: any) {
            return c.json({ message: error.message })
        }
    }
}