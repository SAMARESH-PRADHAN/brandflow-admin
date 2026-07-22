import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsOrigins, env } from "./config/env.js";
import { errorHandler, logger, notFound } from "./middleware/index.js";
import { healthRoutes } from "./routes/health.js";
import { apiRoutes } from "./routes/api/index.js";

export function createApp() {
  const app = new Hono();

  app.use("*", logger);
  app.use(
    "*",
    cors({
      origin: corsOrigins,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.route("/health", healthRoutes);
  app.route("/api", apiRoutes);

  app.get("/", (c) =>
    c.json({
      name: "Brandflow Admin API",
      version: "0.1.0",
      env: env.NODE_ENV,
    }),
  );

  app.notFound(notFound);
  app.onError(errorHandler);

  return app;
}

export type App = ReturnType<typeof createApp>;
