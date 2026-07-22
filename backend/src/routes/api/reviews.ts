import { Hono } from "hono";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapReview } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";

export const reviewRoutes = new Hono();

reviewRoutes.get("/", async (c) => {
  const { status } = c.req.query();
  const rows = status
    ? await query("SELECT * FROM reviews WHERE status = $1 ORDER BY review_date DESC", [status])
    : await query("SELECT * FROM reviews ORDER BY review_date DESC");
  return c.json(rows.map(mapReview));
});

reviewRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM reviews WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Review not found" }, 404);
  return c.json(mapReview(row));
});

reviewRoutes.post("/", async (c) => {
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
  const row = await patchById("reviews", c.req.param("id"), body, {
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
  await deleteById("reviews", c.req.param("id"));
  return c.json({ ok: true });
});
