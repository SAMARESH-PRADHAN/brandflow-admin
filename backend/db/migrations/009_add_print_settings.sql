

CREATE TABLE IF NOT EXISTS print_settings (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  product_type  TEXT,              -- 'Regular' | 'Premium' | NULL (no tiers)
  sub_category  TEXT,              -- subcategory name | NULL = category/type default
  config        JSONB NOT NULL DEFAULT '{"kind":"custom","methods":[]}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_print_settings_unique
  ON print_settings (
    category,
    COALESCE(product_type, ''),
    COALESCE(sub_category, '')
  );

CREATE INDEX IF NOT EXISTS idx_print_settings_category ON print_settings (category);

DROP TRIGGER IF EXISTS trg_print_settings_updated_at ON print_settings;
CREATE TRIGGER trg_print_settings_updated_at
  BEFORE UPDATE ON print_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();