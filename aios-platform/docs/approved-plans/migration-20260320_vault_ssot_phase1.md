# Vault SSOT Phase 1 — Migration Plan

## Approved: 2026-03-13

## Summary
Migration SQL that evolves the Vault from a simple document viewer to a full SSOT (Single Source of Truth) system. Adds Spaces, Sources, Documents v2, Sync Jobs, Taxonomy, Context Packages, and Activity tables.

## Changes

### ALTER vault_workspaces
- Add: slug, description, settings (JSONB), spaces_count, sources_count, total_tokens
- Non-breaking: existing columns unchanged

### New Tables
1. **vault_spaces** — Organizational units within workspaces
2. **vault_sources** — Data source connectors (manual, Google Drive, Notion, etc.)
3. **vault_documents_v2** — Enhanced documents with spaceId, sourceId, contentHash, summary, quality, tags
4. **vault_sync_jobs** — Source synchronization tracking
5. **vault_mappings** — Field mapping for source ETL
6. **vault_taxonomy** — Normalized taxonomy tree (replaces JSONB in workspaces)
7. **vault_context_packages** — Curated document bundles for AI context
8. **vault_activity** — Workspace activity feed

### Data Migration
- INSERT INTO vault_documents_v2 SELECT FROM vault_documents (non-destructive)
- vault_documents table preserved for backward compat

### RLS
- All tables: anon full CRUD (same pattern as existing vault tables)

### Triggers
- set_updated_at() on all tables with updated_at column

## Key Decisions
- TEXT primary keys (consistent with existing vault tables)
- Additive migration (no DROP, no ALTER existing columns)
- vault_documents kept alongside vault_documents_v2
