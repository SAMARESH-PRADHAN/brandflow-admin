-- 007_add_moq_settings.sql
-- Admin-configurable minimum order quantities. One row per category
-- (sub_category IS NULL) sets the category-wide MOQ. Categories that need
-- finer control (Custom Accessories) get one extra row per sub-category.

CREATE TABLE IF NOT EXISTS moq_settings (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  sub_category  TEXT,
  min_qty       INTEGER NOT NULL DEFAULT 1 CHECK (min_qty >= 1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_moq_settings_category_sub
  ON moq_settings (category, COALESCE(sub_category, ''));

CREATE INDEX IF NOT EXISTS idx_moq_settings_category ON moq_settings (category);

DROP TRIGGER IF EXISTS trg_moq_settings_updated_at ON moq_settings;
CREATE TRIGGER trg_moq_settings_updated_at
  BEFORE UPDATE ON moq_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();