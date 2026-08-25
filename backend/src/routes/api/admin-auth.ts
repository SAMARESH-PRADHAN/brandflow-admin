import { Hono } from "hono";
import { queryOne, execute } from "../../db/pool.js";
import { parseJsonBody } from "../../lib/http.js";
import { rateLimit } from "../../middleware/rate-limit.js";

export const adminAuthRoutes = new Hono();

adminAuthRoutes.post("/login", rateLimit(10, 60000), async (c) => {
  const body = await parseJsonBody<{ email?: string; password?: string }>(c);
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const row = await queryOne<{ email: string; password: string }>(
    "SELECT email, password FROM admin_credentials WHERE id = 'admin'",
  );

  if (!row || row.email.toLowerCase() !== email.toLowerCase() || row.password !== password) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  return c.json({ ok: true, email: row.email });
});

adminAuthRoutes.post("/forgot-password", rateLimit(5, 60000), async (c) => {
  const body = await parseJsonBody<{ masterKey?: string; newPassword?: string }>(c);
  const masterKey = (body.masterKey ?? "").trim();
  const newPassword = body.newPassword ?? "";

  if (!masterKey || !newPassword) {
    return c.json({ error: "Master key and new password are required" }, 400);
  }

  const row = await queryOne<{ master_key: string }>(
    "SELECT master_key FROM admin_credentials WHERE id = 'admin'",
  );

  if (!row || row.master_key !== masterKey) {
    return c.json({ error: "Invalid master key" }, 401);
  }

  await execute("UPDATE admin_credentials SET password = $1 WHERE id = 'admin'", [newPassword]);
  return c.json({ ok: true });
});