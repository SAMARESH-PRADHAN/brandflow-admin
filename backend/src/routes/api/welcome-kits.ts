import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapWelcomeKitItem } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const welcomeKitRoutes = new Hono();

welcomeKitRoutes.get("/", async (c) => {
  const rows = await query("SELECT * FROM welcome_kit_items ORDER BY name ASC");
  return c.json(rows.map(mapWelcomeKitItem));
});

welcomeKitRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM welcome_kit_items WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Welcome kit item not found" }, 404);
  return c.json(mapWelcomeKitItem(row));
});

welcomeKitRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("KIT");

  await execute(
    `INSERT INTO welcome_kit_items (id, name, price, enabled, image, images, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      body.name ?? "New Item",
      body.price ?? 0,
      body.enabled ?? true,
      body.image ?? "",
      JSON.stringify(body.images ?? []),
      body.description ?? "",
    ],
  );

  const row = await queryOne("SELECT * FROM welcome_kit_items WHERE id = $1", [id]);
  return c.json(mapWelcomeKitItem(row!), 201);
});

welcomeKitRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  await patchById("welcome_kit_items", c.req.param("id"), body, {
    name: "name",
    price: "price",
    enabled: "enabled",
    image: "image",
    description: "description",
  });
  if (body.images !== undefined) {
    await execute("UPDATE welcome_kit_items SET images = $1::jsonb WHERE id = $2", [
      JSON.stringify(body.images),
      c.req.param("id"),
    ]);
  }
  const row = await queryOne("SELECT * FROM welcome_kit_items WHERE id = $1", [c.req.param("id")]);
  return c.json(mapWelcomeKitItem(row!));
});

welcomeKitRoutes.delete("/:id", async (c) => {
  await deleteById("welcome_kit_items", c.req.param("id"));
  return c.json({ ok: true });
});
