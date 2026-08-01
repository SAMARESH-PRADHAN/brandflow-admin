import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapB2BProduct } from "../../lib/mappers.js";
import { deleteByIdWithImageCleanup, cleanupRemovedImagesOnPatch, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const b2bProductRoutes = new Hono();

b2bProductRoutes.get("/", async (c) => {
  const rows = await query(
    `SELECT id, code, name, sub_category, material, description,overview,
            specifications, design_guidelines, wash_care,
            sample_price, original_price, status, image, images, created_at
     FROM b2b_products ORDER BY created_at DESC`,
  );
  c.header("Cache-Control", "public, max-age=60");
  return c.json(rows.map(mapB2BProduct));
});

b2bProductRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM b2b_products WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "B2B product not found" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(mapB2BProduct(row));
});

b2bProductRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("B2B");

  await execute(
    `INSERT INTO b2b_products (
      id, code, name, sub_category, material, description, overview,
      specifications, design_guidelines, wash_care, sample_price, original_price,
      status, image, images, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      id,
      body.code ?? `ARXB-${Date.now()}`,
      body.name ?? "Untitled B2B Product",
      body.subCategory ?? "",
      body.material ?? "",
      body.description ?? "",
      body.overview ?? null,
      JSON.stringify(body.specifications ?? []),
      JSON.stringify(body.designGuidelines ?? []),
      JSON.stringify(body.washCare ?? []),
      body.samplePrice ?? 0,
      body.originalPrice ?? 0,
      body.status ?? "Active",
      body.image ?? "",
      JSON.stringify(body.images ?? []),
      body.createdAt ? `${body.createdAt}T00:00:00.000Z` : new Date().toISOString(),
    ],
  );

  const row = await queryOne("SELECT * FROM b2b_products WHERE id = $1", [id]);
  return c.json(mapB2BProduct(row!), 201);
});

b2bProductRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  if (body.specifications !== undefined) body.specifications = JSON.stringify(body.specifications);
  if (body.designGuidelines !== undefined) body.designGuidelines = JSON.stringify(body.designGuidelines);
  if (body.washCare !== undefined) body.washCare = JSON.stringify(body.washCare);
  if (body.images !== undefined) body.images = JSON.stringify(body.images);

  const id = c.req.param("id");
  const existing = await queryOne("SELECT id, image, images FROM b2b_products WHERE id = $1", [id]);
  if (!existing) return c.json({ error: "B2B product not found" }, 404);

  await cleanupRemovedImagesOnPatch(existing as Record<string, unknown>, body);

  const row = await patchById("b2b_products", id, body, {
    code: "code",
    name: "name",
    subCategory: "sub_category",
    material: "material",
    description: "description",
    overview: "overview",
    samplePrice: "sample_price",
    originalPrice: "original_price",
    status: "status",
    image: "image",
    specifications: "specifications",
    designGuidelines: "design_guidelines",
    washCare: "wash_care",
    images: "images",
  });
  
  return c.json(mapB2BProduct(row!));
});

b2bProductRoutes.delete("/:id", async (c) => {
  await deleteByIdWithImageCleanup("b2b_products", c.req.param("id"));
  return c.json({ ok: true });
});
