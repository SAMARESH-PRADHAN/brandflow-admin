import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { newId, parseJsonBody } from "../../lib/http.js";
import { mapPrintSetting } from "../../lib/mappers.js";

export const printSettingsRoutes = new Hono();

type PrintConfig = {
  kind: "none" | "free" | "custom";
  label?: string;
  methods?: Array<{
    id: string;
    label: string;
    note?: string;
    options: Array<{ id: string; label: string; pricePerPc: number }>;
  }>;
};

function isValidConfig(cfg: unknown): cfg is PrintConfig {
  if (!cfg || typeof cfg !== "object") return false;
  const c = cfg as PrintConfig;
  if (!["none", "free", "custom"].includes(c.kind)) return false;
  if (c.kind === "free" && typeof c.label !== "string") return false;
  if (c.kind === "custom") {
    if (!Array.isArray(c.methods)) return false;
    for (const m of c.methods) {
      if (!m?.id || !m?.label || !Array.isArray(m.options)) return false;
      for (const o of m.options) {
        if (!o?.id || !o?.label || typeof o.pricePerPc !== "number") return false;
      }
    }
  }
  return true;
}

printSettingsRoutes.get("/", async (c) => {
  const rows = await query(
    `SELECT * FROM print_settings
     ORDER BY category, product_type NULLS FIRST, sub_category NULLS FIRST`,
  );
  c.header("Cache-Control", "public, max-age=30");
  return c.json(rows.map(mapPrintSetting));
});

printSettingsRoutes.put("/", async (c) => {
  const body = await parseJsonBody<{
    category: string;
    productType?: string | null;
    subCategory?: string | null;
    config: PrintConfig;
  }>(c);

  if (!body.category?.trim()) {
    return c.json({ error: "category is required" }, 400);
  }
  if (!isValidConfig(body.config)) {
    return c.json({ error: "invalid print config" }, 400);
  }

  const productType = body.productType?.trim() || null;
  const sub = body.subCategory?.trim() || null;

  if (productType && !["Regular", "Premium"].includes(productType)) {
    return c.json({ error: "productType must be Regular, Premium, or null" }, 400);
  }

  const existing = await queryOne(
    `SELECT id FROM print_settings
     WHERE category = $1
       AND COALESCE(product_type, '') = COALESCE($2, '')
       AND COALESCE(sub_category, '') = COALESCE($3, '')`,
    [body.category, productType, sub],
  );

  if (existing) {
    await execute("UPDATE print_settings SET config = $1 WHERE id = $2", [
      JSON.stringify(body.config),
      (existing as any).id,
    ]);
    const row = await queryOne("SELECT * FROM print_settings WHERE id = $1", [
      (existing as any).id,
    ]);
    return c.json(mapPrintSetting(row!));
  }

  const id = newId("PRINT");
  await execute(
    `INSERT INTO print_settings (id, category, product_type, sub_category, config)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, body.category, productType, sub, JSON.stringify(body.config)],
  );
  const row = await queryOne("SELECT * FROM print_settings WHERE id = $1", [id]);
  return c.json(mapPrintSetting(row!), 201);
});

printSettingsRoutes.delete("/:id", async (c) => {
  await execute("DELETE FROM print_settings WHERE id = $1", [c.req.param("id")]);
  return c.json({ ok: true });
});