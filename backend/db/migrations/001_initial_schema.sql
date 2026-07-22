-- Brandflow Admin — initial schema (mirrors frontend store.ts types)

CREATE TABLE IF NOT EXISTS schema_migrations (
  id         TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Customers & agents
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  address       TEXT NOT NULL DEFAULT '',
  total_orders  INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spend   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_spend >= 0),
  join_date     DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

CREATE TABLE IF NOT EXISTS agents (
  id         TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT NOT NULL,
  address    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  join_date  DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_status ON agents (status);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  category           TEXT NOT NULL,
  type               TEXT NOT NULL CHECK (type IN ('Regular', 'Premium', 'Others')),
  sub_category       TEXT NOT NULL DEFAULT '',
  material           TEXT NOT NULL DEFAULT '',
  description        TEXT NOT NULL DEFAULT '',
  overview           TEXT,
  specifications     JSONB NOT NULL DEFAULT '[]'::jsonb,
  design_guidelines  JSONB NOT NULL DEFAULT '[]'::jsonb,
  wash_care          JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_price       NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sample_price >= 0),
  original_price     NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (original_price >= 0),
  status             TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  image              TEXT NOT NULL DEFAULT '',
  images             JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock              INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  orders_count       INTEGER NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
  rating             NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  visibility         TEXT NOT NULL DEFAULT 'Both' CHECK (visibility IN ('Category', 'Bulk', 'Both')),
  colors             JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_code ON products (code);

CREATE TABLE IF NOT EXISTS b2b_products (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  sub_category       TEXT NOT NULL DEFAULT '',
  material           TEXT NOT NULL DEFAULT '',
  description        TEXT NOT NULL DEFAULT '',
  overview           TEXT,
  specifications     JSONB NOT NULL DEFAULT '[]'::jsonb,
  design_guidelines  JSONB NOT NULL DEFAULT '[]'::jsonb,
  wash_care          JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_price       NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sample_price >= 0),
  original_price     NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (original_price >= 0),
  status             TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  image              TEXT NOT NULL DEFAULT '',
  images             JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_products_status ON b2b_products (status);

CREATE TABLE IF NOT EXISTS new_collection_products (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  material           TEXT NOT NULL DEFAULT '',
  description        TEXT NOT NULL DEFAULT '',
  overview           TEXT,
  specifications     JSONB NOT NULL DEFAULT '[]'::jsonb,
  design_guidelines  JSONB NOT NULL DEFAULT '[]'::jsonb,
  wash_care          JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_price       NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sample_price >= 0),
  original_price     NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (original_price >= 0),
  status             TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  image              TEXT NOT NULL DEFAULT '',
  images             JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_new_collection_products_status ON new_collection_products (status);

CREATE TABLE IF NOT EXISTS welcome_kit_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  enabled     BOOLEAN NOT NULL DEFAULT true,
  image       TEXT NOT NULL DEFAULT '',
  images      JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Orders & payments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  customer_id     TEXT REFERENCES customers (id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT NOT NULL,
  address         TEXT NOT NULL DEFAULT '',
  product_id      TEXT,
  product_code    TEXT NOT NULL DEFAULT '',
  product_name    TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT '',
  product_type    TEXT NOT NULL DEFAULT '',
  sub_category    TEXT NOT NULL DEFAULT '',
  material        TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  print_type      TEXT NOT NULL DEFAULT '',
  print_location  TEXT NOT NULL DEFAULT '',
  uploaded_logo   TEXT NOT NULL DEFAULT '',
  sizes           JSONB NOT NULL DEFAULT '{}'::jsonb,
  qty             INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 0),
  unit_price      NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  gst_pct         NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (gst_pct >= 0),
  shipping        NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  type            TEXT NOT NULL CHECK (type IN ('Normal', 'Bulk', 'B2B', 'New Collection')),
  status          TEXT NOT NULL CHECK (status IN ('Placed', 'Confirmed', 'In Production', 'Shipped', 'Delivered')),
  payment_status  TEXT NOT NULL CHECK (payment_status IN ('Paid', 'Pending', 'Partial', 'Failed', 'Refunded')),
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('UPI', 'Credit Card', 'Net Banking', 'COD', 'Wallet')),
  is_sample       BOOLEAN NOT NULL DEFAULT false,
  order_date      DATE NOT NULL,
  timeline        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders (type);
CREATE INDEX IF NOT EXISTS idx_orders_is_sample ON orders (is_sample);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);

CREATE TABLE IF NOT EXISTS payments (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  customer   TEXT NOT NULL,
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  method     TEXT NOT NULL CHECK (method IN ('UPI', 'Credit Card', 'Net Banking', 'COD', 'Wallet')),
  status     TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Partial', 'Failed', 'Refunded')),
  paid_date  DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments (paid_date DESC);

-- ---------------------------------------------------------------------------
-- Reviews, agent visits, notifications, settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  customer    TEXT NOT NULL,
  product     TEXT NOT NULL,
  product_id  TEXT,
  order_id    TEXT REFERENCES orders (id) ON DELETE SET NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  review_date DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Pending', 'Rejected')),
  verified    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews (review_date DESC);

CREATE TABLE IF NOT EXISTS agent_visits (
  id              TEXT PRIMARY KEY,
  agent_id        TEXT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  agent_name      TEXT NOT NULL,
  agent_code      TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  company_name    TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  gst_number      TEXT NOT NULL DEFAULT '',
  visit_date      DATE NOT NULL,
  next_follow_up  DATE,
  outcome         TEXT NOT NULL CHECK (outcome IN ('Interested', 'Follow-up', 'Not Interested', 'Converted', 'Sample Requested')),
  requirement     TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_visits_agent_id ON agent_visits (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_visits_visit_date ON agent_visits (visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_visits_outcome ON agent_visits (outcome);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('order', 'payment', 'review', 'stock', 'agent', 'system')),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  id       SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand    TEXT NOT NULL DEFAULT 'Arreniux',
  email    TEXT NOT NULL DEFAULT '',
  phone    TEXT NOT NULL DEFAULT '',
  address  TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'INR',
  theme    TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (id, brand, email, phone, address, currency, theme)
VALUES (1, 'Arreniux', 'hello@arreniux.com', '+91 9812345678', 'Bandra West, Mumbai, India', 'INR', 'light')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers', 'agents', 'products', 'b2b_products', 'new_collection_products',
    'welcome_kit_items', 'orders', 'payments', 'reviews', 'agent_visits', 'settings'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I; CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END;
$$;
