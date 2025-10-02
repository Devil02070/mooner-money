import { Hono, type Next, type Context } from "hono";
import authController from "../controllers/auth-controller.js";
import { jwt } from "hono/jwt";
import { jwtSecret } from "../utils/env.js";
import twitter from "../utils/twitter.js";

async function twitterMiddleware(c: Context, next: Next) {
    try {
        const twitterToken = c.req.header("x-access");
        if(!twitterToken) throw new Error("Twitter token missing");
        const twitterUser = await twitter.getCurrentUser(twitterToken);
        c.set("twitterUser", twitterUser);
        await next();
    } catch (error: any) {
        return c.json({ error: error.message }, 401)
    }
}

const app = new Hono();

app.post("/connect", authController.connect);
app.put("/connect-twitter", twitterMiddleware, jwt({ secret: jwtSecret }), authController.twitterAuth);
app.delete("/disconnect-twitter", jwt({ secret: jwtSecret }), authController.disconnectTwitter);
app.get("/:address/get", authController.getAccount);
app.put("/spin", jwt({ secret: jwtSecret }), authController.spin);
app.get("/xp-leaderboard", authController.getXpLeaderboard);

export const authRoutes = app;
