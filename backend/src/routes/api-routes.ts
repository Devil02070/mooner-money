import { Hono } from "hono";
import { tokenRoutes } from "./token-routes.js";
import { tradeRoutes } from "./trade-routes.js";
import { authRoutes } from "./auth-routes.js";
import { chatRoutes } from "./chat-routes.js";
import { indexerRoutes } from "./indexer-routes.js";
import { stakeRoutes } from "./stake-routes.js";
import { taskRoutes } from "./task-routes.js";

const app = new Hono();

// token routes
app.route("/token", tokenRoutes);
// trade routes
app.route("/trade", tradeRoutes);
// auth routes
app.route("/auth", authRoutes);
// chat routes
app.route("/chat", chatRoutes);
// indexer routes
app.route("/indexer", indexerRoutes);
// stake routes
app.route("/stake", stakeRoutes);
// task routes
app.route("/task", taskRoutes);

export const apiRoutes = app;