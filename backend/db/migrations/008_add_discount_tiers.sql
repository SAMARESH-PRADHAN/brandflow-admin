-- 008_add_discount_tiers.sql
-- Admin-configurable quantity discount tiers, per category (and optionally
-- per sub-category, mirroring moq_settings). One row = one tier.
-- max_qty IS NULL means "this quantity and above" (the bulk-order tier).

CREATE TABLE IF NOT EXISTS discount_tiers (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  sub_category  TEXT,
  min_qty       INTEGER NOT NULL CHECK (min_qty >= 1),
  max_qty       INTEGER,                       -- NULL = open-ended (bulk tier)
  discount_pct  NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  is_bulk       BOOLEAN NOT NULL DEFAULT false, -- true for the 80+ / Bulk Order tier
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (max_qty IS NULL OR max_qty >= min_qty)
);

CREATE INDEX IF NOT EXISTS idx_discount_tiers_category
  ON discount_tiers (category, COALESCE(sub_category, ''));

DROP TRIGGER IF EXISTS trg_discount_tiers_updated_at ON discount_tiers;
CREATE TRIGGER trg_discount_tiers_updated_at
  BEFORE UPDATE ON discount_tiers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();