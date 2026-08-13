import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { query, queryOne, execute } from "../../db/pool.js";
import { mapCustomer } from "../../lib/mappers.js";
import { deleteById, newId, parseJsonBody, patchById } from "../../lib/http.js";
import { verifyGoogleIdToken } from "../../lib/google.js";

export const customerRoutes = new Hono();

const SALT_ROUNDS = 10;
const DUMMY_HASH = "$2a$10$invalidsaltinvalidsaltinvalidsal";

customerRoutes.get("/", async (c) => {
  const { status } = c.req.query();
  const p = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const l = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50") || 50));
  const offset = (p - 1) * l;

  const cols = `id, name, phone, email, address, total_orders, total_spend, join_date, status, count(*) OVER() as _total_count`;
  const rows = status
    ? await query(`SELECT ${cols} FROM customers WHERE status = $1 ORDER BY join_date DESC LIMIT $2 OFFSET $3`, [status, l, offset])
    : await query(`SELECT ${cols} FROM customers ORDER BY join_date DESC LIMIT $1 OFFSET $2`, [l, offset]);

  const totalCount = parseInt(String((rows[0] as any)?._total_count ?? "0"));
  return c.json({
    data: rows.map(mapCustomer),
    pagination: { page: p, limit: l, total: totalCount }
  });
});

customerRoutes.get("/:id", async (c) => {
  const row = await queryOne("SELECT * FROM customers WHERE id = $1", [c.req.param("id")]);
  if (!row) return c.json({ error: "Customer not found" }, 404);
  return c.json(mapCustomer(row));
});

customerRoutes.post("/", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const id = (body.id as string) ?? newId("CUS");

  const existing = await queryOne("SELECT id FROM customers WHERE email = $1", [
    (body.email as string) ?? "",
  ]);
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const rawPassword = (body.password as string) ?? "";
  const passwordHash = rawPassword ? await bcrypt.hash(rawPassword, SALT_ROUNDS) : "";

  await execute(
    `INSERT INTO customers (id, name, phone, email, address, password, total_orders, total_spend, join_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      body.name ?? "New Customer",
      body.phone ?? "",
      body.email ?? "",
      body.address ?? "",
      passwordHash,
      body.totalOrders ?? 0,
      body.totalSpend ?? 0,
      body.joinDate ?? new Date().toISOString().slice(0, 10),
      body.status ?? "Active",
    ],
  );

  const row = await queryOne("SELECT * FROM customers WHERE id = $1", [id]);
  return c.json(mapCustomer(row!), 201);
});

// Hashed comparison — password never leaves the DB as plaintext or in the response.
customerRoutes.post("/login", async (c) => {
  const body = await parseJsonBody<{ email?: string; password?: string }>(c);
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM customers WHERE email = $1",
    [email],
  );

  const storedHash = (row?.password as string) || DUMMY_HASH;
  // Always compare, even for a missing user, so response timing doesn't
  // reveal whether the email exists.
  const valid = await bcrypt.compare(password, storedHash);

  if (!row || !valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  if (row.status !== "Active") {
    return c.json({ error: "Account inactive" }, 403);
  }

  return c.json(mapCustomer(row));
});


customerRoutes.post("/google-login", async (c) => {
  const body = await parseJsonBody<{ idToken?: string }>(c);
  if (!body.idToken) return c.json({ error: "Missing idToken" }, 400);

  let profile;
  try {
    profile = await verifyGoogleIdToken(body.idToken);
  } catch {
    return c.json({ error: "Invalid Google token" }, 401);
  }

  // Existing Google user?
  let row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM customers WHERE google_id = $1",
    [profile.googleId],
  );

  if (!row) {
    // Same email already registered via password signup? Link the account.
    row = await queryOne<Record<string, unknown>>(
      "SELECT * FROM customers WHERE email = $1",
      [profile.email],
    );

    if (row) {
      await execute(
        "UPDATE customers SET google_id = $1, provider = 'google' WHERE id = $2",
        [profile.googleId, row.id],
      );
      row = await queryOne("SELECT * FROM customers WHERE id = $1", [row.id]);
    } else {
      const id = newId("CUS");
      await execute(
        `INSERT INTO customers (id, name, phone, email, address, password, google_id, provider, total_orders, total_spend, join_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'google',0,0,$8,'Active')`,
        [id, profile.name, "", profile.email, "", "", profile.googleId, new Date().toISOString().slice(0, 10)],
      );
      row = await queryOne("SELECT * FROM customers WHERE id = $1", [id]);
    }
  }

  if (row!.status !== "Active") {
    return c.json({ error: "Account inactive" }, 403);
  }

  return c.json(mapCustomer(row!));
});

customerRoutes.patch("/:id", async (c) => {
  const body = await parseJsonBody<Record<string, unknown>>(c);
  const row = await patchById("customers", c.req.param("id"), body, {
    name: "name",
    phone: "phone",
    email: "email",
    address: "address",
    totalOrders: "total_orders",
    totalSpend: "total_spend",
    joinDate: "join_date",
    status: "status",
  });
  return c.json(mapCustomer(row!));
});

customerRoutes.delete("/:id", async (c) => {
  await deleteById("customers", c.req.param("id"));
  return c.json({ ok: true });
});