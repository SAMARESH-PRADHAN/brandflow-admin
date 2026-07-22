import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapNewCollectionProduct } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const newCollectionRoutes = new Hono();

newCollectionRoutes.get("/", async (c) => {
  const rows = await query("SELECT * FROM new_collection_products ORDER BY created_at DESC");
  return c.json(rows.map(mapNewCollectionProduct));
});

newCollectionRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM new_collection_products WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Product not found" }, 404);
  return c.json(mapNewCollectionProduct(row));
});

newCollectionRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("NEW");

  await execute(
    `INSERT INTO new_collection_products (
      id, code, name, material, description, overview,
      specifications, design_guidelines, wash_care, sample_price, original_price,
      status, image, images, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      id,
      body.code ?? `ARXN-${Date.now()}`,
      body.name ?? "Untitled Collection Item",
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

  const row = await queryOne("SELECT * FROM new_collection_products WHERE id = $1", [id]);
  return c.json(mapNewCollectionProduct(row!), 201);
});

newCollectionRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  await patchById("new_collection_products", c.req.param("id"), body, {
    code: "code",
    name: "name",
    material: "material",
    description: "description",
    overview: "overview",
    samplePrice: "sample_price",
    originalPrice: "original_price",
    status: "status",
    image: "image",
  });
  const id = c.req.param("id");
  for (const [field, column] of [
    ["specifications", "specifications"],
    ["designGuidelines", "design_guidelines"],
    ["washCare", "wash_care"],
    ["images", "images"],
  ] as const) {
    if (body[field] !== undefined) {
      await execute(`UPDATE new_collection_products SET ${column} = $1::jsonb WHERE id = $2`, [
        JSON.stringify(body[field]),
        id,
      ]);
    }
  }
  const row = await queryOne("SELECT * FROM new_collection_products WHERE id = $1", [id]);
  return c.json(mapNewCollectionProduct(row!));
});

newCollectionRoutes.delete("/:id", async (c) => {
  await deleteById("new_collection_products", c.req.param("id"));
  return c.json({ ok: true });
});
