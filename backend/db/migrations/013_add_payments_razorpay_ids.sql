ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON payments (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;