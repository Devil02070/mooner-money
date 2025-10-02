import type { Context } from "hono";
import prismadb from "../lib/prisma.js";
import { sendMessageIO } from "../socket-io.js"
export default {
    async createChat(c: Context) {
        try {
            const { address } = c.get("jwtPayload");
            if (!address) throw new Error("You are not authorized to perform this action");
            const token_address = c.req.param("addr");
            const token = await prismadb.tokens.findFirst({
                where: {
                    pre_addr: token_address
                }
            });
            if (!token) throw new Error("Token not found by address");
            const { content, image } = await c.req.json();
            const chat = await prismadb.chats.create({
                data: {
                    address,
                    token_address,
                    content,
                    image
                }
            })
            // emit here
            sendMessageIO(
                `chat-${token_address}`,
                chat
            );
            return c.json({ data: "Chat created successfully" })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },
    async getChat(c: Context) {
        try {
            const token_address = c.req.param("addr");
            const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
            const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 10;
            const sortBy = c.req.query("sort_by") ?? "timestamp";
            const sortOrder = c.req.query("sort_order") ?? "desc";
            const data: any[] = await prismadb.$queryRawUnsafe(
                `
                    SELECT 
                        c.*,
                        json_build_object(
                        'address', a.address,
                        'username', a.x_username,
                        'profile_image', a.x_display_picture
                        ) AS user
                    FROM chats c
                    LEFT JOIN accounts a 
                        ON c.address = a.address
                    WHERE c.token_address = $1
                    ORDER BY ${sortBy} ${sortOrder}
                    OFFSET $2
                    LIMIT $3
                    `,
                token_address,
                offset * limit,
                limit
            );
            const count = await prismadb.chats.count({
                where: {
                    token_address
                }
            });

            return c.json({
                data, pagination: {
                    total: Math.ceil(count / limit),
                    count,
                    offset,
                    limit
                }
            })
        } catch (error: any) {
            return c.json({ message: error.message }, 500);
        }
    },
}