import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { newId, parseJsonBody } from "../../lib/http.js";
import { mapMoqSetting } from "../../lib/mappers.js";

export const moqSettingsRoutes = new Hono();

moqSettingsRoutes.get("/", async (c) => {
  const rows = await query("SELECT * FROM moq_settings ORDER BY category, sub_category NULLS FIRST");
  c.header("Cache-Control", "public, max-age=30");
  return c.json(rows.map(mapMoqSetting));
});

// Upsert: one call handles both "create" and "update" since (category, sub_category) is unique.
moqSettingsRoutes.put("/", async (c) => {
  const body = await parseJsonBody<{ category: string; subCategory?: string | null; minQty: number }>(c);
  if (!body.category?.trim() || body.minQty == null || body.minQty < 1) {
    return c.json({ error: "category and a minQty >= 1 are required" }, 400);
  }
  const sub = body.subCategory?.trim() || null;

  const existing = await queryOne(
    "SELECT id FROM moq_settings WHERE category = $1 AND COALESCE(sub_category, '') = COALESCE($2, '')",
    [body.category, sub],
  );

  if (existing) {
    await execute("UPDATE moq_settings SET min_qty = $1 WHERE id = $2", [body.minQty, (existing as any).id]);
    const row = await queryOne("SELECT * FROM moq_settings WHERE id = $1", [(existing as any).id]);
    return c.json(mapMoqSetting(row!));
  }

  const id = newId("MOQ");
  await execute(
    "INSERT INTO moq_settings (id, category, sub_category, min_qty) VALUES ($1,$2,$3,$4)",
    [id, body.category, sub, body.minQty],
  );
  const row = await queryOne("SELECT * FROM moq_settings WHERE id = $1", [id]);
  return c.json(mapMoqSetting(row!), 201);
});

// Optional: delete an override to fall back to the category default.
moqSettingsRoutes.delete("/:id", async (c) => {
  await execute("DELETE FROM moq_settings WHERE id = $1", [c.req.param("id")]);
  return c.json({ ok: true });
});