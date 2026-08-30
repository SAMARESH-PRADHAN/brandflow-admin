// import { Hono } from "hono";
// import { HTTPException } from "hono/http-exception";
// import { razorpay, verifyRazorpaySignature } from "../../lib/razorpay.js";
// import { parseJsonBody } from "../../lib/http.js";

// export const razorpayRoutes = new Hono();

// // Step 1: create a Razorpay order (called before opening checkout)
// razorpayRoutes.post("/create-order", async (c) => {
//   const body = await parseJsonBody<{ amount: number; receipt?: string }>(c);
//   if (!body.amount || body.amount <= 0) {
//     throw new HTTPException(400, { message: "Invalid amount" });
//   }

//   const order = await razorpay.orders.create({
//     amount: Math.round(body.amount * 100), // paise
//     currency: "INR",
//     receipt: body.receipt ?? `rcpt_${Date.now()}`,
//   });

//   return c.json({
//     orderId: order.id,
//     amount: order.amount,
//     currency: order.currency,
//     keyId: process.env.RAZORPAY_KEY_ID,
//   });
// });

// // Step 2: verify payment after checkout succeeds
// razorpayRoutes.post("/verify", async (c) => {
//   const body = await parseJsonBody<{
//     razorpay_order_id: string;
//     razorpay_payment_id: string;
//     razorpay_signature: string;
//   }>(c);

//   const ok = verifyRazorpaySignature(
//     body.razorpay_order_id,
//     body.razorpay_payment_id,
//     body.razorpay_signature,
//   );

//   if (!ok) throw new HTTPException(400, { message: "Payment verification failed" });

//   return c.json({ verified: true, paymentId: body.razorpay_payment_id });
// });



import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import crypto from "node:crypto";
import { razorpay, verifyRazorpaySignature, fetchRazorpayPayment } from "../../lib/razorpay.js";
import { parseJsonBody } from "../../lib/http.js";
import { env } from "../../config/env.js";
import { newId } from "../../lib/http.js";
import { queryOne, execute } from "../../db/pool.js";
import { insertOrder } from "./orders.js";

export const razorpayRoutes = new Hono();

// ---------- 1. Create Order ----------
razorpayRoutes.post("/create-order", async (c) => {
  const body = await parseJsonBody<{ amount: number; receipt?: string }>(c);
  if (!body.amount || body.amount <= 0) {
    throw new HTTPException(400, { message: "Invalid amount" });
  }

  const order = await razorpay.orders.create({
    amount: Math.round(body.amount * 100), // paise
    currency: "INR",
    receipt: body.receipt ?? `rcpt_${Date.now()}`,
  });

  return c.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  });
});

// ---------- 2. Verify (frontend callback) ----------
// razorpayRoutes.post("/verify", async (c) => {
//   const body = await parseJsonBody<{
//     razorpay_order_id: string;
//     razorpay_payment_id: string;
//     razorpay_signature: string;
//     internal_order_id?: string;
//   }>(c);

//   const ok = verifyRazorpaySignature(
//     body.razorpay_order_id,
//     body.razorpay_payment_id,
//     body.razorpay_signature,
//   );

//   if (!ok) {
//     throw new HTTPException(400, { message: "Payment verification failed" });
//   }

//   return c.json({
//     verified: true,
//     paymentId: body.razorpay_payment_id,
//   });
// });


// ---------- 2. Verify + finalize the order ----------
razorpayRoutes.post("/verify", async (c) => {
  const body = await parseJsonBody<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderPayload: Record<string, unknown>; // cart/checkout details, sent NOW
  }>(c);

  // 1. Signature check (unchanged)
  const sigOk = verifyRazorpaySignature(
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature,
  );
  if (!sigOk) {
    throw new HTTPException(400, { message: "Payment verification failed" });
  }

  // 2. Idempotency: has this exact payment already been processed?
  const already = await queryOne<{ order_id: string }>(
    "SELECT order_id FROM payments WHERE razorpay_payment_id = $1",
    [body.razorpay_payment_id],
  );
  if (already) {
    const existing = await queryOne("SELECT * FROM orders WHERE id = $1", [already.order_id]);
    return c.json({ verified: true, order: existing });
  }

  // 3. Ask RAZORPAY (not the client, not our DB) what was actually paid.
  const payment = await fetchRazorpayPayment(body.razorpay_payment_id);
  if (payment.status !== "captured" && payment.status !== "authorized") {
    throw new HTTPException(400, { message: "Payment not captured" });
  }
  if (payment.order_id !== body.razorpay_order_id) {
    throw new HTTPException(400, { message: "Payment/order mismatch" });
  }

  // 4. Server decides the paid amount from Razorpay's response — never from
  //    body.orderPayload.total or anything else the client sent.
  const paidRupees = Number(payment.amount) / 100;

 let orderRow;
try {
  orderRow = await insertOrder(
    {
      ...body.orderPayload,
      paid: paidRupees,
      paymentStatus: "Paid",
    },
    false,
  );
} catch (err) {
  console.error("[razorpay/verify] Order insert failed after payment captured:", {
    paymentId: body.razorpay_payment_id,
    orderId: body.razorpay_order_id,
    error: err,
  });
  throw new HTTPException(500, {
    message: "Payment captured but order could not be saved. Contact support with payment ID: " + body.razorpay_payment_id,
  });
}

  await execute(
    `INSERT INTO payments (id, order_id, customer, amount, method, status, paid_date, razorpay_order_id, razorpay_payment_id)
     VALUES ($1,$2,$3,$4,$5,'Paid',$6,$7,$8)`,
    [
      newId("TXN"),
      orderRow!.id,
      (body.orderPayload as Record<string, unknown>).customer ?? "",
      paidRupees,
      payment.method ?? "UPI",
      new Date().toISOString().slice(0, 10),
      body.razorpay_order_id,
      body.razorpay_payment_id,
    ],
  );

  return c.json({ verified: true, order: orderRow });
});

// ---------- 3. Webhook (source of truth) ----------
razorpayRoutes.post("/webhook", async (c) => {
  const signature = c.req.header("x-razorpay-signature");
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    throw new HTTPException(400, { message: "Missing signature or webhook secret" });
  }

  // IMPORTANT: use raw body for HMAC
  const rawBody = await c.req.text();

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error("Webhook signature mismatch");
    throw new HTTPException(400, { message: "Invalid webhook signature" });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event.event;

  console.log(`[Razorpay Webhook] ${eventName}`);

  try {
    switch (eventName) {
      // ===== Successful payment =====
      case "payment.captured":
      case "order.paid": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id as string;
        const paymentId = payment.id as string;
        const amountPaise = payment.amount as number;
        const amountInr = amountPaise / 100;
        const method = payment.method ?? "UPI";
        const customerName =
          payment.notes?.customer_name ||
          payment.email ||
          "Customer";

        // Create payment record (idempotent)
        const existing = await queryOne(
          `SELECT id FROM payments WHERE id = $1`,
          [paymentId],
        );

        if (!existing) {
          await execute(
            `INSERT INTO payments (id, order_id, customer, amount, method, status, paid_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              paymentId,
              razorpayOrderId,
              customerName,
              amountInr,
              method,
              "Paid",
              new Date().toISOString().slice(0, 10),
            ],
          );
        }

        // Optional: also update your orders table
        // await execute(
        //   `UPDATE orders SET status = 'Paid' WHERE razorpay_order_id = $1`,
        //   [razorpayOrderId],
        // );

        break;
      }

      // ===== Failed payment =====
      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id as string;
        const paymentId = payment.id as string;

        console.log(`Payment failed: ${paymentId} for order ${razorpayOrderId}`);
        break;
      }

      // ===== Refunds (you don't have refund flow, just log) =====
      case "refund.created":
      case "refund.processed": {
        const refund = event.payload?.refund?.entity;
        if (!refund) break;

        const refundId = refund.id as string;
        const amountInr = (refund.amount as number) / 100;

        console.log(`Refund ${eventName}: ${refundId}, amount ₹${amountInr}`);
        break;
      }

      case "refund.failed": {
        const refund = event.payload?.refund?.entity;
        console.error("Refund failed:", refund?.id);
        break;
      }

      // ===== Settlement =====
      case "settlement.processed": {
        console.log(
          "Settlement processed:",
          event.payload?.settlement?.entity?.id,
        );
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  return c.json({ status: "ok" }, 200);
});