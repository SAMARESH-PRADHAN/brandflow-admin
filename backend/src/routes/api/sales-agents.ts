import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { randomBytes } from "node:crypto";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapSalesAgent, mapSalesAgentProductPrice, mapProduct, mapOrder } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";
import { rateLimit } from "../../middleware/rate-limit.js";

export const salesAgentRoutes = new Hono();

function generateShareToken() {
  return randomBytes(16).toString("hex"); // 32-char public token
}

function generateAgentCode() {
  // Private login code, e.g. ARX-SA1731...
  return `ARX-SA${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Admin: list / get / create / update / delete sales agents
// ---------------------------------------------------------------------------

salesAgentRoutes.get("/", async (c) => {
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;
  const status = c.req.query("status");

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  params.push(l, offset);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT *, count(*) OVER() as _total_count
     FROM sales_agents ${where}
     ORDER BY join_date DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapSalesAgent),
    pagination: { page: p, limit: l, total: totalCount },
  });
});

salesAgentRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM sales_agents WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Sales agent not found" }, 404);
  return c.json(mapSalesAgent(row));
});

salesAgentRoutes.post("/", rateLimit(10, 60000), async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("SAG");
  const code = (body.code as string)?.trim() || generateAgentCode();
  const shareToken = (body.shareToken as string)?.trim() || generateShareToken();

  // Ensure uniqueness (code / share_token)
  const existingCode = await queryOne(
    `SELECT id FROM sales_agents WHERE LOWER(code) = LOWER($1)`,
    [code],
  );
  if (existingCode) {
    throw new HTTPException(409, { message: "Agent code already exists" });
  }

  await execute(
    `INSERT INTO sales_agents (id, code, share_token, name, phone, email, address, status, join_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      code,
      shareToken,
      body.name ?? "New Sales Agent",
      body.phone ?? "",
      body.email ?? "",
      body.address ?? "",
      body.status ?? "Active",
      body.joinDate ?? new Date().toISOString().slice(0, 10),
    ],
  );

  const row = await queryOne("SELECT * FROM sales_agents WHERE id = $1", [id]);
  return c.json(mapSalesAgent(row!), 201);
});

salesAgentRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);

  // Do not allow changing shareToken / code casually via generic patch keys
  // unless explicitly provided; still map them if present.
  if (body.code !== undefined) {
    const conflict = await queryOne(
      `SELECT id FROM sales_agents WHERE LOWER(code) = LOWER($1) AND id <> $2`,
      [body.code, c.req.param("id")],
    );
    if (conflict) throw new HTTPException(409, { message: "Agent code already exists" });
  }

  await patchById("sales_agents", c.req.param("id"), body, {
    code: "code",
    shareToken: "share_token",
    name: "name",
    phone: "phone",
    email: "email",
    address: "address",
    status: "status",
    joinDate: "join_date",
    payoutStatus: "payout_status",
  });

   if (body.payoutStatus !== undefined) {
    await execute(
      `UPDATE sales_agents
       SET payout_status = $1, payout_updated_at = now(), updated_at = now()
       WHERE id = $2`,
      [body.payoutStatus, c.req.param("id")],
    );
  }

  // Touch updated_at
  await execute(`UPDATE sales_agents SET updated_at = now() WHERE id = $1`, [c.req.param("id")]);
  const refreshed = await queryOne("SELECT * FROM sales_agents WHERE id = $1", [c.req.param("id")]);
  return c.json(mapSalesAgent(refreshed!));
});

salesAgentRoutes.delete("/:id", async (c) => {
  // Safe delete: CASCADE removes product prices; orders keep history via ON DELETE SET NULL
  await deleteById("sales_agents", c.req.param("id"));
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Login by Agent Code (private) — separate from B2B
// ---------------------------------------------------------------------------

salesAgentRoutes.post("/login", rateLimit(10, 60000), async (c) => {
  const body = await parseJsonBody<{ code?: string }>(c);
  const code = body.code?.trim();
  if (!code) throw new HTTPException(400, { message: "Agent code is required" });

  const row = await queryOne(
    `SELECT * FROM sales_agents WHERE LOWER(code) = LOWER($1)`,
    [code],
  );
  if (!row) throw new HTTPException(401, { message: "Invalid agent code" });
  if (row.status !== "Active") throw new HTTPException(403, { message: "Agent is inactive" });

  // Simple session payload for frontend (no JWT required yet; frontend stores agent id + code)
  return c.json({
    agent: mapSalesAgent(row),
    message: "Login successful",
  });
});

// ---------------------------------------------------------------------------
// Dashboard stats for one agent
// ---------------------------------------------------------------------------

salesAgentRoutes.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const agent = await queryOne("SELECT * FROM sales_agents WHERE id = $1", [id]);
  if (!agent) return c.json({ error: "Sales agent not found" }, 404);

    const stats = await queryOne<{
    total_orders: string;
    total_customers: string;
    total_sales: string;
    total_earnings: string;
    total_platform_earnings: string;
    total_margin: string;
    total_received: string;
    total_pending: string;
  }>(
    `SELECT
  COUNT(*)::text AS total_orders,
  COUNT(DISTINCT NULLIF(customer_id, ''))::text AS total_customers,
  COALESCE(SUM(total_amount), 0)::text AS total_sales,
  COALESCE(SUM(agent_earning), 0)::text AS total_earnings,
  COALESCE(SUM(platform_earning), 0)::text AS total_platform_earnings,
  COALESCE(SUM(COALESCE(agent_earning,0) + COALESCE(platform_earning,0)), 0)::text AS total_margin,
  COALESCE(SUM(CASE WHEN agent_payout_status = 'Paid' THEN agent_earning ELSE 0 END), 0)::text AS total_received,
  COALESCE(SUM(CASE WHEN COALESCE(agent_payout_status, 'Pending') = 'Pending' THEN agent_earning ELSE 0 END), 0)::text AS total_pending
FROM orders
WHERE sales_agent_id = $1 AND type = 'Sales Agent'`,
    [id],
  );

  const pricedProducts = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM sales_agent_product_prices WHERE sales_agent_id = $1`,
    [id],
  );

  return c.json({
    agent: mapSalesAgent(agent),
    totalOrders: Number(stats?.total_orders ?? 0),
    totalCustomers: Number(stats?.total_customers ?? 0),
    totalSales: Number(stats?.total_sales ?? 0),
    totalEarnings: Number(stats?.total_earnings ?? 0),
    pricedProductCount: Number(pricedProducts?.count ?? 0),
    totalPlatformEarnings: Number(stats?.total_platform_earnings ?? 0),
totalMargin: Number(stats?.total_margin ?? 0),
totalReceived: Number(stats?.total_received ?? 0),
totalPending: Number(stats?.total_pending ?? 0),
  });
});

// ---------------------------------------------------------------------------
// Agent orders (order-wise earnings)
// ---------------------------------------------------------------------------

salesAgentRoutes.get("/:id/orders", async (c) => {
  const id = c.req.param("id");
  const agent = await queryOne("SELECT id FROM sales_agents WHERE id = $1", [id]);
  if (!agent) return c.json({ error: "Sales agent not found" }, 404);

  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;

  const rows = await query(
    `SELECT *, count(*) OVER() as _total_count
     FROM orders
     WHERE sales_agent_id = $1 AND type = 'Sales Agent'
     ORDER BY order_date DESC, created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, l, offset],
  );

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapOrder),
    pagination: { page: p, limit: l, total: totalCount },
  });
});

// ---------------------------------------------------------------------------
// Product listing with agent prices (for agent panel)
// ---------------------------------------------------------------------------

const PRODUCT_LIST_COLS = `
  p.id, p.code, p.name, p.category, p.type, p.sub_category, p.material, p.description,
  p.sample_price, p.original_price, p.status, p.image, p.images, p.stock, p.orders_count,
  p.rating, p.visibility, p.colors, p.kit_items, p.created_at
`;

salesAgentRoutes.get("/:id/products", async (c) => {
  const id = c.req.param("id");
  const agent = await queryOne("SELECT id, status FROM sales_agents WHERE id = $1", [id]);
  if (!agent) return c.json({ error: "Sales agent not found" }, 404);

  const { category, type, subCategory, status } = c.req.query();
  const conditions: string[] = [`p.status = 'Active'`]; // storefront-active only by default
  const params: unknown[] = [id];

  if (status) {
    // allow override e.g. status=Active already default
    params.push(status);
    conditions[0] = `p.status = $${params.length}`;
  }
  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`p.type = $${params.length}`);
  }
  if (subCategory) {
    params.push(subCategory);
    conditions.push(`p.sub_category = $${params.length}`);
  }

  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(500, Math.max(1, parseInt(c.req.query("limit") ?? "300") || 300));
  const offset = (p - 1) * l;
  params.push(l, offset);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT ${PRODUCT_LIST_COLS},
            sapp.agent_price,
            count(*) OVER() as _total_count
     FROM products p
     LEFT JOIN sales_agent_product_prices sapp
       ON sapp.product_id = p.id AND sapp.sales_agent_id = $1
     ${where}
     ORDER BY p.category, p.type, p.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));

  const data = rows.map((row) => {
    const product = mapProduct(row);
    const original = product.originalPrice;
    const agentPrice =
      row.agent_price !== null && row.agent_price !== undefined
        ? Number(row.agent_price)
        : original;
    return {
      ...product,
      originalPrice: original,
      agentPrice,
      earningPerUnit: Math.max(0, agentPrice - original),
      hasCustomPrice: row.agent_price !== null && row.agent_price !== undefined,
    };
  });

  return c.json({
    data,
    pagination: { page: p, limit: l, total: totalCount },
  });
});

// ---------------------------------------------------------------------------
// Set / update agent product price (backend enforces >= original_price)
// ---------------------------------------------------------------------------

salesAgentRoutes.put("/:id/products/:productId/price", async (c) => {
  const salesAgentId = c.req.param("id");
  const productId = c.req.param("productId");
  const body = await parseJsonBody<{ agentPrice?: number }>(c);

  const agent = await queryOne("SELECT id, status FROM sales_agents WHERE id = $1", [salesAgentId]);
  if (!agent) return c.json({ error: "Sales agent not found" }, 404);
  if (agent.status !== "Active") throw new HTTPException(403, { message: "Agent is inactive" });

  const product = await queryOne(
    `SELECT id, original_price, status FROM products WHERE id = $1`,
    [productId],
  );
  if (!product) return c.json({ error: "Product not found" }, 404);

  const originalPrice = Number(product.original_price ?? 0);
  const agentPrice = Number(body.agentPrice);
const MAX_EXTRA = 100;

  if (!Number.isFinite(agentPrice) || agentPrice < 0) {
    throw new HTTPException(400, { message: "Invalid agent price" });
  }
  // CRITICAL: never allow price below Arrheniux normal price
  if (agentPrice < originalPrice) {
    throw new HTTPException(400, {
      message: `Agent price cannot be below the normal Arrheniux price (₹${originalPrice})`,
    });
  }
if (agentPrice > originalPrice + MAX_EXTRA) {
    throw new HTTPException(400, {
      message: `Agent price cannot exceed MRP + ₹${MAX_EXTRA} (max ₹${originalPrice + MAX_EXTRA})`,
    });
  }
  const existing = await queryOne(
    `SELECT id FROM sales_agent_product_prices
     WHERE sales_agent_id = $1 AND product_id = $2`,
    [salesAgentId, productId],
  );

  if (existing) {
    await execute(
      `UPDATE sales_agent_product_prices
       SET agent_price = $1, updated_at = now()
       WHERE id = $2`,
      [agentPrice, existing.id],
    );
  } else {
    await execute(
      `INSERT INTO sales_agent_product_prices (id, sales_agent_id, product_id, agent_price)
       VALUES ($1, $2, $3, $4)`,
      [newId("SAP"), salesAgentId, productId, agentPrice],
    );
  }

  const row = await queryOne(
    `SELECT sapp.*, p.code AS product_code, p.name AS product_name,
            p.original_price, p.image, p.category, p.type, p.sub_category
     FROM sales_agent_product_prices sapp
     JOIN products p ON p.id = sapp.product_id
     WHERE sapp.sales_agent_id = $1 AND sapp.product_id = $2`,
    [salesAgentId, productId],
  );

  return c.json(mapSalesAgentProductPrice(row!));
});

// Optional: reset to normal price (delete override)
salesAgentRoutes.delete("/:id/products/:productId/price", async (c) => {
  const salesAgentId = c.req.param("id");
  const productId = c.req.param("productId");

  await execute(
    `DELETE FROM sales_agent_product_prices
     WHERE sales_agent_id = $1 AND product_id = $2`,
    [salesAgentId, productId],
  );
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Public storefront by share token (no login)
// GET /api/sales-agents/public/:shareToken
// GET /api/sales-agents/public/:shareToken/products
// ---------------------------------------------------------------------------

salesAgentRoutes.get("/public/:shareToken", async (c) => {
  const shareToken = c.req.param("shareToken");
  const row = await queryOne(
    `SELECT * FROM sales_agents WHERE share_token = $1 AND status = 'Active'`,
    [shareToken],
  );
  if (!row) return c.json({ error: "Store not found or inactive" }, 404);

  // Never expose private code in public endpoint
  const agent = mapSalesAgent(row);
  return c.json({
    id: agent.id,
    name: agent.name,
    shareToken: agent.shareToken,
    status: agent.status,
  });
});

salesAgentRoutes.get("/public/:shareToken/products", async (c) => {
  const shareToken = c.req.param("shareToken");
  const agent = await queryOne(
    `SELECT id FROM sales_agents WHERE share_token = $1 AND status = 'Active'`,
    [shareToken],
  );
  if (!agent) return c.json({ error: "Store not found or inactive" }, 404);

  const { category, type, subCategory } = c.req.query();
  const conditions: string[] = [`p.status = 'Active'`];
  const params: unknown[] = [agent.id];

  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`p.type = $${params.length}`);
  }
  if (subCategory) {
    params.push(subCategory);
    conditions.push(`p.sub_category = $${params.length}`);
  }

  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(500, Math.max(1, parseInt(c.req.query("limit") ?? "300") || 300));
  const offset = (p - 1) * l;
  params.push(l, offset);

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await query(
    `SELECT ${PRODUCT_LIST_COLS},
            sapp.agent_price,
            count(*) OVER() as _total_count
     FROM products p
     LEFT JOIN sales_agent_product_prices sapp
       ON sapp.product_id = p.id AND sapp.sales_agent_id = $1
     ${where}
     ORDER BY p.category, p.type, p.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));

  const data = rows.map((row) => {
    const product = mapProduct(row);
    const original = product.originalPrice;
    const sellPrice =
      row.agent_price !== null && row.agent_price !== undefined
        ? Number(row.agent_price)
        : original;
    return {
      ...product,
      // For storefront, expose the price the customer should see as originalPrice
      // while keeping base for reference if needed later
      originalPrice: sellPrice,
      basePrice: original,
      agentPrice: sellPrice,
    };
  });

  return c.json({
    data,
    pagination: { page: p, limit: l, total: totalCount },
    salesAgentId: agent.id,
  });
});