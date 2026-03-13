-- Vault SSOT Phase 1 — Foundation Tables
-- Date: 2026-03-13

-- ============================================================
-- 1. ALTER vault_workspaces (add new columns)
-- ============================================================
ALTER TABLE vault_workspaces
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{"aiModel":"claude-sonnet-4-6","freshnessThresholdDays":30,"autoClassify":true,"contextPackageMaxTokens":8000}',
  ADD COLUMN IF NOT EXISTS spaces_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sources_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0;

UPDATE vault_workspaces SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;

-- ============================================================
-- 2. vault_spaces
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_spaces (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES vault_workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  icon            TEXT NOT NULL DEFAULT 'folder',
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived')),
  documents_count INTEGER NOT NULL DEFAULT 0,
  total_tokens    INTEGER NOT NULL DEFAULT 0,
  health_percent  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_spaces_workspace ON vault_spaces(workspace_id);

-- ============================================================
-- 3. vault_sources
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_sources (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES vault_workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'manual'
                  CHECK (type IN ('manual', 'google_drive', 'notion', 'claude_memory', 'api', 'file_upload')),
  status          TEXT NOT NULL DEFAULT 'disconnected'
                  CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
  config          JSONB NOT NULL DEFAULT '{}',
  last_sync_at    TIMESTAMPTZ,
  documents_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_sources_workspace ON vault_sources(workspace_id);

-- ============================================================
-- 4. vault_documents_v2
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_documents_v2 (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES vault_workspaces(id) ON DELETE CASCADE,
  space_id        TEXT REFERENCES vault_spaces(id) ON DELETE SET NULL,
  source_id       TEXT REFERENCES vault_sources(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'generic'
                  CHECK (type IN ('offerbook','brand','narrative','strategy','diagnostic','proof','template','generic','sop','reference','raw')),
  content         TEXT NOT NULL DEFAULT '',
  content_hash    TEXT NOT NULL DEFAULT '',
  summary         TEXT NOT NULL DEFAULT '',
  language        TEXT NOT NULL DEFAULT 'pt-BR',
  status          TEXT NOT NULL DEFAULT 'raw'
                  CHECK (status IN ('raw','draft','validated','stale','archived')),
  token_count     INTEGER NOT NULL DEFAULT 0,
  tags            JSONB NOT NULL DEFAULT '[]',
  source_metadata JSONB NOT NULL DEFAULT '{}',
  quality         JSONB NOT NULL DEFAULT '{"completeness":0,"freshness":0,"consistency":0}',
  validated_at    TIMESTAMPTZ,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),
  source          TEXT NOT NULL DEFAULT 'Manual',
  taxonomy        TEXT NOT NULL DEFAULT '',
  consumers       JSONB NOT NULL DEFAULT '[]',
  category_id     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_docs_v2_workspace ON vault_documents_v2(workspace_id);
CREATE INDEX idx_vault_docs_v2_space ON vault_documents_v2(space_id);
CREATE INDEX idx_vault_docs_v2_status ON vault_documents_v2(status);

-- Migrate existing documents
INSERT INTO vault_documents_v2 (
  id, workspace_id, name, type, content, status, token_count,
  source, taxonomy, consumers, category_id, last_updated, created_at
)
SELECT
  id, workspace_id, name, type, content, status, token_count,
  source, taxonomy, consumers, category_id, last_updated, created_at
FROM vault_documents
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. vault_sync_jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_sync_jobs (
  id                  TEXT PRIMARY KEY,
  source_id           TEXT NOT NULL REFERENCES vault_sources(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','running','completed','failed')),
  documents_processed INTEGER NOT NULL DEFAULT 0,
  documents_total     INTEGER NOT NULL DEFAULT 0,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  error               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. vault_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_mappings (
  id            TEXT PRIMARY KEY,
  source_id     TEXT NOT NULL REFERENCES vault_sources(id) ON DELETE CASCADE,
  source_field  TEXT NOT NULL,
  target_field  TEXT NOT NULL,
  transform     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. vault_taxonomy
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_taxonomy (
  id                TEXT PRIMARY KEY,
  workspace_id      TEXT NOT NULL REFERENCES vault_workspaces(id) ON DELETE CASCADE,
  parent_id         TEXT REFERENCES vault_taxonomy(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'entity'
                    CHECK (type IN ('namespace','entity','term','workflow')),
  description       TEXT NOT NULL DEFAULT '',
  used_in_documents INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_taxonomy_workspace ON vault_taxonomy(workspace_id);

-- ============================================================
-- 8. vault_context_packages
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_context_packages (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES vault_workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  document_ids  JSONB NOT NULL DEFAULT '[]',
  total_tokens  INTEGER NOT NULL DEFAULT 0,
  max_tokens    INTEGER NOT NULL DEFAULT 8000,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. vault_activity
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_activity (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES vault_workspaces(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  description   TEXT NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_activity_workspace ON vault_activity(workspace_id);
CREATE INDEX idx_vault_activity_timestamp ON vault_activity(timestamp DESC);

-- ============================================================
-- 10. RLS Policies
-- ============================================================
ALTER TABLE vault_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_spaces_select" ON vault_spaces FOR SELECT USING (true);
CREATE POLICY "anon_vault_spaces_insert" ON vault_spaces FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_spaces_update" ON vault_spaces FOR UPDATE USING (true);
CREATE POLICY "anon_vault_spaces_delete" ON vault_spaces FOR DELETE USING (true);

ALTER TABLE vault_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_sources_select" ON vault_sources FOR SELECT USING (true);
CREATE POLICY "anon_vault_sources_insert" ON vault_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_sources_update" ON vault_sources FOR UPDATE USING (true);
CREATE POLICY "anon_vault_sources_delete" ON vault_sources FOR DELETE USING (true);

ALTER TABLE vault_documents_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_docs_v2_select" ON vault_documents_v2 FOR SELECT USING (true);
CREATE POLICY "anon_vault_docs_v2_insert" ON vault_documents_v2 FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_docs_v2_update" ON vault_documents_v2 FOR UPDATE USING (true);
CREATE POLICY "anon_vault_docs_v2_delete" ON vault_documents_v2 FOR DELETE USING (true);

ALTER TABLE vault_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_sync_select" ON vault_sync_jobs FOR SELECT USING (true);
CREATE POLICY "anon_vault_sync_insert" ON vault_sync_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_sync_update" ON vault_sync_jobs FOR UPDATE USING (true);

ALTER TABLE vault_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_mappings_select" ON vault_mappings FOR SELECT USING (true);
CREATE POLICY "anon_vault_mappings_insert" ON vault_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_mappings_update" ON vault_mappings FOR UPDATE USING (true);
CREATE POLICY "anon_vault_mappings_delete" ON vault_mappings FOR DELETE USING (true);

ALTER TABLE vault_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_taxonomy_select" ON vault_taxonomy FOR SELECT USING (true);
CREATE POLICY "anon_vault_taxonomy_insert" ON vault_taxonomy FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_taxonomy_update" ON vault_taxonomy FOR UPDATE USING (true);
CREATE POLICY "anon_vault_taxonomy_delete" ON vault_taxonomy FOR DELETE USING (true);

ALTER TABLE vault_context_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_ctx_pkg_select" ON vault_context_packages FOR SELECT USING (true);
CREATE POLICY "anon_vault_ctx_pkg_insert" ON vault_context_packages FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vault_ctx_pkg_update" ON vault_context_packages FOR UPDATE USING (true);
CREATE POLICY "anon_vault_ctx_pkg_delete" ON vault_context_packages FOR DELETE USING (true);

ALTER TABLE vault_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_vault_activity_select" ON vault_activity FOR SELECT USING (true);
CREATE POLICY "anon_vault_activity_insert" ON vault_activity FOR INSERT WITH CHECK (true);

-- ============================================================
-- 11. Updated_at triggers
-- ============================================================
CREATE TRIGGER trg_vault_spaces_updated BEFORE UPDATE ON vault_spaces FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vault_sources_updated BEFORE UPDATE ON vault_sources FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vault_docs_v2_updated BEFORE UPDATE ON vault_documents_v2 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vault_taxonomy_updated BEFORE UPDATE ON vault_taxonomy FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vault_ctx_packages_updated BEFORE UPDATE ON vault_context_packages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
