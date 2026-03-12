-- 006_programs.sql — Overnight Programs & Experiments
-- Persists program state and experiment history for autonomous overnight execution loops.

CREATE TABLE IF NOT EXISTS programs (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  definition_path   TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running','paused','completed','failed','exhausted')),
  current_iteration INTEGER NOT NULL DEFAULT 0,
  max_iterations    INTEGER NOT NULL DEFAULT 50,
  baseline_metric   REAL,
  best_metric       REAL,
  best_iteration    INTEGER,
  branch_name       TEXT,
  convergence_reason TEXT,
  config_json       TEXT NOT NULL DEFAULT '{}',
  tokens_used       INTEGER NOT NULL DEFAULT 0,
  estimated_cost    REAL NOT NULL DEFAULT 0.0,
  wall_clock_ms     INTEGER NOT NULL DEFAULT 0,
  trigger_type      TEXT NOT NULL DEFAULT 'manual' CHECK(trigger_type IN ('manual','scheduled')),
  started_at        TEXT,
  completed_at      TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

CREATE TABLE IF NOT EXISTS experiments (
  id              TEXT PRIMARY KEY,
  program_id      TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  iteration       INTEGER NOT NULL,
  hypothesis      TEXT,
  commit_sha      TEXT,
  metric_before   REAL,
  metric_after    REAL,
  delta           REAL,
  delta_pct       REAL,
  status          TEXT NOT NULL CHECK(status IN ('keep','discard','error','skipped')),
  files_modified  TEXT NOT NULL DEFAULT '[]',
  duration_ms     INTEGER NOT NULL DEFAULT 0,
  tokens_used     INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  pipeline_step   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_experiments_program ON experiments(program_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
