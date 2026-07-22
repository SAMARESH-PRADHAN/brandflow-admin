import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapCustomer } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const customerRoutes = new Hono();

customerRoutes.get("/", async (c) => {
  const { status } = c.req.query();
  const rows = status
    ? await query("SELECT * FROM customers WHERE status = $1 ORDER BY join_date DESC", [status])
    : await query("SELECT * FROM customers ORDER BY join_date DESC");
  return c.json(rows.map(mapCustomer));
});

customerRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM customers WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Customer not found" }, 404);
  return c.json(mapCustomer(row));
});

customerRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("CUS");

  await execute(
    `INSERT INTO customers (id, name, phone, email, address, total_orders, total_spend, join_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      body.name ?? "New Customer",
      body.phone ?? "",
      body.email ?? "",
      body.address ?? "",
      body.totalOrders ?? 0,
      body.totalSpend ?? 0,
      body.joinDate ?? new Date().toISOString().slice(0, 10),
      body.status ?? "Active",
    ],
  );

  const row = await queryOne("SELECT * FROM customers WHERE id = $1", [id]);
  return c.json(mapCustomer(row!), 201);
});

customerRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("customers", c.req.param("id"), body, {
    name: "name",
    phone: "phone",
    email: "email",
    address: "address",
    totalOrders: "total_orders",
    totalSpend: "total_spend",
    joinDate: "join_date",
    status: "status",
  });
  return c.json(mapCustomer(row!));
});

customerRoutes.delete("/:id", async (c) => {
  await deleteById("customers", c.req.param("id"));
  return c.json({ ok: true });
});
