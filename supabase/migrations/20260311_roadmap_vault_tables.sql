-- Roadmap & Vault Persistence Schema
-- Date: 2026-03-10

-- ============================================================
-- 1. roadmap_features
-- ============================================================
CREATE TABLE IF NOT EXISTS roadmap_features (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  priority        TEXT NOT NULL DEFAULT 'should'
                  CHECK (priority IN ('must', 'should', 'could', 'wont')),
  impact          TEXT NOT NULL DEFAULT 'medium'
                  CHECK (impact IN ('high', 'medium', 'low')),
  effort          TEXT NOT NULL DEFAULT 'medium'
                  CHECK (effort IN ('high', 'medium', 'low')),
  tags            JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned', 'in_progress', 'done')),
  quarter         TEXT CHECK (quarter IS NULL OR quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  squad           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_features_priority ON roadmap_features(priority);
CREATE INDEX idx_roadmap_features_status ON roadmap_features(status);
CREATE INDEX idx_roadmap_features_quarter ON roadmap_features(quarter);

-- ============================================================
-- 2. vault_workspaces
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_workspaces (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  icon              TEXT NOT NULL DEFAULT 'building',
  status            TEXT NOT NULL DEFAULT 'setup'
                    CHECK (status IN ('active', 'setup', 'inactive')),
  documents_count   INTEGER NOT NULL DEFAULT 0,
  templates_count   INTEGER NOT NULL DEFAULT 0,
  health_percent    INTEGER NOT NULL DEFAULT 0,
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT now(),
  categories        JSONB NOT NULL DEFAULT '[]',
  template_groups   JSONB NOT NULL DEFAULT '[]',
  taxonomy_sections JSONB NOT NULL DEFAULT '[]',
  csuite_personas   JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_workspaces_status ON vault_workspaces(status);

-- ============================================================
-- 3. vault_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_documents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'generic'
                  CHECK (type IN ('offerbook', 'brand', 'narrative', 'strategy', 'diagnostic', 'proof', 'template', 'generic')),
  content         TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('validated', 'draft', 'outdated')),
  token_count     INTEGER NOT NULL DEFAULT 0,
  source          TEXT NOT NULL DEFAULT 'Manual',
  taxonomy        TEXT NOT NULL DEFAULT '',
  consumers       JSONB NOT NULL DEFAULT '[]',
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),
  category_id     TEXT NOT NULL DEFAULT '',
  workspace_id    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_documents_workspace ON vault_documents(workspace_id);
CREATE INDEX idx_vault_documents_category ON vault_documents(category_id);
CREATE INDEX idx_vault_documents_status ON vault_documents(status);
CREATE INDEX idx_vault_documents_type ON vault_documents(type);

-- ============================================================
-- 4. RLS Policies (anon key full CRUD)
-- ============================================================

-- roadmap_features
ALTER TABLE roadmap_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roadmap features"
  ON roadmap_features FOR SELECT USING (true);

CREATE POLICY "Anyone can insert roadmap features"
  ON roadmap_features FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update roadmap features"
  ON roadmap_features FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete roadmap features"
  ON roadmap_features FOR DELETE USING (true);

-- vault_workspaces
ALTER TABLE vault_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vault workspaces"
  ON vault_workspaces FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vault workspaces"
  ON vault_workspaces FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update vault workspaces"
  ON vault_workspaces FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete vault workspaces"
  ON vault_workspaces FOR DELETE USING (true);

-- vault_documents
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vault documents"
  ON vault_documents FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vault documents"
  ON vault_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update vault documents"
  ON vault_documents FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete vault documents"
  ON vault_documents FOR DELETE USING (true);

-- ============================================================
-- 5. Auto-update updated_at triggers
-- ============================================================

-- Reuse set_updated_at() if it exists, otherwise create it
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roadmap_features_updated
  BEFORE UPDATE ON roadmap_features FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vault_workspaces_updated
  BEFORE UPDATE ON vault_workspaces FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vault_documents_updated
  BEFORE UPDATE ON vault_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
