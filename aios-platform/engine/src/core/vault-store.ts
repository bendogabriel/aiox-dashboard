/**
 * Vault persistence via bun:sqlite.
 * Follows the same pattern as task-store.ts.
 */
import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Row types ──

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string | null;
  icon: string;
  description: string;
  status: string;
  settings: string;
  spaces_count: number;
  sources_count: number;
  documents_count: number;
  templates_count: number;
  total_tokens: number;
  health_percent: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceRow {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: string;
  documents_count: number;
  total_tokens: number;
  health_percent: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  workspace_id: string;
  space_id: string | null;
  source_id: string | null;
  name: string;
  type: string;
  content: string;
  content_hash: string;
  summary: string;
  language: string;
  status: string;
  token_count: number;
  tags: string;
  source_metadata: string;
  quality: string;
  validated_at: string | null;
  last_updated: string;
  source: string;
  taxonomy: string;
  consumers: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface SourceRow {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  status: string;
  config: string;
  last_sync_at: string | null;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

// ── DB initialization ──

let db: Database | null = null;

function getDb(): Database {
  if (db) return db;

  const engineRoot = resolve(import.meta.dir, '../..');
  const dbPath = resolve(engineRoot, 'engine.db');
  db = new Database(dbPath, { create: true });
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  const migrationPath = resolve(engineRoot, 'migrations', '002_vault.sql');
  const migration = readFileSync(migrationPath, 'utf-8');
  db.exec(migration);

  return db;
}

// ── Workspaces ──

export function createWorkspace(data: {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
}): string {
  const id = `ws-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');

  getDb()
    .prepare(
      `INSERT INTO vault_workspaces (id, name, slug, icon, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, data.name, slug, data.icon || 'building', data.description || '', now, now);

  return id;
}

export function getWorkspace(id: string): WorkspaceRow | null {
  return getDb()
    .prepare('SELECT * FROM vault_workspaces WHERE id = ?')
    .get(id) as WorkspaceRow | null;
}

export function listWorkspaces(): WorkspaceRow[] {
  return getDb()
    .prepare('SELECT * FROM vault_workspaces ORDER BY created_at ASC')
    .all() as WorkspaceRow[];
}

export function updateWorkspace(id: string, data: Partial<Omit<WorkspaceRow, 'id' | 'created_at'>>): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | null);
    }
  }
  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  getDb()
    .prepare(`UPDATE vault_workspaces SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);
}

export function deleteWorkspace(id: string): void {
  getDb().prepare('DELETE FROM vault_workspaces WHERE id = ?').run(id);
}

// ── Spaces ──

export function createSpace(workspaceId: string, data: {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
}): string {
  const id = `sp-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');

  getDb()
    .prepare(
      `INSERT INTO vault_spaces (id, workspace_id, name, slug, icon, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, workspaceId, data.name, slug, data.icon || 'folder', data.description || '', now, now);

  return id;
}

export function listSpaces(workspaceId: string): SpaceRow[] {
  return getDb()
    .prepare('SELECT * FROM vault_spaces WHERE workspace_id = ? ORDER BY created_at ASC')
    .all(workspaceId) as SpaceRow[];
}

export function getSpace(id: string): SpaceRow | null {
  return getDb()
    .prepare('SELECT * FROM vault_spaces WHERE id = ?')
    .get(id) as SpaceRow | null;
}

export function updateSpace(id: string, data: Partial<Omit<SpaceRow, 'id' | 'workspace_id' | 'created_at'>>): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | null);
    }
  }
  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  getDb()
    .prepare(`UPDATE vault_spaces SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);
}

export function deleteSpace(id: string): void {
  getDb().prepare('DELETE FROM vault_spaces WHERE id = ?').run(id);
}

// ── Documents ──

export function createDocument(data: {
  workspaceId: string;
  spaceId?: string;
  sourceId?: string;
  name: string;
  type?: string;
  content: string;
  contentHash?: string;
  summary?: string;
  language?: string;
  status?: string;
  tokenCount?: number;
  tags?: string[];
  source?: string;
  taxonomy?: string;
  consumers?: string[];
  categoryId?: string;
}): string {
  const id = `doc-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const tokenCount = data.tokenCount ?? Math.ceil(data.content.split(/\s+/).length / 0.75);

  getDb()
    .prepare(
      `INSERT INTO vault_documents (
        id, workspace_id, space_id, source_id, name, type, content, content_hash,
        summary, language, status, token_count, tags, source, taxonomy, consumers,
        category_id, last_updated, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, data.workspaceId, data.spaceId || null, data.sourceId || null,
      data.name, data.type || 'generic', data.content, data.contentHash || '',
      data.summary || '', data.language || 'pt-BR', data.status || 'raw',
      tokenCount, JSON.stringify(data.tags || []),
      data.source || 'Manual', data.taxonomy || '',
      JSON.stringify(data.consumers || []), data.categoryId || '',
      now, now, now
    );

  return id;
}

export function getDocument(id: string): DocumentRow | null {
  return getDb()
    .prepare('SELECT * FROM vault_documents WHERE id = ?')
    .get(id) as DocumentRow | null;
}

export function updateDocument(id: string, data: Partial<Omit<DocumentRow, 'id' | 'created_at'>>): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | null);
    }
  }
  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  getDb()
    .prepare(`UPDATE vault_documents SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);
}

export function listDocuments(filters?: {
  workspaceId?: string;
  spaceId?: string;
  status?: string;
  category?: string;
}): DocumentRow[] {
  let query = 'SELECT * FROM vault_documents WHERE 1=1';
  const params: (string)[] = [];

  if (filters?.workspaceId) {
    query += ' AND workspace_id = ?';
    params.push(filters.workspaceId);
  }
  if (filters?.spaceId) {
    query += ' AND space_id = ?';
    params.push(filters.spaceId);
  }
  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.category) {
    query += ' AND category_id = ?';
    params.push(filters.category);
  }

  query += ' ORDER BY last_updated DESC';

  return getDb().prepare(query).all(...params) as DocumentRow[];
}

export function deleteDocument(id: string): void {
  getDb().prepare('DELETE FROM vault_documents WHERE id = ?').run(id);
}
