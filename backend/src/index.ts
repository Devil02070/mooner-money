import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress"
import { serve } from "@hono/node-server";
import { port } from "./utils/env.js";
import { startSocketIO } from "./socket-io.js";
import { apiRoutes } from "./routes/api-routes.js";

const app = new Hono();
const origins = ["http://localhost:3000", "http://www.localhost:3000", "https://mooner.money", "https://www.mooner.money", "https://meowtos.fun", "https://www.meowtos.fun"];

app.use(compress());
app.use(
    "*",
    cors({
        origin: origins,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "x-access", "Accept-Encoding", "x-indexer"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    })
);

app.get("/", (c) => {
    return c.json({"mooner": "money"});
});
app.route("/api", apiRoutes);
app.get("/verify-metanect", (c) => {
    return c.text("This domain is owned by Metanect")
})

app.get("*", (c) => {
    return c.json({ status: "not-found" }, 500)
})

const server = serve(
    {
        fetch: app.fetch,
        port,
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    }
);

startSocketIO(server, origins);

