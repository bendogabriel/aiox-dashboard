-- ============================================================
-- Migration: Chat Sessions Persistence
-- Description: Supabase tables for persisting chat conversations
--              alongside the existing localStorage layer.
-- ============================================================

-- 1. chat_sessions: one row per conversation
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL DEFAULT '',
  squad_id TEXT NOT NULL DEFAULT '',
  squad_type TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL DEFAULT '',
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. chat_messages: individual messages within a session
-- Drop legacy table if it has wrong schema (missing session_id)
-- ============================================================
DROP TABLE IF EXISTS chat_messages CASCADE;
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
  content TEXT NOT NULL DEFAULT '',
  agent_id TEXT,
  agent_name TEXT,
  squad_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  attachments JSONB NOT NULL DEFAULT '[]',
  is_streaming BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

-- 4. Row Level Security (anon full CRUD — same as vault tables)
-- ============================================================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_chat_sessions_all" ON chat_sessions;
CREATE POLICY "anon_chat_sessions_all" ON chat_sessions FOR ALL USING (true);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_chat_messages_all" ON chat_messages;
CREATE POLICY "anon_chat_messages_all" ON chat_messages FOR ALL USING (true);

-- 5. Updated_at trigger (reuses existing set_updated_at function)
-- ============================================================
DROP TRIGGER IF EXISTS trg_chat_sessions_updated ON chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated
  BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
