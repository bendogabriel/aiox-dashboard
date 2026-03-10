-- Integration configs and encrypted secrets
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'disconnected',
  config TEXT NOT NULL DEFAULT '{}',
  message TEXT,
  last_checked INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  integration_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);
