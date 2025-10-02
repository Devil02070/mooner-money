import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { jwtSecret } from "../utils/env.js";
import { zValidator } from "@hono/zod-validator"
import { chatSchema } from "../utils/validation-schema.js";
import chatController from "../controllers/chat-controller.js";

const app = new Hono();

app.post("/create/:addr", zValidator("json", chatSchema), jwt({ secret: jwtSecret }), chatController.createChat);
app.get("/:addr/get", chatController.getChat);

export const chatRoutes = app;
