CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  demand TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  plan TEXT,
  squads TEXT,
  outputs TEXT,
  error TEXT,
  feedback TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT
);
