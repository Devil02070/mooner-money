import type { Context } from "hono";
import prismadb from "../lib/prisma.js"
import { replacer } from "../utils/helper.js";
import { Decimal } from "decimal.js";

export default {
    async getTrades(c: Context) {
        try {
            const addr = c.req.param('addr');
            const user_addr = c.req.query("user_addr");
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
            const sortBy = c.req.query('sort_by') ?? "ts";
            const sortOrder = c.req.query('sort_order') ?? "desc";
            const whereClauses: string[] = [`t.token_address = $1`];
            const params: any[] = [addr];
            if (user_addr) {
                whereClauses.push(`t.user_addr = $${params.length + 1}`);
                params.push(user_addr);
            }

            // Count query
            const countResult = await prismadb.$queryRawUnsafe<{ count: bigint }[]>(
                `SELECT COUNT(*)::bigint as count
             FROM trades t
             WHERE ${whereClauses.join(" AND ")}
            `,
                ...params
            );
            const count = Number(countResult[0].count);

            const data = await prismadb.$queryRawUnsafe<any[]>(
                `
                    SELECT 
                        t.*,
                        (
                        SELECT row_to_json(a)
                        FROM (
                            SELECT "address","x_id","x_username","x_display_picture","x_name","x_verified","x_description","xp"
                            FROM "accounts" a
                            WHERE a."address" = t."user_addr"
                            LIMIT 1
                        ) a
                        ) AS "user"
                    FROM trades t
                    WHERE ${whereClauses.join(" AND ")}
                    ORDER BY t.${sortBy} ${sortOrder}
                    OFFSET $${params.length + 1}
                    LIMIT $${params.length + 2}
                    `,
                ...params,
                offset * limit,
                limit
            );

            return c.json({
                data: JSON.parse(JSON.stringify(data, replacer)),
                pagination: {
                    total: Math.ceil(count / Number(limit)),
                    offset,
                    count,
                    limit
                }
            });
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },
    async getRecentTrades(c: Context) {
        try {
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
            const sortBy = c.req.query('sort_by') ?? "ts";
            const sortOrder = c.req.query('sort_order') ?? "desc";
            const prismaOptions: any = {
                orderBy: {
                    [sortBy]: sortOrder
                },
                select: {
                    aptos_amount: true,
                    is_buy: true,
                    token_address: true,
                    virtual_aptos_reserves: true,
                    virtual_token_reserves: true,
                    txn_version: true,
                    token: {
                        select: {
                            symbol: true,
                            image: true,
                            decimals: true
                        },
                    },
                },
            };
            const data = await prismadb.trades.findMany({ ...prismaOptions, skip: offset * limit, take: limit });
            return c.json({ data: JSON.parse(JSON.stringify(data, replacer)) });
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async getHolders(c: Context) {
        try {
            const token_address = c.req.param("addr");
            const token = await prismadb.tokens.findUnique({
                where: { pre_addr: token_address }
            })
            if (!token) throw new Error("Token not found by address");
            const circulatingSupply = Number(token.virtual_token_reserves) - Number(token.remain_token_reserves);
            const holders = await prismadb.$queryRawUnsafe<any[]>(`
                SELECT 
                    t.user_addr,
                    COALESCE(SUM(CASE WHEN t.is_buy THEN t.token_amount ELSE -t.token_amount END), 0) AS balance,
                    row_to_json(a) AS "user"
                FROM trades t
                LEFT JOIN accounts a
                    ON a.address = t.user_addr
                WHERE t.token_address = $1
                GROUP BY t.user_addr, a.*
                HAVING COALESCE(SUM(CASE WHEN t.is_buy THEN t.token_amount ELSE -t.token_amount END), 0) > 0
                ORDER BY balance DESC
            `, token_address);

            // Format result with percentage
            const data = holders.map(h => {
                const total_token_amount = Number(h.balance);
                const percentage = new Decimal(total_token_amount)
                    .div(circulatingSupply)
                    .mul(100)
                    .toNumber();

                return {
                    user_addr: h.user_addr,
                    user: h.user, // attached user object
                    total_token_amount,
                    percentage,
                };
            });

            return c.json({ data });
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async getChart(c: Context) {
        try {
            const token_address = c.req.param("addr");
            const interval = c.req.query("interval")
                ? Number(c.req.query("interval"))
                : 900; // default 15 mins
            const from = c.req.query("from")
                ? Number(c.req.query("from"))
                : 0;
            const to = c.req.query("to")
                ? Number(c.req.query("to"))
                : Math.floor(Date.now() / 1000);
            const user = c.req.query("user");

            // fetch token
            const token = await prismadb.tokens.findUnique({
                where: { pre_addr: token_address },
            });
            if (!token) throw new Error("Token not found by address");

            const initialPrice = Number(token.virtual_aptos_reserves) / Number(token.virtual_token_reserves);

            const query = `
                WITH trades_bucketed AS (
                    SELECT
                        FLOOR(t.ts / ${interval}) * ${interval} AS bucket,
                        (t.virtual_aptos_reserves / NULLIF(t.virtual_token_reserves, 0))::numeric AS price,
                        t.ts,
                        t.is_buy,
                        t.user_addr,
                        t.token_amount
                    FROM trades t
                    WHERE t.token_address = '${token_address}'
                    AND t.ts BETWEEN ${from} AND ${to}
                    AND t.virtual_token_reserves > 0
                ),
                bucket_prices AS (
                    SELECT 
                        bucket,
                        price,
                        ts,
                        ROW_NUMBER() OVER (PARTITION BY bucket ORDER BY ts) AS rn,
                        FIRST_VALUE(price) OVER (PARTITION BY bucket ORDER BY ts) AS first_price,
                        LAST_VALUE(price) OVER (PARTITION BY bucket ORDER BY ts ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_price
                    FROM trades_bucketed
                ),
                ohlc_raw AS (
                    SELECT
                        bucket,
                        MAX(first_price) AS raw_open,
                        MAX(price) AS high,
                        MIN(price) AS low,
                        MAX(last_price) AS raw_close
                    FROM bucket_prices
                    GROUP BY bucket
                ),
                -- Ensure first open = initial reserves, next opens = prev close
                ohlc AS (
                    SELECT
                        bucket,
                        CASE 
                            WHEN bucket = (SELECT MIN(bucket) FROM ohlc_raw) 
                                THEN COALESCE(
                                    (${token.virtual_aptos_reserves}::numeric / NULLIF(${token.virtual_token_reserves},0)),
                                    raw_open  -- fallback to first trade price if initial reserves are bad
                                )
                            ELSE LAG(raw_close) OVER (ORDER BY bucket)
                        END AS open,
                        high,
                        low,
                        raw_close AS close
                    FROM ohlc_raw
                ),
                volumes AS (
                    SELECT
                        bucket,
                        COALESCE(SUM(token_amount) FILTER (WHERE is_buy = true  AND user_addr = '${token.created_by}'), 0) AS dev_buy,
                        COALESCE(SUM(token_amount) FILTER (WHERE is_buy = false AND user_addr = '${token.created_by}'), 0) AS dev_sell
                        ${user ? `,
                        COALESCE(SUM(token_amount) FILTER (WHERE is_buy = true  AND user_addr = '${user}'), 0) AS user_buy,
                        COALESCE(SUM(token_amount) FILTER (WHERE is_buy = false AND user_addr = '${user}'), 0) AS user_sell
                        ` : ""}
                    FROM trades_bucketed
                    GROUP BY bucket
                )
                SELECT
                    o.bucket,
                    o.open,
                    o.high,
                    o.low,
                    o.close,
                    v.dev_buy,
                    v.dev_sell
                    ${user ? ", v.user_buy, v.user_sell" : ""}
                FROM ohlc o
                LEFT JOIN volumes v ON o.bucket = v.bucket
                ORDER BY o.bucket ASC;
                `;

            const res: any[] = await prismadb.$queryRawUnsafe(query);
            const data = res.map((r) => {
                const base: any = {
                    time: Number(r.bucket),
                    open: Number(r.open),
                    high: Number(r.high),
                    low: Number(r.low),
                    close: Number(r.close),
                };

                // attach dev object if > 0
                if (Number(r.dev_buy) > 0 || Number(r.dev_sell) > 0) {
                    base.dev = {};
                    if (Number(r.dev_buy) > 0) base.dev.buy = Number(r.dev_buy);
                    if (Number(r.dev_sell) > 0) base.dev.sell = Number(r.dev_sell);
                }

                // attach user object if > 0
                if (user && (Number(r.user_buy) > 0 || Number(r.user_sell) > 0)) {
                    base.user = {};
                    if (Number(r.user_buy) > 0) base.user.buy = Number(r.user_buy);
                    if (Number(r.user_sell) > 0) base.user.sell = Number(r.user_sell);
                }

                return base;
            });

            return c.json({ data });
        } catch (error: any) {
            console.log(error)
            return c.json({ message: error.message }, 500);
        }
    },
    async getTokenPNL(c: Context) {
        try {
            const token_address = c.req.param("addr");
            const account_address = c.req.param("user");

            const trades = await prismadb.trades.findMany({
                where: {
                    token_address: token_address,
                    user_addr: account_address
                },
                orderBy: {
                    ts: "asc" // chronological order
                },
                include: {
                    token: {
                        select: {
                            name: true,
                            symbol: true,
                            image: true,
                            decimals: true
                        }
                    }
                }
            });

            if (trades.length === 0) throw new Error("No trades found.");

            // get last trade price as current market price
            const lastTrade = await prismadb.trades.findFirst({
                where: { token_address },
                orderBy: { ts: "desc" }
            });
            if (!lastTrade) throw new Error("Last trade not found");
            const currentPrice =
                parseFloat(lastTrade.virtual_aptos_reserves.toString()) /
                parseFloat(lastTrade.virtual_token_reserves.toString());

            const data = {
                bought: 0, // total spent in APT (after fee)
                sold: 0, // total received in APT (after fee)
                hodl: 0, // current value of tokens held
                realizedPNL: 0,
                unrealizedPNL: 0,
                pnl: 0,
                positionSize: 0, // tokens held
                avgEntry: 0 // weighted avg entry price per token
            };

            let costBasis = 0; // total APT spent (after fee)
            let tokensHeld = 0; // total tokens held

            for (const trade of trades) {
                const aptosAmount = parseFloat(trade.aptos_amount.toString());
                const tokenAmount = parseFloat(trade.token_amount.toString());

                if (trade.is_buy) {
                    // apply 1.5% fee → actual cost is higher
                    const costAfterFee = aptosAmount * 1.015;
                    costBasis += costAfterFee;
                    tokensHeld += tokenAmount;

                    data.bought += costAfterFee;
                } else {
                    if (tokensHeld <= 0) continue; // nothing to sell

                    // apply 1.5% fee → receive less
                    const receivedAfterFee = aptosAmount * 0.985;
                    const proportion = tokenAmount / tokensHeld;

                    // reduce cost basis proportionally
                    const costPortion = costBasis * proportion;
                    costBasis -= costPortion;
                    tokensHeld -= tokenAmount;

                    // realized PnL = what we got - what it cost
                    const realized = receivedAfterFee - costPortion;
                    data.realizedPNL += realized;

                    data.sold += receivedAfterFee;
                }
            }

            // update holdings
            data.positionSize = tokensHeld;
            data.avgEntry = tokensHeld > 0 ? costBasis / tokensHeld : 0;
            data.hodl = tokensHeld * currentPrice;
            data.unrealizedPNL =
                tokensHeld > 0 ? tokensHeld * (currentPrice - data.avgEntry) : 0;

            data.pnl = data.realizedPNL + data.unrealizedPNL;

            return c.json({ data });
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },

    async getPNL(c: Context) {
        try {
            const account_address = c.req.param("address");
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;

            // fetch user trades
            const trades = await prismadb.trades.findMany({
                where: { user_addr: account_address },
                orderBy: { ts: "asc" }, // chronological
            });

            if (trades.length === 0) throw new Error("No trades found by user address");

            // group by token
            const tokenGroups = trades.reduce((groups, trade) => {
                const token = trade.token_address;
                if (!groups[token]) groups[token] = [];
                groups[token].push(trade);
                return groups;
            }, {} as Record<string, any[]>);

            const tokenAddresses = Object.keys(tokenGroups);

            // fetch latest price per token
            const latestPrices = await Promise.all(
                tokenAddresses.map(async (tokenAddress) => {
                    const lastTrade = await prismadb.trades.findFirst({
                        where: { token_address: tokenAddress },
                        orderBy: { ts: "desc" },
                    });

                    const currentPrice = lastTrade
                        ? parseFloat(lastTrade.virtual_aptos_reserves.toString()) /
                        parseFloat(lastTrade.virtual_token_reserves.toString())
                        : 0;

                    return { tokenAddress, currentPrice };
                })
            );

            const priceMap = latestPrices.reduce((map, item) => {
                map[item.tokenAddress] = item.currentPrice;
                return map;
            }, {} as Record<string, number>);

            // fetch token metadata
            const tokenMetas = await prismadb.tokens.findMany({
                where: { pre_addr: { in: tokenAddresses } },
                select: {
                    pre_addr: true,
                    name: true,
                    symbol: true,
                    decimals: true,
                    image: true,
                },
            });

            const tokenMetaMap = tokenMetas.reduce((map, token) => {
                map[token.pre_addr] = token;
                return map;
            }, {} as Record<
                string,
                { name: string; symbol: string; decimals: number; image: string | null }
            >);

            // calculate PnL per token
            const tokenPnLs = tokenAddresses.map((tokenAddress) => {
                const tokenTrades = tokenGroups[tokenAddress];
                const currentPrice = priceMap[tokenAddress] || 0;

                let costBasis = 0; // APT spent (after fee)
                let tokensHeld = 0; // tokens in wallet
                let realizedPnL = 0;

                let aptosBought = 0;
                let aptosSold = 0;

                for (const trade of tokenTrades) {
                    const aptosAmount = parseFloat(trade.aptos_amount.toString());
                    const tokenAmount = parseFloat(trade.token_amount.toString());

                    if (trade.is_buy) {
                        // Buy → pay more (1.5% fee)
                        const costAfterFee = aptosAmount * 1.015;
                        costBasis += costAfterFee;
                        tokensHeld += tokenAmount;

                        aptosBought += costAfterFee;
                    } else {
                        if (tokensHeld <= 0) continue;

                        // Sell → receive less (1.5% fee)
                        const receivedAfterFee = aptosAmount * 0.985;
                        const proportion = tokenAmount / tokensHeld;

                        // proportional cost basis removal
                        const costPortion = costBasis * proportion;
                        costBasis -= costPortion;
                        tokensHeld -= tokenAmount;

                        realizedPnL += receivedAfterFee - costPortion;
                        aptosSold += receivedAfterFee;
                    }
                }

                const avgEntry = tokensHeld > 0 ? costBasis / tokensHeld : 0;
                const unrealizedPnL =
                    tokensHeld > 0 ? tokensHeld * (currentPrice - avgEntry) : 0;
                const totalPnL = unrealizedPnL; // realizedPnL ignored if no tokens held
                const currentHoldingValue = tokensHeld * currentPrice;

                const meta = tokenMetaMap[tokenAddress] || {
                    name: "Unknown",
                    symbol: "UNK",
                    decimals: 0,
                    image: null,
                };

                return {
                    ...meta,
                    bought: aptosBought,
                    sold: aptosSold,
                    holding_value: currentHoldingValue,
                    pnl: totalPnL,
                    realized_pnl: 0, // only unrealized matters for current balance
                    unrealized_pnl: unrealizedPnL,
                    avg_entry: avgEntry,
                    current_price: currentPrice,
                    token_holding: tokensHeld,
                };
            });

            // keep only tokens with nonzero balance
            const filteredTokens = tokenPnLs.filter((t) => t.token_holding > 0);

            // totals (only current balances matter)
            const totalUnrealizedPnL = filteredTokens.reduce(
                (sum, t) => sum + t.unrealized_pnl,
                0
            );
            const totalInvested = filteredTokens.reduce((sum, t) => sum + t.bought, 0);
            const totalCurrentValue = filteredTokens.reduce(
                (sum, t) => sum + t.holding_value,
                0
            );

            const totalPnL = totalUnrealizedPnL;
            const totalRealizedPnL = 0;
            const totalWithdrawn = 0;

            // pagination
            const paginatedTokens =
                limit > 0
                    ? filteredTokens.slice(offset * limit, offset * limit + limit)
                    : filteredTokens;

            return c.json({
                data: {
                    total_pnl: totalPnL,
                    total_invested: totalInvested,
                    total_withdrawn: totalWithdrawn,
                    current_holding_value: totalCurrentValue,
                    realized_pnl: totalRealizedPnL,
                    unrealized_pnl: totalUnrealizedPnL,
                    total_tokens: filteredTokens.length,
                    tokens: paginatedTokens,
                },
            });
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    }
}