-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
  discount_value   NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_uses         INTEGER,
  used_count       INTEGER NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (LOWER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons (is_active);

-- Who used which coupon
CREATE TABLE IF NOT EXISTS coupon_usages (
  id              TEXT PRIMARY KEY,
  coupon_id       TEXT NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
  coupon_code     TEXT NOT NULL,
  customer_id     TEXT REFERENCES customers (id) ON DELETE SET NULL,
  customer_name   TEXT,
  customer_email  TEXT,
  order_id        TEXT REFERENCES orders (id) ON DELETE SET NULL,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  used_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_customer_id ON coupon_usages (customer_id);