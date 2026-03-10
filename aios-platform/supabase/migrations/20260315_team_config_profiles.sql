-- P18: Team Config Sync — shared profiles table
-- Allows team members to share integration configurations

CREATE TABLE IF NOT EXISTS team_config_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  configs jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_by text DEFAULT 'anonymous',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS: allow all operations for anon (same pattern as orchestration_tasks)
ALTER TABLE team_config_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON team_config_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Index for listing by updated_at
CREATE INDEX IF NOT EXISTS idx_team_config_profiles_updated
  ON team_config_profiles (updated_at DESC);
