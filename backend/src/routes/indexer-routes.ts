import { Hono, type Next, type Context } from "hono";
import indexerController from "../controllers/indexer-controller.js";
import { indexerAccessToken } from "../utils/env.js";

async function indexerMiddleware(c: Context, next: Next) {
    try {
        const indexerHeader = c.req.header("x-indexer");
        if(!indexerHeader) throw new Error("Indexer header is missing");
        if(indexerHeader !== indexerAccessToken) {
            throw new Error("Not from indexer");
        }
        await next();
    } catch (error: any) {
        // send 200 to indexer in any case
        return c.json({ error: error.message })
    }
}

const app = new Hono();

app.get("/created/:addr", indexerMiddleware, indexerController.tokenCreated);
app.get("/traded/:version", indexerMiddleware, indexerController.tokenTraded);
app.get("/price/:symbol", indexerController.getPrice);
app.post("/spin", indexerMiddleware, indexerController.spinEvent);

export const indexerRoutes = app;
