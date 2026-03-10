-- User Settings Persistence Schema
-- Date: 2026-03-10
-- Stores user preferences (theme, refresh intervals, agent colors, etc.)

-- ============================================================
-- 1. user_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id          TEXT PRIMARY KEY,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_settings_key ON user_settings(key);

-- ============================================================
-- 2. RLS Policies (anon key full CRUD)
-- ============================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user settings"
  ON user_settings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user settings"
  ON user_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user settings"
  ON user_settings FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete user settings"
  ON user_settings FOR DELETE USING (true);

-- ============================================================
-- 3. Auto-update updated_at trigger
-- ============================================================

-- Reuse set_updated_at() if it exists, otherwise create it
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_settings_updated
  BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
