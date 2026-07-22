import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapAgentVisit } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const agentVisitRoutes = new Hono();

agentVisitRoutes.get("/", async (c) => {
  const { agentId, outcome } = c.req.query();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (agentId) {
    params.push(agentId);
    conditions.push(`agent_id = $${params.length}`);
  }
  if (outcome) {
    params.push(outcome);
    conditions.push(`outcome = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT * FROM agent_visits ${where} ORDER BY visit_date DESC`, params);
  return c.json(rows.map(mapAgentVisit));
});

agentVisitRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM agent_visits WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Agent visit not found" }, 404);
  return c.json(mapAgentVisit(row));
});

agentVisitRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("VIS");

  await execute(
    `INSERT INTO agent_visits (
      id, agent_id, agent_name, agent_code, customer_name, customer_phone, customer_email,
      company_name, address, city, gst_number, visit_date, next_follow_up, outcome, requirement, notes, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      id,
      body.agentId,
      body.agentName ?? "",
      body.agentCode ?? "",
      body.customerName ?? "",
      body.customerPhone ?? "",
      body.customerEmail ?? "",
      body.companyName ?? "",
      body.address ?? "",
      body.city ?? "",
      body.gstNumber ?? "",
      body.visitDate ?? new Date().toISOString().slice(0, 10),
      body.nextFollowUp ?? null,
      body.outcome ?? "Follow-up",
      body.requirement ?? "",
      body.notes ?? "",
      body.createdAt ?? new Date().toISOString(),
    ],
  );

  const row = await queryOne("SELECT * FROM agent_visits WHERE id = $1", [id]);
  return c.json(mapAgentVisit(row!), 201);
});

agentVisitRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("agent_visits", c.req.param("id"), body, {
    agentId: "agent_id",
    agentName: "agent_name",
    agentCode: "agent_code",
    customerName: "customer_name",
    customerPhone: "customer_phone",
    customerEmail: "customer_email",
    companyName: "company_name",
    address: "address",
    city: "city",
    gstNumber: "gst_number",
    visitDate: "visit_date",
    nextFollowUp: "next_follow_up",
    outcome: "outcome",
    requirement: "requirement",
    notes: "notes",
  });
  return c.json(mapAgentVisit(row!));
});

agentVisitRoutes.delete("/:id", async (c) => {
  await deleteById("agent_visits", c.req.param("id"));
  return c.json({ ok: true });
});
