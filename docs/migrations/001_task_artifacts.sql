-- Migration: Create task_artifacts table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/frloupauwahdmzfzrepx/sql

CREATE TABLE IF NOT EXISTS task_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('markdown', 'code', 'diagram', 'data', 'table')),
  language TEXT,
  filename TEXT,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT,
  token_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_artifacts_task ON task_artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON task_artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_language ON task_artifacts(language);
CREATE INDEX IF NOT EXISTS idx_artifacts_hash ON task_artifacts(content_hash);

-- Enable RLS but allow anon full access (matches orchestration_tasks policy)
ALTER TABLE task_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon full access to task_artifacts"
  ON task_artifacts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to anon role
GRANT ALL ON task_artifacts TO anon;
GRANT ALL ON task_artifacts TO authenticated;
