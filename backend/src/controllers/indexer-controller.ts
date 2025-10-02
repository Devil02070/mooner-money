import type { Context } from "hono";
import prismadb from "../lib/prisma.js";
import { sendMessageIO } from "../socket-io.js";
import { getPriceBySymbol } from "../utils/scheduler.js";
import { replacer } from "../utils/helper.js";

function safeData(obj: any) {
    return JSON.parse(JSON.stringify(obj, replacer));
}

const REWARD_CHANCE = 0.2; // 20% of trades get XP
const MIN_XP = 1;
const MAX_XP = 5;
const MIN_APTOS = 2500000000;
// Events to emit from Indexer processor 
export default {
    async tokenCreated(c: Context) {
        try {
            const token_address = c.req.param('addr');
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
            const data: any[] = await prismadb.$queryRawUnsafe(query, token_address);
            if (data.length === 0) {
                throw new Error("Token not found by address")
            };
            sendMessageIO(`token-created`, safeData(data[0]));
            sendMessageIO(`token-${token_address}`, safeData(data[0]));
            return c.json({ message: "Token created event emitted successfully" });
        } catch (error: any) {
            // returning status 200 as this should not affect indexer
            console.log(`Fatal error in indexer emit: ${error}`)
            return c.json({ message: error.message }, 500)
        }
    },
    async tokenTraded(c: Context) {
        try {
            const txnVersion = c.req.param('version');
            const trade = await prismadb.trades.findUnique({
                where: {
                    txn_version: parseFloat(txnVersion)
                },
                select: {
                    aptos_amount: true,
                    is_buy: true,
                    token_address: true,
                    user_addr: true,
                    virtual_aptos_reserves: true,
                    virtual_token_reserves: true,
                    txn_version: true,
                    token_amount: true,
                    ts: true,
                    token: {
                        select: {
                            symbol: true,
                            image: true,
                            decimals: true
                        },
                    },
                },
            });
            if (!trade) throw new Error("Trade not found by version");
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
            const data: any[] = await prismadb.$queryRawUnsafe(query, trade.token_address);
            if (data.length === 0) {
                throw new Error("Token not found by address")
            };
            sendMessageIO(`token-traded`, safeData(data[0]));
           
            // send notification to recents
            const recentTrade = {
                aptos_amount: trade.aptos_amount,
                is_buy: trade.is_buy,
                token_address: trade.token_address,
                virtual_aptos_reserves: trade.virtual_aptos_reserves,
                virtual_token_reserves: trade.virtual_token_reserves,
                txn_version: trade.txn_version,
                token: trade.token
            };
            sendMessageIO(`recent-trade`, safeData(recentTrade));
            sendMessageIO(`trade-${trade.token_address}`, safeData({
                aptos_amount: trade.aptos_amount,
                is_buy: trade.is_buy,
                token_address: trade.token_address,
                user_addr: trade.user_addr,
                virtual_aptos_reserves: trade.virtual_aptos_reserves,
                virtual_token_reserves: trade.virtual_token_reserves,
                txn_version: trade.txn_version,
                token_amount: trade.token_amount,
                ts: trade.ts,
            }));
            if (Math.random() < REWARD_CHANCE && Number(trade.aptos_amount) >= MIN_APTOS) {
                const xpReward = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;

                await prismadb.accounts.updateMany({
                    where: {
                        address: trade.user_addr
                    },
                    data: {
                        xp: {
                            increment: xpReward
                        },
                        xp_earned: {
                            increment: xpReward
                        }
                    }
                });

                sendMessageIO(`xp-${trade.token_address}-${trade.user_addr}`, xpReward);
            }
            sendMessageIO(`token-${trade.token_address}`, safeData(data[0]));
            const token = data[0];
            if(token.bonding_curve >= 50 && token.bonding_curve < 100) {
                sendMessageIO(`token-near`, safeData(data[0]))
            } else if(token.bonding_curve === 100) {
                sendMessageIO(`token-graduated`, safeData(data[0]))
            };
            return c.json({ message: "Token traded event emitted successfully" });
        } catch (error: any) {
            // returning status 200 as this should not affect indexer
            console.log(`Fatal error in indexer emit: ${error}`)
            return c.json({ message: error.message }, 500)
        }
    },

    async getPrice(c: Context) {
        try {
            const symbol = c.req.param("symbol");
            const price = getPriceBySymbol(symbol);
            if (!price) {
                throw new Error("Price not found by symbol")
            };
            return c.json({ data: price.price });
        } catch (error: any) {
            return c.json({ message: error.message }, 500)
        }
    },

    async spinEvent(c: Context) {
        try {
            const request = await c.req.json();
            sendMessageIO("spin-win", { claimer: request.claimer, amount: Number(request.amount), win_type: Number(request.win_type) });
            return c.json({ message: "Spin event emitted successfully" });
        } catch (error: any) {
            return c.json({ message: error.message }, 500)
        }
    },
}