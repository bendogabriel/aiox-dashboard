-- ============================================================
-- orchestration_tasks — persistent storage for orchestrated tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS orchestration_tasks (
  id                SERIAL PRIMARY KEY,
  task_id           TEXT NOT NULL UNIQUE,
  demand            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  squads            JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs           JSONB NOT NULL DEFAULT '[]'::jsonb,
  workflow_id       TEXT,
  execution_id      TEXT,
  session_id        TEXT,
  user_id           TEXT,
  current_step      TEXT,
  step_count        INTEGER NOT NULL DEFAULT 0,
  completed_steps   INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT,
  final_result      TEXT,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orchestration_tasks_status ON orchestration_tasks(status);
CREATE INDEX IF NOT EXISTS idx_orchestration_tasks_created ON orchestration_tasks(created_at DESC);

-- RLS: allow anon full CRUD (matches other tables)
ALTER TABLE orchestration_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_orch_select" ON orchestration_tasks
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_orch_insert" ON orchestration_tasks
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_orch_update" ON orchestration_tasks
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_orch_delete" ON orchestration_tasks
  FOR DELETE TO anon USING (true);

-- Auto-update updated_at
CREATE TRIGGER trg_orchestration_tasks_updated
  BEFORE UPDATE ON orchestration_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
