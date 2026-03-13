/**
 * Supabase Vault Service
 * Persistent storage layer for vault workspaces and documents.
 * Falls back gracefully when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { VaultWorkspace, VaultDocument } from '../../types/vault';

/** Row shape in the vault_workspaces table */
interface VaultWorkspaceRow {
  id: string;
  name: string;
  icon: string;
  status: string;
  documents_count: number;
  templates_count: number;
  health_percent: number;
  last_updated: string;
  categories: unknown;
  template_groups: unknown;
  taxonomy_sections: unknown;
  csuite_personas: unknown;
  created_at: string;
  updated_at: string;
}

/** Row shape in the vault_documents table */
interface VaultDocumentRow {
  id: string;
  name: string;
  type: string;
  content: string;
  status: string;
  token_count: number;
  source: string;
  taxonomy: string;
  consumers: unknown;
  last_updated: string;
  category_id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

/** Convert DB row to VaultWorkspace interface */
function rowToWorkspace(row: VaultWorkspaceRow): VaultWorkspace {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    status: row.status as VaultWorkspace['status'],
    documentsCount: row.documents_count,
    templatesCount: row.templates_count,
    healthPercent: row.health_percent,
    lastUpdated: row.last_updated,
    categories: (row.categories as VaultWorkspace['categories']) || [],
    templateGroups: (row.template_groups as VaultWorkspace['templateGroups']) || [],
    taxonomySections: (row.taxonomy_sections as VaultWorkspace['taxonomySections']) || [],
    csuitePersonas: (row.csuite_personas as VaultWorkspace['csuitePersonas']) || [],
  };
}

/** Convert VaultWorkspace to DB row for upsert */
function workspaceToRow(workspace: VaultWorkspace): VaultWorkspaceRow {
  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    status: workspace.status,
    documents_count: workspace.documentsCount,
    templates_count: workspace.templatesCount,
    health_percent: workspace.healthPercent,
    last_updated: workspace.lastUpdated,
    categories: workspace.categories,
    template_groups: workspace.templateGroups,
    taxonomy_sections: workspace.taxonomySections,
    csuite_personas: workspace.csuitePersonas,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** Convert DB row to VaultDocument interface */
function rowToDocument(row: VaultDocumentRow): VaultDocument {
  return {
    id: row.id,
    name: row.name,
    type: row.type as VaultDocument['type'],
    content: row.content,
    status: row.status as VaultDocument['status'],
    tokenCount: row.token_count,
    source: row.source,
    taxonomy: row.taxonomy,
    consumers: (row.consumers as string[]) || [],
    lastUpdated: row.last_updated,
    categoryId: row.category_id,
    workspaceId: row.workspace_id,
  };
}

/** Convert VaultDocument to DB row for upsert */
function documentToRow(doc: VaultDocument): VaultDocumentRow {
  return {
    id: doc.id,
    name: doc.name,
    type: doc.type,
    content: doc.content,
    status: doc.status,
    token_count: doc.tokenCount,
    source: doc.source,
    taxonomy: doc.taxonomy,
    consumers: doc.consumers,
    last_updated: doc.lastUpdated,
    category_id: doc.categoryId,
    workspace_id: doc.workspaceId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const supabaseVaultService = {
  /** Internal flags: set to true when the tables don't exist yet */
  _workspacesTableUnavailable: false,
  _documentsTableUnavailable: false,

  /** Check if Supabase persistence is available */
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  /** Handle table-not-found errors */
  _handleError(
    error: { code?: string; message?: string },
    operation: string,
    tableName: 'vault_workspaces' | 'vault_documents',
  ): void {
    if (error.code === 'PGRST205' || error.message?.includes(tableName)) {
      if (tableName === 'vault_workspaces') this._workspacesTableUnavailable = true;
      if (tableName === 'vault_documents') this._documentsTableUnavailable = true;
      console.warn(`[Supabase] ${tableName} table not found — using localStorage only`);
    } else {
      console.error(`[Supabase] Failed to ${operation}:`, error.message);
    }
  },

  // ── Workspaces ──

  /** Save or update a workspace in Supabase */
  async upsertWorkspace(workspace: VaultWorkspace): Promise<void> {
    if (!supabase || this._workspacesTableUnavailable) return;

    const row = workspaceToRow(workspace);
    const { error } = await supabase
      .from('vault_workspaces')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      this._handleError(error, 'upsert vault workspace', 'vault_workspaces');
    }
  },

  /** Fetch all workspaces */
  async listWorkspaces(): Promise<VaultWorkspace[] | null> {
    if (!supabase || this._workspacesTableUnavailable) return null;

    const { data, error } = await supabase
      .from('vault_workspaces')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      this._handleError(error, 'list vault workspaces', 'vault_workspaces');
      return null;
    }

    return (data as VaultWorkspaceRow[]).map(rowToWorkspace);
  },

  // ── Documents ──

  /** Save or update a document in Supabase */
  async upsertDocument(doc: VaultDocument): Promise<void> {
    if (!supabase || this._documentsTableUnavailable) return;

    const row = documentToRow(doc);
    const { error } = await supabase
      .from('vault_documents')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      this._handleError(error, 'upsert vault document', 'vault_documents');
    }
  },

  /** Fetch documents, optionally filtered by workspace */
  async listDocuments(workspaceId?: string): Promise<VaultDocument[] | null> {
    if (!supabase || this._documentsTableUnavailable) return null;

    let query = supabase
      .from('vault_documents')
      .select('*')
      .order('last_updated', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      this._handleError(error, 'list vault documents', 'vault_documents');
      return null;
    }

    return (data as VaultDocumentRow[]).map(rowToDocument);
  },

  /** Delete a document by ID */
  async deleteDocument(id: string): Promise<void> {
    if (!supabase || this._documentsTableUnavailable) return;

    const { error } = await supabase
      .from('vault_documents')
      .delete()
      .eq('id', id);

    if (error) {
      this._handleError(error, 'delete vault document', 'vault_documents');
    }
  },
};
