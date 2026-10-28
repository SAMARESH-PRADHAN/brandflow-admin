import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { newId, parseJsonBody } from "../../lib/http.js";
import { mapCoupon, mapCouponUsage } from "../../lib/mappers.js";

export const couponRoutes = new Hono();

// ── List all coupons (admin) ──────────────────────────────────────────────
couponRoutes.get("/", async (c) => {
  const rows = await query(
    `SELECT * FROM coupons ORDER BY created_at DESC`,
  );
  return c.json(rows.map(mapCoupon));
});

// ── Create coupon (admin) ─────────────────────────────────────────────────
couponRoutes.post("/", async (c) => {
  const body = await parseJsonBody<{
    code: string;
    name: string;
    discountType: "fixed" | "percent";
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number | null;
    startsAt?: string;
    expiresAt?: string | null;
    isActive?: boolean;
    createdBy?: string;
  }>(c);

  if (!body.code?.trim()) return c.json({ error: "code is required" }, 400);
  if (!body.name?.trim()) return c.json({ error: "name is required" }, 400);
  if (!["fixed", "percent"].includes(body.discountType)) {
    return c.json({ error: "discountType must be fixed or percent" }, 400);
  }
  if (!body.discountValue || body.discountValue <= 0) {
    return c.json({ error: "discountValue must be > 0" }, 400);
  }
  if (body.discountType === "percent" && body.discountValue > 100) {
    return c.json({ error: "percent discount cannot exceed 100" }, 400);
  }

  const code = body.code.trim().toUpperCase();

  const existing = await queryOne(
    `SELECT id FROM coupons WHERE LOWER(code) = LOWER($1)`,
    [code],
  );
  if (existing) return c.json({ error: "Coupon code already exists" }, 409);

  const id = newId("CPN");
  await execute(
    `INSERT INTO coupons (
      id, code, name, discount_type, discount_value,
      min_order_amount, max_uses, starts_at, expires_at,
      is_active, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      id,
      code,
      body.name.trim(),
      body.discountType,
      body.discountValue,
      body.minOrderAmount ?? 0,
      body.maxUses ?? null,
      body.startsAt ? new Date(body.startsAt) : new Date(),
      body.expiresAt ? new Date(body.expiresAt) : null,
      body.isActive ?? true,
      body.createdBy ?? null,
    ],
  );

  const row = await queryOne(`SELECT * FROM coupons WHERE id = $1`, [id]);
  return c.json(mapCoupon(row!), 201);
});

// ── Update coupon (admin) ─────────────────────────────────────────────────
couponRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await parseJsonBody<Record<string, unknown>>(c);

  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const map: Record<string, string> = {
    name: "name",
    discountType: "discount_type",
    discountValue: "discount_value",
    minOrderAmount: "min_order_amount",
    maxUses: "max_uses",
    startsAt: "starts_at",
    expiresAt: "expires_at",
    isActive: "is_active",
  };

  for (const [key, col] of Object.entries(map)) {
    if (body[key] === undefined) continue;
    sets.push(`${col} = $${i++}`);
    vals.push(body[key]);
  }

  if (sets.length === 0) return c.json({ error: "Nothing to update" }, 400);

  vals.push(id);
  const row = await queryOne(
    `UPDATE coupons SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    vals,
  );
  if (!row) return c.json({ error: "Coupon not found" }, 404);
  return c.json(mapCoupon(row));
});

// ── Delete coupon (admin) ─────────────────────────────────────────────────
couponRoutes.delete("/:id", async (c) => {
  const count = await execute(`DELETE FROM coupons WHERE id = $1`, [
    c.req.param("id"),
  ]);
  if (count === 0) return c.json({ error: "Coupon not found" }, 404);
  return c.json({ ok: true });
});

// ── List usages for one coupon (admin) ────────────────────────────────────
couponRoutes.get("/:id/usages", async (c) => {
  const rows = await query(
    `SELECT * FROM coupon_usages WHERE coupon_id = $1 ORDER BY used_at DESC`,
    [c.req.param("id")],
  );
  return c.json(rows.map(mapCouponUsage));
});

// ── Validate coupon (public – used by ecommerce) ──────────────────────────
couponRoutes.post("/validate", async (c) => {
  const body = await parseJsonBody<{
    code: string;
    cartTotal: number;
  }>(c);

  if (!body.code?.trim()) {
    return c.json({ valid: false, message: "Please enter a coupon code" }, 400);
  }

  const code = body.code.trim().toUpperCase();
  const cartTotal = Number(body.cartTotal) || 0;

  const row = await queryOne(
    `SELECT * FROM coupons WHERE LOWER(code) = LOWER($1)`,
    [code],
  );

  if (!row) {
    return c.json({ valid: false, message: "Invalid coupon code" });
  }

  const coupon = mapCoupon(row);

  if (!coupon.isActive) {
    return c.json({ valid: false, message: "This coupon is inactive" });
  }

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return c.json({ valid: false, message: "This coupon is not yet active" });
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return c.json({ valid: false, message: "This coupon has expired" });
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return c.json({ valid: false, message: "This coupon has reached its usage limit" });
  }

  if (cartTotal < coupon.minOrderAmount) {
    return c.json({
      valid: false,
      message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
    });
  }

  let discountAmount = 0;
  if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  } else {
    discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
  }

  return c.json({
    valid: true,
    discountAmount,
    coupon,
  });
});

// ── Record usage (called when order is placed) ────────────────────────────
couponRoutes.post("/apply", async (c) => {
  const body = await parseJsonBody<{
    code: string;
    customerId?: string | null;
    customerName?: string;
    customerEmail?: string;
    orderId?: string;
    discountAmount: number;
  }>(c);

  const code = (body.code || "").trim().toUpperCase();
  if (!code) return c.json({ error: "code is required" }, 400);

  const row = await queryOne(
    `SELECT * FROM coupons WHERE LOWER(code) = LOWER($1)`,
    [code],
  );
  if (!row) return c.json({ error: "Coupon not found" }, 404);

  const usageId = newId("CU");
  await execute(
    `INSERT INTO coupon_usages (
      id, coupon_id, coupon_code, customer_id, customer_name,
      customer_email, order_id, discount_amount
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      usageId,
      row.id,
      code,
      body.customerId ?? null,
      body.customerName ?? null,
      body.customerEmail ?? null,
      body.orderId ?? null,
      body.discountAmount ?? 0,
    ],
  );

  await execute(
    `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
    [row.id],
  );

  return c.json({ ok: true, usageId });
});