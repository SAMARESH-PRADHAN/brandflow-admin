import { Hono } from "hono";
import { query, queryOne } from "../../db/pool.js";
import { mapOrder } from "../../lib/mappers.js";

export const dashboardRoutes = new Hono();

dashboardRoutes.get("/", async (c) => {
  const today = new Date().toISOString().slice(0, 10);

  const [counts, monthly, orderTypes, categorySales, topProducts, weekly, latestOrders] =
    await Promise.all([
      // KPIs in one round-trip
      queryOne<{
        revenue: string;
        total_orders: string;
        pending: string;
        completed: string;
        sample_orders: string;
        customers: string;
        products: string;
        reviews: string;
        pending_payments: string;
        today_sales: string;
      }>(
        `
        SELECT
          (SELECT COALESCE(SUM(qty * unit_price), 0) FROM orders WHERE is_sample = false) AS revenue,
          (SELECT COUNT(*) FROM orders WHERE is_sample = false) AS total_orders,
          (SELECT COUNT(*) FROM orders WHERE is_sample = false AND status IN ('Placed', 'Confirmed')) AS pending,
          (SELECT COUNT(*) FROM orders WHERE is_sample = false AND status = 'Delivered') AS completed,
          (SELECT COUNT(*) FROM orders WHERE is_sample = true) AS sample_orders,
          (SELECT COUNT(*) FROM customers) AS customers,
          (SELECT COUNT(*) FROM products) AS products,
          (SELECT COUNT(*) FROM reviews) AS reviews,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'Pending') AS pending_payments,
          (SELECT COALESCE(SUM(qty * unit_price), 0) FROM orders WHERE is_sample = false AND order_date = $1) AS today_sales
      `,
        [today],
      ),

      // Monthly revenue (last 8 months)
      query<{ label: string; revenue: string; orders: string }>(`
        SELECT to_char(order_date, 'YYYY-MM') AS label,
               COALESCE(SUM(qty * unit_price), 0) AS revenue,
               COUNT(*)::text AS orders
        FROM orders
        WHERE is_sample = false
          AND order_date >= (CURRENT_DATE - INTERVAL '8 months')
        GROUP BY 1
        ORDER BY 1
      `),

      // Order type distribution
      query<{ name: string; value: string }>(`
        SELECT type AS name, COUNT(*)::text AS value
        FROM orders WHERE is_sample = false
        GROUP BY type
      `),

      // Category sales (top 8)
      query<{ name: string; value: string }>(`
        SELECT category AS name, COALESCE(SUM(qty * unit_price), 0) AS value
        FROM orders WHERE is_sample = false AND category <> ''
        GROUP BY category
        ORDER BY value DESC
        LIMIT 8
      `),

      // Top products by revenue
      query<{ name: string; qty: string; revenue: string }>(`
        SELECT product_name AS name,
               SUM(qty)::text AS qty,
               COALESCE(SUM(qty * unit_price), 0) AS revenue
        FROM orders
        WHERE is_sample = false AND product_name <> ''
        GROUP BY product_id, product_name
        ORDER BY revenue DESC
        LIMIT 6
      `),

      // Weekly orders (last 7 days)
      query<{ label: string; orders: string }>(`
        SELECT to_char(d.day, 'Dy') AS label,
               COALESCE(COUNT(o.id), 0)::text AS orders
        FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day'::interval) AS d(day)
        LEFT JOIN orders o ON o.order_date = d.day::date AND o.is_sample = false
        GROUP BY d.day
        ORDER BY d.day
      `),

      // Latest 6 orders (slim columns)
      query(`
        SELECT id, customer_name, phone, email, address,
               product_id, product_code, product_name, category, product_type,
               qty, unit_price, total_amount, paid_amount,
               type, status, payment_status, payment_method, is_sample, order_date
        FROM orders
        WHERE is_sample = false
        ORDER BY order_date DESC
        LIMIT 6
      `),
    ]);

  const num = (v: unknown) => Number(v ?? 0);

  c.header("Cache-Control", "private, max-age=30");
  return c.json({
    stats: {
      revenue: num(counts?.revenue),
      totalOrders: num(counts?.total_orders),
      pending: num(counts?.pending),
      completed: num(counts?.completed),
      sampleOrders: num(counts?.sample_orders),
      customers: num(counts?.customers),
      products: num(counts?.products),
      reviews: num(counts?.reviews),
      pendingPayments: num(counts?.pending_payments),
      todaySales: num(counts?.today_sales),
    },
    monthly: monthly.map((r) => ({
      label: r.label,
      revenue: num(r.revenue),
      orders: num(r.orders),
    })),
    orderTypes: ["Normal", "Bulk", "B2B", "New Collection"].map((t) => ({
      name: t,
      value: num(orderTypes.find((r) => r.name === t)?.value),
    })),
    categorySales: categorySales.map((r) => ({
      name: r.name,
      value: num(r.value),
    })),
    topProducts: topProducts.map((r) => ({
      name: r.name,
      qty: num(r.qty),
      revenue: num(r.revenue),
    })),
    weekly: weekly.map((r) => ({
      label: r.label.trim(),
      orders: num(r.orders),
    })),
    latestOrders: latestOrders.map(mapOrder),
  });
});