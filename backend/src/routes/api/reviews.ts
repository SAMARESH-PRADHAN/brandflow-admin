import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapReview } from "../../lib/mappers.js";
import { deleteByIdWithImageCleanup, cleanupRemovedImagesOnPatch, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const reviewRoutes = new Hono();

reviewRoutes.get("/", async (c) => {
  const { status } = c.req.query();
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;

  const rows = status
    ? await query("SELECT *, count(*) OVER() as _total_count FROM reviews WHERE status = $1 ORDER BY review_date DESC LIMIT $2 OFFSET $3", [status, l, offset])
    : await query("SELECT *, count(*) OVER() as _total_count FROM reviews ORDER BY review_date DESC LIMIT $1 OFFSET $2", [l, offset]);
    
  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapReview),
    pagination: { page: p, limit: l, total: totalCount }
  });
});

reviewRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM reviews WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Review not found" }, 404);
  return c.json(mapReview(row));
});

import { rateLimit } from "../../middleware/rate-limit.js";

reviewRoutes.post("/", rateLimit(5, 60000), async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("REV");

  await execute(
    `INSERT INTO reviews (id, customer, product, product_id, order_id, rating, comment, image, review_date, status, verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      id,
      body.customer ?? "",
      body.product ?? "",
      body.productId ?? null,
      body.orderId ?? null,
      body.rating ?? 5,
      body.comment ?? "",
      body.image ?? "",
      body.date ?? new Date().toISOString().slice(0, 10),
      body.status ?? "Pending",
      body.verified ?? false,
    ],
  );

  const row = await queryOne("SELECT * FROM reviews WHERE id = $1", [id]);
  return c.json(mapReview(row!), 201);
});

reviewRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = c.req.param("id");
  const existing = await queryOne("SELECT id, image FROM reviews WHERE id = $1", [id]);
  if (!existing) return c.json({ error: "Review not found" }, 404);

  await cleanupRemovedImagesOnPatch(existing as Record<string, unknown>, body);

  const row = await patchById("reviews", id, body, {
    customer: "customer",
    product: "product",
    productId: "product_id",
    orderId: "order_id",
    rating: "rating",
    comment: "comment",
    image: "image",
    date: "review_date",
    status: "status",
    verified: "verified",
  });
  return c.json(mapReview(row!));
});

reviewRoutes.delete("/:id", async (c) => {
  await deleteByIdWithImageCleanup("reviews", c.req.param("id"), {
    includeImagesArray: false,
  });
  return c.json({ ok: true });
});
