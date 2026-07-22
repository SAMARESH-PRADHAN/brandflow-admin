import { Pool } from "@neondatabase/serverless";
import "dotenv/config";
import { generateDemoData } from "./seed-data.js";

const force = process.argv.includes("--force");

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const existing = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
    const count = Number(existing.rows[0]?.count ?? 0);

    if (count > 0 && !force) {
      console.log(`Database already has ${count} products. Run with --force to reseed.`);
      return;
    }

    const data = generateDemoData();

    await client.query("BEGIN");

    if (force || count > 0) {
      console.log("Clearing existing demo data...");
      await client.query(`
        TRUNCATE TABLE
          notifications,
          reviews,
          payments,
          orders,
          agent_visits,
          welcome_kit_items,
          new_collection_products,
          b2b_products,
          products,
          agents,
          customers
        RESTART IDENTITY CASCADE
      `);
    }

    console.log("Inserting customers...");
    for (const c of data.customers) {
      await client.query(
        `INSERT INTO customers (id, name, phone, email, address, total_orders, total_spend, join_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [c.id, c.name, c.phone, c.email, c.address, c.totalOrders, c.totalSpend, c.joinDate, c.status],
      );
    }

    console.log("Inserting agents...");
    for (const a of data.agents) {
      await client.query(
        `INSERT INTO agents (id, code, name, phone, email, address, status, join_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [a.id, a.code, a.name, a.phone, a.email, a.address, a.status, a.joinDate],
      );
    }

    console.log("Inserting products...");
    for (const p of data.products) {
      await client.query(
        `INSERT INTO products (
          id, code, name, category, type, sub_category, material, description,
          specifications, design_guidelines, wash_care,
          sample_price, original_price, status, image, images,
          stock, orders_count, rating, visibility, colors, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22
        )`,
        [
          p.id,
          p.code,
          p.name,
          p.category,
          p.type,
          p.subCategory,
          p.material,
          p.description,
          JSON.stringify(p.specifications ?? []),
          JSON.stringify(p.designGuidelines ?? []),
          JSON.stringify(p.washCare ?? []),
          p.samplePrice,
          p.originalPrice,
          p.status,
          p.image,
          JSON.stringify(p.images ?? []),
          p.stock,
          p.orders,
          p.rating,
          p.visibility,
          JSON.stringify(p.colors),
          `${p.createdAt}T00:00:00.000Z`,
        ],
      );
    }

    console.log("Inserting B2B products...");
    for (const p of data.b2bProducts) {
      await client.query(
        `INSERT INTO b2b_products (
          id, code, name, sub_category, material, description,
          specifications, design_guidelines, wash_care,
          sample_price, original_price, status, image, images, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          p.id,
          p.code,
          p.name,
          p.subCategory,
          p.material,
          p.description,
          JSON.stringify(p.specifications ?? []),
          JSON.stringify(p.designGuidelines ?? []),
          JSON.stringify(p.washCare ?? []),
          p.samplePrice,
          p.originalPrice,
          p.status,
          p.image,
          JSON.stringify(p.images ?? []),
          `${p.createdAt}T00:00:00.000Z`,
        ],
      );
    }

    console.log("Inserting new collection products...");
    for (const p of data.newCollection) {
      await client.query(
        `INSERT INTO new_collection_products (
          id, code, name, material, description,
          specifications, design_guidelines, wash_care,
          sample_price, original_price, status, image, images, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          p.id,
          p.code,
          p.name,
          p.material,
          p.description,
          JSON.stringify(p.specifications ?? []),
          JSON.stringify(p.designGuidelines ?? []),
          JSON.stringify(p.washCare ?? []),
          p.samplePrice,
          p.originalPrice,
          p.status,
          p.image,
          JSON.stringify(p.images ?? []),
          `${p.createdAt}T00:00:00.000Z`,
        ],
      );
    }

    console.log("Inserting welcome kit items...");
    for (const k of data.welcomeKits) {
      await client.query(
        `INSERT INTO welcome_kit_items (id, name, price, enabled, image, images, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [k.id, k.name, k.price, k.enabled, k.image, JSON.stringify(k.images ?? []), k.description],
      );
    }

    console.log("Inserting orders...");
    for (const o of data.orders) {
      await client.query(
        `INSERT INTO orders (
          id, customer_id, customer_name, phone, email, address,
          product_id, product_code, product_name, category, product_type, sub_category,
          material, description, print_type, print_location, uploaded_logo,
          sizes, qty, unit_price, gst_pct, shipping,
          type, status, payment_status, payment_method, is_sample, order_date, timeline
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29
        )`,
        [
          o.id,
          o.customerId,
          o.customer,
          o.phone,
          o.email,
          o.address,
          o.productId,
          o.productCode,
          o.productName,
          o.category,
          o.productType,
          o.subCategory,
          o.material,
          o.description,
          o.printType,
          o.printLocation,
          o.uploadedLogo,
          JSON.stringify(o.sizes),
          o.qty,
          o.unitPrice,
          o.gstPct,
          o.shipping,
          o.type,
          o.status,
          o.paymentStatus,
          o.paymentMethod,
          o.isSample,
          o.date,
          JSON.stringify(o.timeline),
        ],
      );
    }

    console.log("Inserting payments...");
    for (const p of data.payments) {
      await client.query(
        `INSERT INTO payments (id, order_id, customer, amount, method, status, paid_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [p.id, p.orderId, p.customer, p.amount, p.method, p.status, p.date],
      );
    }

    console.log("Inserting reviews...");
    for (const r of data.reviews) {
      await client.query(
        `INSERT INTO reviews (id, customer, product, product_id, order_id, rating, comment, image, review_date, status, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [r.id, r.customer, r.product, r.productId, r.orderId, r.rating, r.comment, r.image, r.date, r.status, r.verified],
      );
    }

    console.log("Inserting agent visits...");
    for (const v of data.agentVisits) {
      await client.query(
        `INSERT INTO agent_visits (
          id, agent_id, agent_name, agent_code,
          customer_name, customer_phone, customer_email,
          company_name, address, city, gst_number,
          visit_date, next_follow_up, outcome, requirement, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          v.id,
          v.agentId,
          v.agentName,
          v.agentCode,
          v.customerName,
          v.customerPhone,
          v.customerEmail,
          v.companyName,
          v.address,
          v.city,
          v.gstNumber,
          v.visitDate,
          v.nextFollowUp,
          v.outcome,
          v.requirement,
          v.notes,
          v.createdAt,
        ],
      );
    }

    console.log("Inserting notifications...");
    for (const n of data.notifications) {
      await client.query(
        `INSERT INTO notifications (id, type, title, message, link, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [n.id, n.type, n.title, n.message, n.link ?? null, n.read, n.createdAt],
      );
    }

    console.log("Updating settings...");
    const s = data.settings;
    await client.query(
      `UPDATE settings SET brand = $1, email = $2, phone = $3, address = $4, currency = $5, theme = $6, updated_at = now()
       WHERE id = 1`,
      [s.brand, s.email, s.phone, s.address, s.currency, s.theme],
    );

    await client.query("COMMIT");

    console.log("\nSeed complete:");
    console.log(`  products:              ${data.products.length}`);
    console.log(`  b2b_products:          ${data.b2bProducts.length}`);
    console.log(`  new_collection:        ${data.newCollection.length}`);
    console.log(`  welcome_kits:          ${data.welcomeKits.length}`);
    console.log(`  customers:             ${data.customers.length}`);
    console.log(`  agents:                ${data.agents.length}`);
    console.log(`  orders:                ${data.orders.length} (${data.orders.filter((o) => o.isSample).length} samples)`);
    console.log(`  payments:              ${data.payments.length}`);
    console.log(`  reviews:               ${data.reviews.length}`);
    console.log(`  agent_visits:          ${data.agentVisits.length}`);
    console.log(`  notifications:         ${data.notifications.length}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
