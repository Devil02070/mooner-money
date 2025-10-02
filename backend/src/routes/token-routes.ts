import { Hono } from "hono";
import tokenController from "../controllers/token-controller.js";
const app = new Hono();

app.get("/get", tokenController.getTokens);
app.get("/:addr/get", tokenController.getTokenByAddr);
export const tokenRoutes = app;
