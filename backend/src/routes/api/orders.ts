import { Hono } from "hono";
import type { Context } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapOrder } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

function buildOrderFilters(c: Context, isSample: boolean) {
  const type = c.req.query("type");
  const status = c.req.query("status");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const conditions = [`is_sample = $1`];
  const params: unknown[] = [isSample];

  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`order_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`order_date <= $${params.length}`);
  }

  return { where: `WHERE ${conditions.join(" AND ")}`, params };
}

async function insertOrder(body: Record<string, unknown>, isSample: boolean) {
  const id = (body.id as string) ?? newId(isSample ? "SMP" : "ORD");
  const timeline = body.timeline ?? [{ status: body.status ?? "Placed", at: body.date ?? new Date().toISOString().slice(0, 10) }];

  await execute(
    `INSERT INTO orders (
      id, customer_id, customer_name, phone, email, address,
      product_id, product_code, product_name, category, product_type, sub_category,
      material, description, print_type, print_location, uploaded_logo,
      sizes, qty, unit_price, gst_pct, shipping,
      type, status, payment_status, payment_method, is_sample, order_date, timeline
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
    )`,
    [
      id,
      body.customerId ?? null,
      body.customer ?? "Walk-in Customer",
      body.phone ?? "",
      body.email ?? "",
      body.address ?? "",
      body.productId ?? null,
      body.productCode ?? "",
      body.productName ?? "",
      body.category ?? "",
      body.productType ?? "",
      body.subCategory ?? "",
      body.material ?? "",
      body.description ?? "",
      body.printType ?? "",
      body.printLocation ?? "",
      body.uploadedLogo ?? "",
      JSON.stringify(body.sizes ?? {}),
      body.qty ?? 1,
      body.unitPrice ?? 0,
      body.gstPct ?? 5,
      body.shipping ?? 0,
      body.type ?? "Normal",
      body.status ?? "Placed",
      body.paymentStatus ?? "Pending",
      body.paymentMethod ?? "UPI",
      isSample,
      body.date ?? new Date().toISOString().slice(0, 10),
      JSON.stringify(timeline),
    ],
  );

  return queryOne("SELECT * FROM orders WHERE id = $1", [id]);
}

export const orderRoutes = new Hono();
const ORDER_LIST_COLUMNS = `
  id, customer_id, customer_name, phone, email, address,
  product_id, product_code, product_name, category, product_type, sub_category,
  material, description, print_type, print_location, uploaded_logo,
  sizes, qty, unit_price, gst_pct, shipping,
  type, status, payment_status, payment_method, is_sample, order_date, timeline
`;
orderRoutes.get("/", async (c) => {
  const { where, params } = buildOrderFilters(c, false);
  const rows = await query(`SELECT ${ORDER_LIST_COLUMNS} FROM orders ${where} ORDER BY order_date DESC`, params);
  return c.json(rows.map(mapOrder));
});

orderRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM orders WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Order not found" }, 404);
  return c.json(mapOrder(row));
});

orderRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await insertOrder(body, false);
  return c.json(mapOrder(row!), 201);
});

orderRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = c.req.param("id");

  await patchById("orders", id, body, {
    customerId: "customer_id",
    customer: "customer_name",
    phone: "phone",
    email: "email",
    address: "address",
    productId: "product_id",
    productCode: "product_code",
    productName: "product_name",
    category: "category",
    productType: "product_type",
    subCategory: "sub_category",
    material: "material",
    description: "description",
    printType: "print_type",
    printLocation: "print_location",
    uploadedLogo: "uploaded_logo",
    qty: "qty",
    unitPrice: "unit_price",
    gstPct: "gst_pct",
    shipping: "shipping",
    type: "type",
    status: "status",
    paymentStatus: "payment_status",
    paymentMethod: "payment_method",
    date: "order_date",
  });

  if (body.sizes !== undefined) {
    await execute("UPDATE orders SET sizes = $1::jsonb WHERE id = $2", [JSON.stringify(body.sizes), id]);
  }
  if (body.timeline !== undefined) {
    await execute("UPDATE orders SET timeline = $1::jsonb WHERE id = $2", [JSON.stringify(body.timeline), id]);
  }

  const row = await queryOne("SELECT * FROM orders WHERE id = $1", [id]);
  return c.json(mapOrder(row!));
});

orderRoutes.delete("/:id", async (c) => {
  await deleteById("orders", c.req.param("id"));
  return c.json({ ok: true });
});

export const sampleOrderRoutes = new Hono();

sampleOrderRoutes.get("/", async (c) => {
  const { where, params } = buildOrderFilters(c, true);
  const rows = await query(`SELECT ${ORDER_LIST_COLUMNS} FROM orders ${where} ORDER BY order_date DESC`, params);
  return c.json(rows.map(mapOrder));
});

sampleOrderRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await insertOrder(body, true);
  return c.json(mapOrder(row!), 201);
});
