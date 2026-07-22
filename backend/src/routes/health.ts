import { Hono } from "hono";
import { checkDbConnection } from "../db/index.js";

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "brandflow-admin-api",
    timestamp: new Date().toISOString(),
  });
});

healthRoutes.get("/db", async (c) => {
  const db = await checkDbConnection();
  return c.json(
    {
      status: db.ok ? "ok" : "error",
      database: db.ok ? "connected" : "disconnected",
      message: db.message,
    },
    db.ok ? 200 : 503,
  );
});
