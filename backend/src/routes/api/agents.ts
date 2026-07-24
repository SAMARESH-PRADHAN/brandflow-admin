import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapAgent } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const agentRoutes = new Hono();

agentRoutes.get("/", async (c) => {
  const rows = await query(
    `SELECT id, code, name, phone, email, address, status, join_date
     FROM agents ORDER BY join_date DESC`,
  );
  return c.json(rows.map(mapAgent));
});

agentRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM agents WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Agent not found" }, 404);
  return c.json(mapAgent(row));
});

agentRoutes.post("/", async (c) => {
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
