CREATE TABLE IF NOT EXISTS admin_credentials (
  id          TEXT PRIMARY KEY DEFAULT 'admin',
  email       TEXT NOT NULL,
  password    TEXT NOT NULL,
  master_key  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admin_credentials (id, email, password, master_key)
VALUES ('admin', 'arrheniuxofficial@gmail.com', 'arr@123', 'arrheniux-masterkey')
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS trg_admin_credentials_updated_at ON admin_credentials;
CREATE TRIGGER trg_admin_credentials_updated_at
  BEFORE UPDATE ON admin_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();