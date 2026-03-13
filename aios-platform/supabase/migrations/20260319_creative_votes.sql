-- Creative Votes table — tracks approval/rejection of gallery creatives
-- and dispatch status for agent orchestration integration.

CREATE TABLE IF NOT EXISTS creative_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id TEXT NOT NULL,
  creative_id TEXT NOT NULL,
  vote TEXT CHECK (vote IN ('approved', 'rejected', 'pending')) DEFAULT 'pending',
  voted_by TEXT DEFAULT 'master',
  voted_at TIMESTAMPTZ DEFAULT now(),
  dispatch_status TEXT CHECK (dispatch_status IN ('idle', 'dispatching', 'executing', 'completed', 'failed')) DEFAULT 'idle',
  dispatch_job_id TEXT,
  dispatch_result JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gallery_id, creative_id)
);

-- RLS: anon full access (same pattern as orchestration_tasks)
ALTER TABLE creative_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON creative_votes FOR ALL USING (true) WITH CHECK (true);
