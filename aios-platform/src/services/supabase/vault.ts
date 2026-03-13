/**
 * Supabase Vault Service
 * Persistent storage layer for vault workspaces and documents.
 * Falls back gracefully when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { VaultWorkspace, VaultDocument, VaultSpace, DataSource, VaultActivity } from '../../types/vault';

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
    slug: row.name.toLowerCase().replace(/\s+/g, '-'),
    icon: row.icon,
    description: '',
    status: row.status as VaultWorkspace['status'],
    settings: {
      aiModel: 'claude-sonnet',
      freshnessThresholdDays: 30,
      autoClassify: true,
      contextPackageMaxTokens: 100000,
    },
    spacesCount: 0,
    sourcesCount: 0,
    documentsCount: row.documents_count,
    templatesCount: row.templates_count,
    totalTokens: 0,
    healthPercent: row.health_percent,
    lastUpdated: row.last_updated,
    createdAt: row.created_at,
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
    workspaceId: row.workspace_id,
    spaceId: null,
    sourceId: null,
    name: row.name,
    type: row.type as VaultDocument['type'],
    content: row.content,
    contentHash: '',
    summary: '',
    language: 'pt-BR',
    status: row.status as VaultDocument['status'],
    tokenCount: row.token_count,
    tags: [],
    sourceMetadata: {},
    quality: { completeness: 0, freshness: 0, consistency: 0 },
    validatedAt: null,
    lastUpdated: row.last_updated,
    createdAt: row.created_at,
    source: row.source,
    taxonomy: row.taxonomy,
    consumers: (row.consumers as string[]) || [],
    categoryId: row.category_id,
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

  // ── Spaces (v2) ──

  _spacesTableUnavailable: false,

  async listSpaces(workspaceId?: string): Promise<VaultSpace[] | null> {
    if (!supabase || this._spacesTableUnavailable) return null;

    let query = supabase.from('vault_spaces').select('*').order('created_at', { ascending: true });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('vault_spaces')) {
        this._spacesTableUnavailable = true;
        return null;
      }
      console.error('[Supabase] Failed to list spaces:', error.message);
      return null;
    }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      name: row.name as string,
      slug: row.slug as string,
      icon: (row.icon as string) || 'folder',
      description: (row.description as string) || '',
      status: (row.status as VaultSpace['status']) || 'active',
      documentsCount: (row.documents_count as number) || 0,
      totalTokens: (row.total_tokens as number) || 0,
      healthPercent: (row.health_percent as number) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  },

  async upsertSpace(space: VaultSpace): Promise<void> {
    if (!supabase || this._spacesTableUnavailable) return;

    const { error } = await supabase.from('vault_spaces').upsert({
      id: space.id,
      workspace_id: space.workspaceId,
      name: space.name,
      slug: space.slug,
      icon: space.icon,
      description: space.description,
      status: space.status,
      documents_count: space.documentsCount,
      total_tokens: space.totalTokens,
      health_percent: space.healthPercent,
    }, { onConflict: 'id' });

    if (error) console.error('[Supabase] Failed to upsert space:', error.message);
  },

  async deleteSpace(id: string): Promise<void> {
    if (!supabase || this._spacesTableUnavailable) return;
    const { error } = await supabase.from('vault_spaces').delete().eq('id', id);
    if (error) console.error('[Supabase] Failed to delete space:', error.message);
  },

  // ── Sources (v2) ──

  _sourcesTableUnavailable: false,

  async listSources(workspaceId?: string): Promise<DataSource[] | null> {
    if (!supabase || this._sourcesTableUnavailable) return null;

    let query = supabase.from('vault_sources').select('*').order('created_at', { ascending: true });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('vault_sources')) {
        this._sourcesTableUnavailable = true;
        return null;
      }
      console.error('[Supabase] Failed to list sources:', error.message);
      return null;
    }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      name: row.name as string,
      type: row.type as DataSource['type'],
      status: row.status as DataSource['status'],
      config: (row.config as Record<string, unknown>) || {},
      lastSyncAt: (row.last_sync_at as string) || null,
      documentsCount: (row.documents_count as number) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  },

  async upsertSource(source: DataSource): Promise<void> {
    if (!supabase || this._sourcesTableUnavailable) return;

    const { error } = await supabase.from('vault_sources').upsert({
      id: source.id,
      workspace_id: source.workspaceId,
      name: source.name,
      type: source.type,
      status: source.status,
      config: source.config,
      last_sync_at: source.lastSyncAt,
      documents_count: source.documentsCount,
    }, { onConflict: 'id' });

    if (error) console.error('[Supabase] Failed to upsert source:', error.message);
  },

  // ── Documents v2 ──

  _documentsV2TableUnavailable: false,

  async listDocumentsV2(workspaceId?: string): Promise<VaultDocument[] | null> {
    if (!supabase || this._documentsV2TableUnavailable) return null;

    let query = supabase.from('vault_documents_v2').select('*').order('last_updated', { ascending: false });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('vault_documents_v2')) {
        this._documentsV2TableUnavailable = true;
        return null;
      }
      console.error('[Supabase] Failed to list documents v2:', error.message);
      return null;
    }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      spaceId: (row.space_id as string) || null,
      sourceId: (row.source_id as string) || null,
      name: row.name as string,
      type: row.type as VaultDocument['type'],
      content: (row.content as string) || '',
      contentHash: (row.content_hash as string) || '',
      summary: (row.summary as string) || '',
      language: (row.language as string) || 'pt-BR',
      status: row.status as VaultDocument['status'],
      tokenCount: (row.token_count as number) || 0,
      tags: (row.tags as string[]) || [],
      sourceMetadata: (row.source_metadata as Record<string, unknown>) || {},
      quality: (row.quality as VaultDocument['quality']) || { completeness: 0, freshness: 0, consistency: 0 },
      validatedAt: (row.validated_at as string) || null,
      lastUpdated: row.last_updated as string,
      createdAt: row.created_at as string,
      source: (row.source as string) || 'Manual',
      taxonomy: (row.taxonomy as string) || '',
      consumers: (row.consumers as string[]) || [],
      categoryId: (row.category_id as string) || '',
    }));
  },

  async upsertDocumentV2(doc: VaultDocument): Promise<void> {
    if (!supabase || this._documentsV2TableUnavailable) return;

    const { error } = await supabase.from('vault_documents_v2').upsert({
      id: doc.id,
      workspace_id: doc.workspaceId,
      space_id: doc.spaceId,
      source_id: doc.sourceId,
      name: doc.name,
      type: doc.type,
      content: doc.content,
      content_hash: doc.contentHash,
      summary: doc.summary,
      language: doc.language,
      status: doc.status,
      token_count: doc.tokenCount,
      tags: doc.tags,
      source_metadata: doc.sourceMetadata,
      quality: doc.quality,
      validated_at: doc.validatedAt,
      last_updated: doc.lastUpdated,
      source: doc.source,
      taxonomy: doc.taxonomy,
      consumers: doc.consumers,
      category_id: doc.categoryId,
    }, { onConflict: 'id' });

    if (error) console.error('[Supabase] Failed to upsert document v2:', error.message);
  },

  // ── Activity ──

  _activityTableUnavailable: false,

  async listActivities(workspaceId?: string, limit = 20): Promise<VaultActivity[] | null> {
    if (!supabase || this._activityTableUnavailable) return null;

    let query = supabase.from('vault_activity').select('*').order('timestamp', { ascending: false }).limit(limit);
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('vault_activity')) {
        this._activityTableUnavailable = true;
        return null;
      }
      console.error('[Supabase] Failed to list activities:', error.message);
      return null;
    }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      type: row.type as VaultActivity['type'],
      description: row.description as string,
      timestamp: row.timestamp as string,
      workspaceId: row.workspace_id as string,
    }));
  },
};
