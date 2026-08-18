import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { newId, parseJsonBody } from "../../lib/http.js";
import { mapDiscountTier } from "../../lib/mappers.js";

export const discountTierRoutes = new Hono();

discountTierRoutes.get("/", async (c) => {
  const rows = await query(
    "SELECT * FROM discount_tiers ORDER BY category, sub_category NULLS FIRST, min_qty",
  );
  c.header("Cache-Control", "public, max-age=30");
  return c.json(rows.map(mapDiscountTier));
});

// Replace the full tier list for one (category, subCategory) bucket in one call —
// simplest contract for an admin UI that edits a whole list of rows at once.
discountTierRoutes.put("/", async (c) => {
  const body = await parseJsonBody<{
    category: string;
    subCategory?: string | null;
    tiers: Array<{ minQty: number; maxQty: number | null; discountPct: number; isBulk?: boolean }>;
  }>(c);

  if (!body.category?.trim() || !Array.isArray(body.tiers)) {
    return c.json({ error: "category and tiers[] are required" }, 400);
  }
  for (const t of body.tiers) {
    if (t.minQty == null || t.minQty < 1) {
      return c.json({ error: "Each tier needs minQty >= 1" }, 400);
    }
    if (t.maxQty != null && t.maxQty < t.minQty) {
      return c.json({ error: "maxQty must be >= minQty" }, 400);
    }
    if (t.discountPct == null || t.discountPct < 0 || t.discountPct > 100) {
      return c.json({ error: "discountPct must be between 0 and 100" }, 400);
    }
  }

  const sub = body.subCategory?.trim() || null;

  await execute(
    "DELETE FROM discount_tiers WHERE category = $1 AND COALESCE(sub_category, '') = COALESCE($2, '')",
    [body.category, sub],
  );

  for (const t of body.tiers) {
    await execute(
      `INSERT INTO discount_tiers (id, category, sub_category, min_qty, max_qty, discount_pct, is_bulk)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [newId("DTR"), body.category, sub, t.minQty, t.maxQty, t.discountPct, t.isBulk ?? false],
    );
  }

  const rows = await query(
    "SELECT * FROM discount_tiers WHERE category = $1 AND COALESCE(sub_category, '') = COALESCE($2, '') ORDER BY min_qty",
    [body.category, sub],
  );
  return c.json(rows.map(mapDiscountTier));
});

discountTierRoutes.delete("/:id", async (c) => {
  await execute("DELETE FROM discount_tiers WHERE id = $1", [c.req.param("id")]);
  return c.json({ ok: true });
});