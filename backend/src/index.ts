import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`API running at http://localhost:${info.port}`);
    console.log(`Health check: http://localhost:${info.port}/health`);
  },
);
