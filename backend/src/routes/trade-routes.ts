import { Hono } from "hono";
import tradeController from "../controllers/trade-controller.js";
const app = new Hono();

app.get("/:addr/get", tradeController.getTrades);
app.get("/recent", tradeController.getRecentTrades);
app.get("/:addr/holders", tradeController.getHolders);
app.get("/:addr/chart", tradeController.getChart);
app.get("/:addr/pnl/:user", tradeController.getTokenPNL);
app.get("/:address/pnl", tradeController.getPNL);

export const tradeRoutes = app;
