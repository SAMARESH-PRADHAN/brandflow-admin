import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapProduct } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const productRoutes = new Hono();

productRoutes.get("/", async (c) => {
  const { status, category, type } = c.req.query();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
  if (type) { params.push(type); conditions.push(`type = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(
    `SELECT id, code, name, category, type, sub_category, material, description,
            sample_price, original_price, status, image, images, stock, orders_count,
            rating, visibility, colors, created_at
     FROM products ${where} ORDER BY created_at DESC`,
    params,
  );
  return c.json(rows.map(mapProduct));
});

productRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM products WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Product not found" }, 404);
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
  const row = await patchById("products", c.req.param("id"), body, {
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

  if (body.specifications !== undefined) {
    await execute("UPDATE products SET specifications = $1::jsonb WHERE id = $2", [
      JSON.stringify(body.specifications),
      c.req.param("id"),
    ]);
  }
  if (body.designGuidelines !== undefined) {
    await execute("UPDATE products SET design_guidelines = $1::jsonb WHERE id = $2", [
      JSON.stringify(body.designGuidelines),
      c.req.param("id"),
    ]);
  }
  if (body.washCare !== undefined) {
    await execute("UPDATE products SET wash_care = $1::jsonb WHERE id = $2", [
      JSON.stringify(body.washCare),
      c.req.param("id"),
    ]);
  }
  if (body.images !== undefined) {
    await execute("UPDATE products SET images = $1::jsonb WHERE id = $2", [
      JSON.stringify(body.images),
      c.req.param("id"),
    ]);
  }
  if (body.colors !== undefined) {
    await execute("UPDATE products SET colors = $1::jsonb WHERE id = $2", [
      JSON.stringify(body.colors),
      c.req.param("id"),
    ]);
  }

  const updated = await queryOne("SELECT * FROM products WHERE id = $1", [c.req.param("id")]);
  return c.json(mapProduct(updated ?? row!));
});

productRoutes.delete("/:id", async (c) => {
  await deleteById("products", c.req.param("id"));
  return c.json({ ok: true });
});
