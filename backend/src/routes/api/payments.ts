import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapPayment } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const paymentRoutes = new Hono();

paymentRoutes.get("/", async (c) => {
  const { status } = c.req.query();
  const cols = `id, order_id, customer, amount, method, status, paid_date`;
  const rows = status
    ? await query(`SELECT ${cols} FROM payments WHERE status = $1 ORDER BY paid_date DESC`, [status])
    : await query(`SELECT ${cols} FROM payments ORDER BY paid_date DESC`);
  return c.json(rows.map(mapPayment));
});

paymentRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM payments WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Payment not found" }, 404);
  return c.json(mapPayment(row));
});

paymentRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("TXN");

  await execute(
    `INSERT INTO payments (id, order_id, customer, amount, method, status, paid_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      body.orderId,
      body.customer ?? "",
      body.amount ?? 0,
      body.method ?? "UPI",
      body.status ?? "Pending",
      body.date ?? new Date().toISOString().slice(0, 10),
    ],
  );

  const row = await queryOne("SELECT * FROM payments WHERE id = $1", [id]);
  return c.json(mapPayment(row!), 201);
});

paymentRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("payments", c.req.param("id"), body, {
    orderId: "order_id",
    customer: "customer",
    amount: "amount",
    method: "method",
    status: "status",
    date: "paid_date",
  });
  return c.json(mapPayment(row!));
});

paymentRoutes.delete("/:id", async (c) => {
  await deleteById("payments", c.req.param("id"));
  return c.json({ ok: true });
});
