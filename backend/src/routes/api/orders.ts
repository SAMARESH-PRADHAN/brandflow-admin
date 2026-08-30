import { Hono } from "hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapOrder } from "../../lib/mappers.js";
import { deleteByIdWithImageCleanup, cleanupRemovedImagesOnPatch, newId, parseJsonBody, patchById } from "../../lib/http.js";

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

export async function insertOrder(body: Record<string, unknown>, isSample: boolean) {
  const id = (body.id as string) ?? newId(isSample ? "SMP" : "ORD");
  const timeline = body.timeline ?? [{ status: body.status ?? "Placed", at: body.date ?? new Date().toISOString().slice(0, 10) }];

  await execute(
    `INSERT INTO orders (
      id, customer_id, customer_name, phone, email, address,
      company_name, gst_number, notes,
      product_id, product_code, product_name, category, product_type, sub_category,
      material, description, print_type, print_location, uploaded_logo,
      sizes, qty, unit_price,  printing_price, gst_pct, shipping,
      discount_pct, discount_amt, total_amount, paid_amount,
      type, status, payment_status, payment_method, is_sample, order_date, timeline
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
      $22,$23,$24,$25,
      $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37
    )`,
    [
      id,
      body.customerId ?? null,
      body.customer ?? "Walk-in Customer",
      body.phone ?? "",
      body.email ?? "",
      body.address ?? "",
      body.companyName ?? "",
body.gstNumber ?? "",
body.notes ?? "",
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
      body.printingPrice ?? 0,
      body.gstPct ?? 5,
      body.shipping ?? 0,
      body.discountPct ?? 0,
      body.discountAmt ?? 0,
      body.total ?? 0,
      body.paid ?? 0,
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
/** List only — detail page still uses SELECT * on GET /:id */
const ORDER_LIST_COLUMNS = `
  id, customer_id, customer_name, phone, email, address, company_name, gst_number, notes,
  product_id, product_code, product_name, category, product_type, sub_category,
  material, description, print_type, print_location, uploaded_logo,
  sizes, qty, unit_price, printing_price, gst_pct, shipping,
  discount_pct, discount_amt, total_amount, paid_amount,
  type, status, payment_status, payment_method, is_sample, order_date, timeline
`;
orderRoutes.get("/", async (c) => {
  const { where, params } = buildOrderFilters(c, false);
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;
  params.push(l, offset);

  const rows = await query(
    `SELECT ${ORDER_LIST_COLUMNS}, count(*) OVER() as _total_count 
     FROM orders ${where} ORDER BY order_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, 
    params
  );
  
  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapOrder),
    pagination: { page: p, limit: l, total: totalCount }
  });
});

orderRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM orders WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Order not found" }, 404);
  return c.json(mapOrder(row));
});

orderRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  if (body.paymentStatus === "Paid" && body.paymentMethod !== "COD") {
    throw new HTTPException(403, {
      message: "Paid orders must go through the payment verification flow",
    });
  }
  const row = await insertOrder(body, false);
  return c.json(mapOrder(row!), 201);
});

orderRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  if (body.sizes !== undefined) body.sizes = JSON.stringify(body.sizes);
  if (body.timeline !== undefined) body.timeline = JSON.stringify(body.timeline);
  const id = c.req.param("id");
  const existing = await queryOne("SELECT id, uploaded_logo FROM orders WHERE id = $1", [id]);
  if (!existing) return c.json({ error: "Order not found" }, 404);

  await cleanupRemovedImagesOnPatch(existing as Record<string, unknown>, body, {
    imageBodyKey: "uploadedLogo",
    imageDbColumn: "uploaded_logo",
  });

  const row = await patchById("orders", id, body, {
    customerId: "customer_id",
    customer: "customer_name",
    phone: "phone",
    email: "email",
    address: "address",
    companyName: "company_name",
gstNumber:   "gst_number",
notes:       "notes",
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
    printingPrice: "printing_price",
    gstPct: "gst_pct",
    shipping: "shipping",
    discountPct: "discount_pct",
    discountAmt: "discount_amt",
    total: "total_amount",
    paid: "paid_amount",
    type: "type",
    status: "status",
    paymentStatus: "payment_status",
    paymentMethod: "payment_method",
    date: "order_date",
    sizes: "sizes",
    timeline: "timeline",
  });

  return c.json(mapOrder(row!));
});

orderRoutes.delete("/:id", async (c) => {
  await deleteByIdWithImageCleanup("orders", c.req.param("id"), {
    imageDbColumn: "uploaded_logo",
    includeImagesArray: false,
  });
  return c.json({ ok: true });
});

export const sampleOrderRoutes = new Hono();

sampleOrderRoutes.get("/", async (c) => {
  const { where, params } = buildOrderFilters(c, true);
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;
  params.push(l, offset);

  const rows = await query(
    `SELECT ${ORDER_LIST_COLUMNS}, count(*) OVER() as _total_count 
     FROM orders ${where} ORDER BY order_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, 
    params
  );
  
  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapOrder),
    pagination: { page: p, limit: l, total: totalCount }
  });
});

sampleOrderRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await insertOrder(body, true);
  return c.json(mapOrder(row!), 201);
});
sampleOrderRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  if (body.timeline !== undefined) body.timeline = JSON.stringify(body.timeline);
  const id = c.req.param("id");
  const existing = await queryOne("SELECT id FROM orders WHERE id = $1 AND is_sample = true", [id]);
  if (!existing) return c.json({ error: "Sample order not found" }, 404);

  const row = await patchById("orders", id, body, {
    status: "status",
    paymentStatus: "payment_status",
    // add other fields as needed
    timeline: "timeline",
  });
  return c.json(mapOrder(row!));
});