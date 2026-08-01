import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapAgent } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const agentRoutes = new Hono();

agentRoutes.get("/", async (c) => {
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;

  const rows = await query(
    `SELECT id, code, name, phone, email, address, status, join_date, count(*) OVER() as _total_count
     FROM agents ORDER BY join_date DESC LIMIT $1 OFFSET $2`, [l, offset]
  );
  
  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapAgent),
    pagination: { page: p, limit: l, total: totalCount }
  });
});

agentRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM agents WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Agent not found" }, 404);
  return c.json(mapAgent(row));
});

import { rateLimit } from "../../middleware/rate-limit.js";

agentRoutes.post("/", rateLimit(5, 60000), async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("AGT");

  await execute(
    `INSERT INTO agents (id, code, name, phone, email, address, status, join_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      body.code ?? `ARX-AG${Date.now()}`,
      body.name ?? "New Agent",
      body.phone ?? "",
      body.email ?? "",
      body.address ?? "",
      body.status ?? "Active",
      body.joinDate ?? new Date().toISOString().slice(0, 10),
    ],
  );

  const row = await queryOne("SELECT * FROM agents WHERE id = $1", [id]);
  return c.json(mapAgent(row!), 201);
});

agentRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("agents", c.req.param("id"), body, {
    code: "code",
    name: "name",
    phone: "phone",
    email: "email",
    address: "address",
    status: "status",
    joinDate: "join_date",
  });
  return c.json(mapAgent(row!));
});

agentRoutes.delete("/:id", async (c) => {
  await deleteById("agents", c.req.param("id"));
  return c.json({ ok: true });
});
