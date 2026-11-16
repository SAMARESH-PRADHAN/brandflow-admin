-- 017_sales_agents.sql
-- Sales Agent system (separate from existing B2B agents)

-- 1. Sales agents
CREATE TABLE IF NOT EXISTS sales_agents (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  share_token  TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'Active'
               CHECK (status IN ('Active', 'Inactive')),
  join_date    DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_agents_status ON sales_agents (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_agents_code_lower ON sales_agents (LOWER(code));
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_agents_share_token ON sales_agents (share_token);

-- 2. Per-agent product prices (agent can only raise above original_price)
CREATE TABLE IF NOT EXISTS sales_agent_product_prices (
  id              TEXT PRIMARY KEY,
  sales_agent_id  TEXT NOT NULL REFERENCES sales_agents (id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  agent_price     NUMERIC(10, 2) NOT NULL CHECK (agent_price >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sales_agent_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_sapp_agent ON sales_agent_product_prices (sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_sapp_product ON sales_agent_product_prices (product_id);

-- 3. Orders: support Sales Agent source + price/earning snapshots
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_type_check
  CHECK (type IN ('Normal', 'Bulk', 'B2B', 'New Collection', 'Sales Agent'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_agent_id   TEXT REFERENCES sales_agents (id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_agent_code TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_agent_name TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_unit_price  NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS agent_unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS agent_earning    NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_sales_agent_id ON orders (sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_orders_type_sales ON orders (type) WHERE type = 'Sales Agent';