import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapProduct } from "../../lib/mappers.js";
import { deleteByIdWithImageCleanup, cleanupRemovedImagesOnPatch, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const productRoutes = new Hono();

productRoutes.get("/", async (c) => {
  const { status, category, type } = c.req.query();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
  if (type) { params.push(type); conditions.push(`type = $${params.length}`); }

  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;
  params.push(l, offset);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(
    `SELECT id, code, name, category, type, sub_category, material, description,overview,
            specifications, design_guidelines, wash_care,
            sample_price, original_price, status, image, images, stock, orders_count,
            rating, visibility, colors, created_at, count(*) OVER() as _total_count
     FROM products ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  c.header("Cache-Control", "public, max-age=60");
  return c.json({
    data: rows.map(mapProduct),
    pagination: { page: p, limit: l, total: totalCount }
  });
});

productRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM products WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Product not found" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(mapProduct(row));
});

productRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("PRD");

  await execute(
    `INSERT INTO products (
      id, code, name, category, type, sub_category, material, description, overview,
      specifications, design_guidelines, wash_care, sample_price, original_price, status,
      image, images, stock, orders_count, rating, visibility, colors, created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
    )`,
    [
      id,
      body.code ?? `ARX-${Date.now()}`,
      body.name ?? "Untitled Product",
      body.category ?? "Corporate Shirts",
      body.type ?? "Regular",
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
      body.stock ?? 0,
      body.orders ?? 0,
      body.rating ?? 0,
      body.visibility ?? "Both",
      JSON.stringify(body.colors ?? []),
      body.createdAt ? `${body.createdAt}T00:00:00.000Z` : new Date().toISOString(),
    ],
  );

  const row = await queryOne("SELECT * FROM products WHERE id = $1", [id]);
  return c.json(mapProduct(row!), 201);
});

productRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);

  const id = c.req.param("id");
  const existing = await queryOne("SELECT id, image, images FROM products WHERE id = $1", [id]);
  if (!existing) return c.json({ error: "Product not found" }, 404);

  // IMPORTANT: run cleanup BEFORE stringifying body.images/body.colors/etc.
  // cleanupRemovedImagesOnPatch needs body.images as a real array to diff
  // correctly against the existing row — stringifying it first makes every
  // image look "removed" and wipes the whole R2 folder for this product.
  await cleanupRemovedImagesOnPatch(existing as Record<string, unknown>, body);

  if (body.specifications !== undefined) body.specifications = JSON.stringify(body.specifications);
  if (body.designGuidelines !== undefined) body.designGuidelines = JSON.stringify(body.designGuidelines);
  if (body.washCare !== undefined) body.washCare = JSON.stringify(body.washCare);
  if (body.images !== undefined) body.images = JSON.stringify(body.images);
  if (body.colors !== undefined) body.colors = JSON.stringify(body.colors);

  const row = await patchById("products", id, body, {
    code: "code",
    name: "name",
    category: "category",
    type: "type",
    subCategory: "sub_category",
    material: "material",
    description: "description",
    overview: "overview",
    specifications: "specifications",
    designGuidelines: "design_guidelines",
    washCare: "wash_care",
    samplePrice: "sample_price",
    originalPrice: "original_price",
    status: "status",
    image: "image",
    images: "images",
    stock: "stock",
    orders: "orders_count",
    rating: "rating",
    visibility: "visibility",
    colors: "colors",
  });

  return c.json(mapProduct(row!));
});

productRoutes.delete("/:id", async (c) => {
  await deleteByIdWithImageCleanup("products", c.req.param("id"));
  return c.json({ ok: true });
});