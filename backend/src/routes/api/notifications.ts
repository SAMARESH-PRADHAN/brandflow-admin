import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapNotification } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const notificationRoutes = new Hono();

notificationRoutes.get("/", async (c) => {
  const { unread } = c.req.query();
  const rows =
    unread === "1" || unread === "true"
      ? await query("SELECT * FROM notifications WHERE read = false ORDER BY created_at DESC")
      : await query("SELECT * FROM notifications ORDER BY created_at DESC");
  return c.json(rows.map(mapNotification));
});

notificationRoutes.patch("/read-all", async (c) => {
  await execute("UPDATE notifications SET read = true WHERE read = false");
  const rows = await query("SELECT * FROM notifications ORDER BY created_at DESC");
  return c.json(rows.map(mapNotification));
});

notificationRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM notifications WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Notification not found" }, 404);
  return c.json(mapNotification(row));
});

notificationRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("NTF");

  await execute(
    `INSERT INTO notifications (id, type, title, message, link, read, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      body.type ?? "system",
      body.title ?? "",
      body.message ?? "",
      body.link ?? null,
      body.read ?? false,
      body.createdAt ?? new Date().toISOString(),
    ],
  );

  const row = await queryOne("SELECT * FROM notifications WHERE id = $1", [id]);
  return c.json(mapNotification(row!), 201);
});

notificationRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("notifications", c.req.param("id"), body, {
    type: "type",
    title: "title",
    message: "message",
    link: "link",
    read: "read",
  });
  return c.json(mapNotification(row!));
});

notificationRoutes.delete("/:id", async (c) => {
  await deleteById("notifications", c.req.param("id"));
  return c.json({ ok: true });
});
