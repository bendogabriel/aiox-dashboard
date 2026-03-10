-- Brainstorm Rooms table for AIOS Platform
-- Persistent storage for brainstorm rooms alongside localStorage fallback.
-- Matches the pattern from orchestration_tasks.

CREATE TABLE IF NOT EXISTS brainstorm_rooms (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  description text,
  phase       text        NOT NULL DEFAULT 'collecting',
  ideas       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  groups      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  outputs     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  tags        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for listing rooms ordered by creation
CREATE INDEX IF NOT EXISTS idx_brainstorm_rooms_created_at
  ON brainstorm_rooms (created_at DESC);

-- RLS: allow all operations for anon (matches orchestration_tasks pattern)
ALTER TABLE brainstorm_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on brainstorm_rooms"
  ON brainstorm_rooms FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert access on brainstorm_rooms"
  ON brainstorm_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on brainstorm_rooms"
  ON brainstorm_rooms FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access on brainstorm_rooms"
  ON brainstorm_rooms FOR DELETE
  USING (true);
