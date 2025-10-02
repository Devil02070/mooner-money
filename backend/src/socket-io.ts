import type { ServerType } from "@hono/node-server";
import { Server } from "socket.io"
let io: Server | null = null;

export const startSocketIO = (server: ServerType, origins: string[]) => {
    io = new Server(server, {
        cors: {
            origin: origins,
            methods: ["GET"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`[socket-io]: A user connected`, socket.id);
        socket.on("disconnect", () => {
            console.log(`[socket-io]: A user disconnected:`, socket.id);
        });
    });
}

export const sendMessageIO = (ev: string, ...args: any[]) => {
    if (!io) {
        throw new Error("Socket io not initialized")
    }
    io.emit(ev, ...args)
}