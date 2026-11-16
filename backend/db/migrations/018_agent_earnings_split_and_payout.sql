-- Platform share of margin (20%) stored on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS platform_earning NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Agent payout status (admin settles agent money)
ALTER TABLE sales_agents
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (payout_status IN ('Pending', 'Paid'));

ALTER TABLE sales_agents
  ADD COLUMN IF NOT EXISTS payout_updated_at TIMESTAMPTZ;