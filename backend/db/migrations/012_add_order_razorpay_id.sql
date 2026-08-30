ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders (razorpay_order_id);