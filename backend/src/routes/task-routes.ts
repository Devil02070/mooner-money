import { Hono, type Next, type Context } from "hono";;
import { adminAccessToken, jwtSecret } from "../utils/env.js";
import taskController from "../controllers/task-controller.js";
import { taskSchema } from "../utils/validation-schema.js";
import { zValidator } from "@hono/zod-validator";
import { jwt } from "hono/jwt";

async function adminMiddleware(c: Context, next: Next) {
    try {
        const adminToken = c.req.header("x-admin");
        if(!adminToken || adminToken !== adminAccessToken) {
            throw new Error("Unauthorized");
        };
        await next();
    } catch (error: any) {
        return c.json({ error: error.message }, 401)
    }
}

const app = new Hono();

app.post("/create", zValidator("json", taskSchema), adminMiddleware, taskController.createTask);
app.get("/get", taskController.getTask);
app.put("/claim/:id", jwt({ secret: jwtSecret }), taskController.claimTask);

export const taskRoutes = app;
