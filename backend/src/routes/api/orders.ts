import { Hono } from "hono";
import type { Context } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapOrder } from "../../lib/mappers.js";
import {
  deleteByIdWithImageCleanup,
  cleanupRemovedImagesOnPatch,
  newId,
  parseJsonBody,
  patchById,
} from "../../lib/http.js";

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
  const timeline = body.timeline ?? [
    {
      status: body.status ?? "Placed",
      at: body.date ?? new Date().toISOString().slice(0, 10),
    },
  ];

  // ---- Sales Agent resolution (authoritative) ----
  let salesAgentId: string | null =
    typeof body.salesAgentId === "string" && body.salesAgentId
      ? body.salesAgentId
      : null;
  let salesAgentCode = "";
  let salesAgentName = "";
  let baseUnitPrice = Number(body.baseUnitPrice ?? 0) || 0;
  let agentUnitPrice = Number(body.agentUnitPrice ?? body.unitPrice ?? 0) || 0;
  let agentEarning = 0;
  let platformEarning = 0;
  let orderType = (body.type as string) ?? "Normal";
  let unitPrice = Number(body.unitPrice ?? 0) || 0;
  const qty = Number(body.qty ?? 1) || 1;

  // Resolve agent by id or shareToken
  if (!salesAgentId && typeof body.shareToken === "string" && body.shareToken) {
    const byToken = await queryOne(
      `SELECT id, code, name, status FROM sales_agents WHERE share_token = $1`,
      [body.shareToken],
    );
    if (byToken && byToken.status === "Active") {
      salesAgentId = byToken.id as string;
    }
  }

  if (salesAgentId) {
    const agent = await queryOne(
      `SELECT id, code, name, status FROM sales_agents WHERE id = $1`,
      [salesAgentId],
    );

    if (!agent || agent.status !== "Active") {
      // Ignore invalid/inactive agent — treat as normal order
      salesAgentId = null;
    } else {
      salesAgentCode = String(agent.code ?? "");
      salesAgentName = String(agent.name ?? "");
      orderType = "Sales Agent";

      // Base price from catalog product (never trust frontend for base)
      const productId = body.productId as string | null | undefined;
      if (productId) {
        const product = await queryOne(
          `SELECT id, original_price FROM products WHERE id = $1`,
          [productId],
        );
        if (product) {
          baseUnitPrice = Number(product.original_price ?? 0) || 0;
        }

        const priceRow = await queryOne(
          `SELECT agent_price FROM sales_agent_product_prices
           WHERE sales_agent_id = $1 AND product_id = $2`,
          [salesAgentId, productId],
        );
        const catalogAgentPrice =
          priceRow != null ? Number(priceRow.agent_price) : baseUnitPrice;

        // Agent sell price cannot be below base
        const safeAgentPrice = Math.max(catalogAgentPrice, baseUnitPrice);

        // Customer-facing unit price should be the agent price
        // (coupons may reduce further on frontend — keep unitPrice from body
        // only if it is still >= base after discount; otherwise clamp.)
        const frontendUnit =
          Number(body.unitPrice ?? safeAgentPrice) || safeAgentPrice;
        unitPrice = Math.max(frontendUnit, 0);
        agentUnitPrice = safeAgentPrice;

        // Earnings on catalog margin × qty (not reduced by coupon in v1)
        // If you prefer earnings on actual paid unit after coupon, use unitPrice instead of safeAgentPrice.
        const marginPerUnit = Math.max(0, safeAgentPrice - baseUnitPrice);
        const totalMargin = marginPerUnit * qty;

        agentEarning = Math.round(totalMargin * 0.8 * 100) / 100;
        platformEarning = Math.round(totalMargin * 0.2 * 100) / 100;
      } else {
        baseUnitPrice = Math.max(baseUnitPrice, 0);
        agentUnitPrice = Math.max(agentUnitPrice, baseUnitPrice);
        unitPrice = Number(body.unitPrice ?? agentUnitPrice) || agentUnitPrice;

        const marginPerUnit = Math.max(0, agentUnitPrice - baseUnitPrice);

        const totalMargin = marginPerUnit * qty;

        agentEarning = Math.round(totalMargin * 0.8 * 100) / 100;
        platformEarning = Math.round(totalMargin * 0.2 * 100) / 100;
      }
    }
  }

  await execute(
    `INSERT INTO orders (
      id, customer_id, customer_name, phone, email, address,
      company_name, gst_number, notes,
      product_id, product_code, product_name, category, product_type, sub_category,
      material, description, print_type, print_location, uploaded_logo,
      sizes, qty, unit_price,  printing_price, gst_pct, shipping,
      discount_pct, discount_amt, total_amount, paid_amount,
      type, status, payment_status, payment_method, is_sample, order_date, timeline,
      sales_agent_id, sales_agent_code, sales_agent_name,
      base_unit_price, agent_unit_price, agent_earning, platform_earning
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
      $22,$23,$24,$25,
      $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,
      $38,$39,$40,$41,$42,$43,$44
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
      qty,
      unitPrice,
      body.printingPrice ?? 0,
      body.gstPct ?? 5,
      body.shipping ?? 0,
      body.discountPct ?? 0,
      body.discountAmt ?? 0,
      body.total ?? 0,
      body.paid ?? 0,
      orderType,
      body.status ?? "Placed",
      body.paymentStatus ?? "Pending",
      body.paymentMethod ?? "UPI",
      isSample,
      body.date ?? new Date().toISOString().slice(0, 10),
      JSON.stringify(timeline),
      salesAgentId,
      salesAgentCode,
      salesAgentName,
      baseUnitPrice,
      agentUnitPrice,
      agentEarning,
      platformEarning,
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
  type, status, payment_status, payment_method, is_sample, order_date, timeline,
  invoice_number, razorpay_order_id,
  sales_agent_id, sales_agent_code, sales_agent_name,
  base_unit_price, agent_unit_price, agent_earning, platform_earning, agent_payout_status, agent_payout_at
`;
orderRoutes.get("/", async (c) => {
  const { where, params } = buildOrderFilters(c, false);
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50),
  );
  const offset = (p - 1) * l;
  params.push(l, offset);

  const rows = await query(
    `SELECT ${ORDER_LIST_COLUMNS}, count(*) OVER() as _total_count 
     FROM orders ${where} ORDER BY order_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapOrder),
    pagination: { page: p, limit: l, total: totalCount },
  });
});

orderRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM orders WHERE id = $1", [
    c.req.param("id"),
  ]);
  if (!row) return c.json({ error: "Order not found" }, 404);
  return c.json(mapOrder(row));
});

// orderRoutes.post("/", async (c) => {
//   const body = await parseJsonBody<Record<string, unknown>>(c);
//   const row = await insertOrder(body, false);
//   return c.json(mapOrder(row!), 201);
// });

orderRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);

  // If a coupon code was sent, re-validate and apply discount server-side
  const couponCode = (body.couponCode as string | undefined)
    ?.trim()
    ?.toUpperCase();
  if (couponCode) {
    const couponRow = await queryOne(
      `SELECT * FROM coupons WHERE LOWER(code) = LOWER($1)`,
      [couponCode],
    );
    if (couponRow) {
      const cartTotal = Number(body.total) || 0;
      let discountAmount = 0;
      if (couponRow.discount_type === "fixed") {
        discountAmount = Math.min(Number(couponRow.discount_value), cartTotal);
      } else {
        discountAmount = Math.round(
          (cartTotal * Number(couponRow.discount_value)) / 100,
        );
      }
      // Override frontend values with server-calculated ones
      body.discountAmt = discountAmount;
      body.discountPct = 0; // coupon is fixed amount, not %
      body.total = Math.max(0, cartTotal - discountAmount);
    }
  }

  const row = await insertOrder(body, false);

  // Record coupon usage
  if (couponCode && row) {
    try {
      await execute(
        `INSERT INTO coupon_usages (
          id, coupon_id, coupon_code, customer_id, customer_name,
          customer_email, order_id, discount_amount
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          newId("CU"),
          (
            await queryOne(
              `SELECT id FROM coupons WHERE LOWER(code) = LOWER($1)`,
              [couponCode],
            )
          )?.id,
          couponCode,
          body.customerId ?? null,
          body.customer ?? null,
          body.email ?? null,
          (row as any).id,
          body.discountAmt ?? 0,
        ],
      );
      await execute(
        `UPDATE coupons SET used_count = used_count + 1 WHERE LOWER(code) = LOWER($1)`,
        [couponCode],
      );
    } catch (err) {
      console.error("Failed to record coupon usage:", err);
    }
  }

  return c.json(mapOrder(row!), 201);
});

orderRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  if (body.sizes !== undefined) body.sizes = JSON.stringify(body.sizes);
  if (body.timeline !== undefined)
    body.timeline = JSON.stringify(body.timeline);

  const id = c.req.param("id");
  const existing = await queryOne(
    "SELECT id, status, invoice_number, uploaded_logo FROM orders WHERE id = $1",
    [id],
  );
  if (!existing) return c.json({ error: "Order not found" }, 404);

  // --- Unique invoice number ---
  if (
    body.invoiceNumber !== undefined &&
    String(body.invoiceNumber).trim() !== ""
  ) {
    const clash = await queryOne(
      `SELECT id FROM orders
       WHERE invoice_number = $1 AND id <> $2
         AND invoice_number IS NOT NULL AND invoice_number <> ''`,
      [String(body.invoiceNumber).trim(), id],
    );
    if (clash) {
      return c.json(
        { error: "Invoice number already used on another order" },
        409,
      );
    }
  }

  // --- Cannot mark Delivered without invoice ---
  if (body.status === "Delivered") {
    const currentStatus = (existing as any).status;
    const invoiceNo =
      body.invoiceNumber !== undefined
        ? body.invoiceNumber
        : (existing as any).invoice_number;
    if (
      currentStatus === "Shipped" &&
      (!invoiceNo || String(invoiceNo).trim() === "")
    ) {
      return c.json(
        { error: "Cannot mark as Delivered. Please generate invoice first." },
        400,
      );
    }
  }
  // if (body.agentPayoutStatus !== undefined) {
  //   await execute(
  //     `UPDATE orders
  //      SET agent_payout_status = $1,
  //          agent_payout_at = CASE WHEN $1 = 'Paid' THEN now() ELSE NULL END,
  //          updated_at = now()
  //      WHERE id = $2`,
  //     [body.agentPayoutStatus, c.req.param("id")],
  //   );
  // }
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
    gstNumber: "gst_number",
    notes: "notes",
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
    invoiceNumber: "invoice_number",
    agentPayoutStatus: "agent_payout_status",
  });

  return c.json(mapOrder(row!));
});

orderRoutes.patch("/:id/agent-payout", async (c) => {
  const id = c.req.param("id");
  const body = await parseJsonBody<{ status?: string }>(c);
  const status = body.status === "Paid" ? "Paid" : "Pending";

  const existing = await queryOne(`SELECT id, type FROM orders WHERE id = $1`, [id]);
  if (!existing) return c.json({ error: "Order not found" }, 404);
  if (existing.type !== "Sales Agent") {
    return c.json({ error: "Only Sales Agent orders support agent payout" }, 400);
  }

  await execute(
    `UPDATE orders
     SET agent_payout_status = $1,
         agent_payout_at = CASE WHEN $1 = 'Paid' THEN now() ELSE NULL END,
         updated_at = now()
     WHERE id = $2`,
    [status, id],
  );

  const row = await queryOne(`SELECT * FROM orders WHERE id = $1`, [id]);
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
  const l = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50),
  );
  const offset = (p - 1) * l;
  params.push(l, offset);

  const rows = await query(
    `SELECT ${ORDER_LIST_COLUMNS}, count(*) OVER() as _total_count 
     FROM orders ${where} ORDER BY order_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapOrder),
    pagination: { page: p, limit: l, total: totalCount },
  });
});

sampleOrderRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await insertOrder(body, true);
  return c.json(mapOrder(row!), 201);
});
sampleOrderRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  if (body.timeline !== undefined)
    body.timeline = JSON.stringify(body.timeline);

  const id = c.req.param("id");
  const existing = await queryOne(
    "SELECT id, status, invoice_number FROM orders WHERE id = $1 AND is_sample = true",
    [id],
  );
  if (!existing) return c.json({ error: "Sample order not found" }, 404);

  // Unique invoice number
  if (
    body.invoiceNumber !== undefined &&
    String(body.invoiceNumber).trim() !== ""
  ) {
    const clash = await queryOne(
      `SELECT id FROM orders
       WHERE invoice_number = $1 AND id <> $2
         AND invoice_number IS NOT NULL AND invoice_number <> ''`,
      [String(body.invoiceNumber).trim(), id],
    );
    if (clash) {
      return c.json(
        { error: "Invoice number already used on another order" },
        409,
      );
    }
  }

  // Cannot mark Delivered without invoice
  if (body.status === "Delivered") {
    const currentStatus = (existing as any).status;
    const invoiceNo =
      body.invoiceNumber !== undefined
        ? body.invoiceNumber
        : (existing as any).invoice_number;
    if (
      currentStatus === "Shipped" &&
      (!invoiceNo || String(invoiceNo).trim() === "")
    ) {
      return c.json(
        { error: "Cannot mark as Delivered. Please generate invoice first." },
        400,
      );
    }
  }

  const row = await patchById("orders", id, body, {
    status: "status",
    paymentStatus: "payment_status",
    timeline: "timeline",
    invoiceNumber: "invoice_number",
    date: "order_date",
  });
  return c.json(mapOrder(row!));
});
