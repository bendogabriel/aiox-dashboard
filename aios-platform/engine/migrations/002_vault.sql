-- Vault SSOT local cache tables
CREATE TABLE IF NOT EXISTS vault_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  icon TEXT NOT NULL DEFAULT 'building',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'setup',
  settings TEXT NOT NULL DEFAULT '{}',
  spaces_count INTEGER NOT NULL DEFAULT 0,
  sources_count INTEGER NOT NULL DEFAULT 0,
  documents_count INTEGER NOT NULL DEFAULT 0,
  templates_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  health_percent INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vault_spaces (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  documents_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  health_percent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vault_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  space_id TEXT,
  source_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'generic',
  content TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  status TEXT NOT NULL DEFAULT 'raw',
  token_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  source_metadata TEXT NOT NULL DEFAULT '{}',
  quality TEXT NOT NULL DEFAULT '{"completeness":0,"freshness":0,"consistency":0}',
  validated_at TEXT,
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'Manual',
  taxonomy TEXT NOT NULL DEFAULT '',
  consumers TEXT NOT NULL DEFAULT '[]',
  category_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vault_sources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'disconnected',
  config TEXT NOT NULL DEFAULT '{}',
  last_sync_at TEXT,
  documents_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
