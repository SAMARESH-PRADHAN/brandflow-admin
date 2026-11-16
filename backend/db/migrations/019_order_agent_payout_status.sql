-- Per-order agent payout (admin pays agent earning for that order)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS agent_payout_status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (agent_payout_status IN ('Pending', 'Paid'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS agent_payout_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_agent_payout
  ON orders (sales_agent_id, agent_payout_status)
  WHERE type = 'Sales Agent';