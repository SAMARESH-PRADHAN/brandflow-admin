import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { razorpay, verifyRazorpaySignature } from "../../lib/razorpay.js";
import { parseJsonBody } from "../../lib/http.js";

export const razorpayRoutes = new Hono();

// Step 1: create a Razorpay order (called before opening checkout)
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
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// Step 2: verify payment after checkout succeeds
razorpayRoutes.post("/verify", async (c) => {
  const body = await parseJsonBody<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }>(c);

  const ok = verifyRazorpaySignature(
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature,
  );

  if (!ok) throw new HTTPException(400, { message: "Payment verification failed" });

  return c.json({ verified: true, paymentId: body.razorpay_payment_id });
});