import type { Context } from "hono";
import prismadb from "../lib/prisma.js"
import { replacer } from "../utils/helper.js";
export default {
    async getTokens(c: Context) {
        try {
            const search = c.req.query('search');
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
            const sortBy = c.req.query('sort_by') ?? "";
            const sortOrder = c.req.query('sort_order')?.toUpperCase() === "ASC" ? "ASC" : "DESC";
            let where = "";
            let orderBy = "";
            if (sortBy === "bump") {
                orderBy = `
                    ORDER BY COALESCE(
                        (t.last_trade->>'ts')::bigint,
                        t.ts
                    ) ${sortOrder}
                `;
            } else if (sortBy === "near") {
                where = `
                    WHERE t.bonding_curve >= 50 AND t.bonding_curve < 100
                `;
                orderBy = `
                    ORDER BY
                        t.bonding_curve ${sortOrder} 
                `;
            } else if (sortBy === "graduated") {
                where = `WHERE t.is_completed = true`;
                orderBy = `ORDER BY t.ts ${sortOrder}`;
            };
            if (search) {
                const searchCondition = `(
                    t.name ILIKE '%${search}%' OR
                    t.symbol ILIKE '%${search}%' OR
                    t.pre_addr ILIKE '%${search}%' OR
                    t.main_addr ILIKE '%${search}%'
                )`;
                if(where.trim() === "") {
                    where = `WHERE ${searchCondition}`;
                } else {
                    where += `AND ${searchCondition}`;
                }
            }
            const query = `
            SELECT * 
                FROM(
                    SELECT
                        tokens.*,
                        stats.buy_count,
                        stats.sell_count,
                        stats.last_trade,
                        stats.dev_holding,
                        stats.holders_count,
                        stats.top_ten_holdings,
                        stats.volume,
                        stats.bonding_curve,
                        stats.creator
                    FROM tokens
                    LEFT JOIN LATERAL (
                        WITH balances AS (
                            SELECT 
                                t.user_addr,
                                SUM(CASE WHEN t.is_buy = true THEN t.token_amount ELSE - t.token_amount END) AS balance
                            FROM trades t
                            WHERE t.token_address = tokens.pre_addr
                            GROUP BY t.user_addr
                        )
                        SELECT 
                            -- buy/sell count --
                            COUNT(*) FILTER (WHERE t.is_buy = true) AS buy_count,
                            COUNT(*) FILTER (WHERE t.is_buy = false) AS sell_count,
                            -- last trade --
                            (
                                SELECT row_to_json(trade)
                                FROM trades trade
                                WHERE trade.token_address = tokens.pre_addr
                                ORDER BY trade.ts DESC
                                LIMIT 1
                            ) AS last_trade,
                            -- dev holding % --
                            COALESCE((
                                SELECT b.balance
                                FROM balances b
                                WHERE b.user_addr = tokens.created_by
                            ), 0) / NULLIF(tokens.virtual_token_reserves::float - tokens.remain_token_reserves::float, 0) * 100 AS dev_holding,
                            -- holders count --
                            (SELECT COUNT(*) FROM balances b WHERE b.balance > 0) AS holders_count,
                            -- top 10 holders --
                            (
                                SELECT COALESCE(SUM(balance), 0) / NULLIF(tokens.virtual_token_reserves::float - tokens.remain_token_reserves::float, 0) * 100
                                FROM (
                                    SELECT balance
                                    FROM balances
                                    WHERE balance > 0
                                    ORDER BY balance DESC
                                    LIMIT 10
                                ) ranked
                            ) AS top_ten_holdings,
                            -- volume -- 
                            COALESCE(SUM(t.aptos_amount), 0) AS volume,
                            -- bonding curve % --
                            COALESCE(
                                (
                                    (
                                        tokens.virtual_token_reserves::float - 
                                        COALESCE(
                                            (
                                                SELECT trade.virtual_token_reserves
                                                FROM trades trade
                                                WHERE trade.token_address = tokens.pre_addr
                                                ORDER BY trade.ts DESC
                                                LIMIT 1
                                            ), 
                                            tokens.virtual_token_reserves::float
                                        )
                                    ) 
                                    /
                                    (tokens.virtual_token_reserves::float - tokens.remain_token_reserves::float)
                                ) * 100
                            ) AS bonding_curve,
                            -- creator from accounts -- 
                            (
                                SELECT row_to_json(creator)
                                FROM accounts creator
                                WHERE creator.address = tokens.created_by
                                LIMIT 1
                            ) AS creator
                        FROM trades t
                        WHERE t.token_address = tokens.pre_addr
                    ) AS stats ON TRUE
                ) AS t
                ${where}
                ${orderBy}
                OFFSET $1 LIMIT $2
            `;
            const data = await prismadb.$queryRawUnsafe(query, offset * limit, limit);
            const count = await prismadb.tokens.count();
            const pagination = {
                total: Math.ceil(count / limit),
                count,
                offset,
                limit
            };
            return c.json({ data: JSON.parse(JSON.stringify(data, replacer)), pagination });
        } catch (error: any) {
            console.log(error)
            return c.json({ message: error.message }, 500);
        }
    },
     async getTokenByAddr(c: Context) {
        try {
            const addr = c.req.param('addr');
            const query = `
                SELECT * 
                FROM(
                    SELECT
                        tokens.*,
                        stats.buy_count,
                        stats.sell_count,
                        stats.last_trade,
                        stats.dev_holding,
                        stats.holders_count,
                        stats.top_ten_holdings,
                        stats.volume,
                        stats.bonding_curve,
                        stats.creator
                    FROM tokens
                    LEFT JOIN LATERAL (
                        WITH balances AS (
                            SELECT 
                                t.user_addr,
                                SUM(CASE WHEN t.is_buy = true THEN t.token_amount ELSE - t.token_amount END) AS balance
                            FROM trades t
                            WHERE t.token_address = tokens.pre_addr
                            GROUP BY t.user_addr
                        )
                        SELECT 
                            -- buy/sell count --
                            COUNT(*) FILTER (WHERE t.is_buy = true) AS buy_count,
                            COUNT(*) FILTER (WHERE t.is_buy = false) AS sell_count,
                            -- last trade --
                            (
                                SELECT row_to_json(trade)
                                FROM trades trade
                                WHERE trade.token_address = tokens.pre_addr
                                ORDER BY trade.ts DESC
                                LIMIT 1
                            ) AS last_trade,
                            -- dev holding % --
                            COALESCE((
                                SELECT b.balance
                                FROM balances b
                                WHERE b.user_addr = tokens.created_by
                            ), 0) / NULLIF(tokens.virtual_token_reserves::float - tokens.remain_token_reserves::float, 0) * 100 AS dev_holding,
                            -- holders count --
                            (SELECT COUNT(*) FROM balances b WHERE b.balance > 0) AS holders_count,
                            -- top 10 holders --
                            (
                                SELECT COALESCE(SUM(balance), 0) / NULLIF(tokens.virtual_token_reserves::float - tokens.remain_token_reserves::float, 0) * 100
                                FROM (
                                    SELECT balance
                                    FROM balances
                                    WHERE balance > 0
                                    ORDER BY balance DESC
                                    LIMIT 10
                                ) ranked
                            ) AS top_ten_holdings,
                            -- volume -- 
                            COALESCE(SUM(t.aptos_amount), 0) AS volume,
                            -- bonding curve % --
                            COALESCE(
                                (
                                    (
                                        tokens.virtual_token_reserves::float - 
                                        COALESCE(
                                            (
                                                SELECT trade.virtual_token_reserves
                                                FROM trades trade
                                                WHERE trade.token_address = tokens.pre_addr
                                                ORDER BY trade.ts DESC
                                                LIMIT 1
                                            ), 
                                            tokens.virtual_token_reserves::float
                                        )
                                    ) 
                                    /
                                    (tokens.virtual_token_reserves::float - tokens.remain_token_reserves::float)
                                ) * 100
                            ) AS bonding_curve,
                            -- creator from accounts -- 
                            (
                                SELECT row_to_json(creator)
                                FROM accounts creator
                                WHERE creator.address = tokens.created_by
                                LIMIT 1
                            ) AS creator
                        FROM trades t
                        WHERE t.token_address = tokens.pre_addr
                    ) AS stats ON TRUE
                ) AS t
                WHERE t.pre_addr = $1
                LIMIT 1
            `;
            const data: any[] = await prismadb.$queryRawUnsafe(query, addr);
            if (!data[0]) throw new Error("Token not found by address")
            return c.json({ data: JSON.parse(JSON.stringify(data[0], replacer)) });
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },
}