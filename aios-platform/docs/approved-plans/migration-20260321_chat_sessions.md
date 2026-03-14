# Migration Plan: Chat Sessions Persistence (20260321)

## Summary

Add Supabase persistence for chat conversations in the AIOS Platform dashboard. Currently chat sessions are stored only in localStorage via zustand/persist. This migration adds a Supabase backup layer só sessions survive localStorage clears and can be accessed across devices.

## Tables

### `chat_sessions`
- One row per conversation
- Fields: id (TEXT PK), agent_id, agent_name, squad_id, squad_type, title, message_count, last_message_at, created_at, updated_at
- RLS: anon full CRUD (same pattern as vault tables)
- Trigger: `set_updated_at()` on update

### `chat_messages`
- One row per message within a session
- Fields: id (TEXT PK), session_id (FK cascade), role (user/agent/system), content, agent_id, agent_name, squad_type, metadata (JSONB), attachments (JSONB), is_streaming, created_at
- RLS: anon full CRUD

## Architecture

- **Primary store**: localStorage (zustand/persist) -- unchanged
- **Backup store**: Supabase -- fire-and-forget writes, merge on rehydrate
- **Service**: `src/services/supabase/chat.ts` following `vault.ts` pattern
- **Store changes**: Add `_syncFromSupabase()` to chatStore, called once on init

## Files

| File | Action |
|------|--------|
| `supabase/migrations/20260321_chat_sessions.sql` | CREATE tables, indexes, RLS, trigger |
| `src/services/supabase/chat.ts` | New service (vault.ts pattern) |
| `src/stores/chatStore.ts` | Add Supabase sync layer |
| `docs/approved-plans/migration-20260321_chat_sessions.md` | This plan |

## Approved

User-requested implementation with explicit acceptance criteria provided.
