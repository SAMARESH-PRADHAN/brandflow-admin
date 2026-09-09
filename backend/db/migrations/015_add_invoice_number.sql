ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_invoice_number_unique
  ON orders (invoice_number)
  WHERE invoice_number IS NOT NULL AND invoice_number <> '';    