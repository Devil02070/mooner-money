import { Hono } from "hono";
import stakeController from "../controllers/stake-controller.js";

const app = new Hono();

app.get("/:user/get/:stake_addr", stakeController.getPositions);
app.get("/:stake_addr/stats", stakeController.getStats);
export const stakeRoutes = app;
