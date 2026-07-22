import { Hono } from "hono";
import { queryOne, execute } from "../../db/pool.js";
import { mapSettings } from "../../lib/mappers.js";
import { parseJsonBody, patchById } from "../../lib/http.js";

export const settingsRoutes = new Hono();

settingsRoutes.get("/", async (c) => {
  const row = await queryOne("SELECT * FROM settings WHERE id = 1");
  if (!row) return c.json({ error: "Settings not found" }, 404);
  return c.json(mapSettings(row));
});

settingsRoutes.patch("/:id", async (c) => {
  if (c.req.param("id") !== "1") {
    return c.json({ error: "Settings not found" }, 404);
  }
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("settings", "1", body, {
    brand: "brand",
    email: "email",
    phone: "phone",
    address: "address",
    currency: "currency",
    theme: "theme",
  });
  return c.json(mapSettings(row!));
});

settingsRoutes.put("/:id", async (c) => {
  if (c.req.param("id") !== "1") {
    return c.json({ error: "Settings not found" }, 404);
  }
  const body = await parseJsonBody<Record<string, unknown>>(c);
  await execute(
    `UPDATE settings SET brand = $1, email = $2, phone = $3, address = $4, currency = $5, theme = $6, updated_at = now()
     WHERE id = 1`,
    [
      body.brand ?? "Arreniux",
      body.email ?? "",
      body.phone ?? "",
      body.address ?? "",
      body.currency ?? "INR",
      body.theme ?? "light",
    ],
  );
  const row = await queryOne("SELECT * FROM settings WHERE id = 1");
  return c.json(mapSettings(row!));
});
