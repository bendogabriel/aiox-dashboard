/**
 * Vault API Client — calls engine vault routes
 */
import { apiClient } from './client';

// Row types inlined from engine/src/core/vault-store.ts to avoid cross-project import
export interface WorkspaceRow {
  id: string; name: string; slug: string | null; icon: string; description: string;
  status: string; settings: string; spaces_count: number; sources_count: number;
  documents_count: number; templates_count: number; total_tokens: number;
  health_percent: number; last_updated: string; created_at: string; updated_at: string;
}
export interface SpaceRow {
  id: string; workspace_id: string; name: string; slug: string; icon: string;
  description: string; status: string; documents_count: number; total_tokens: number;
  health_percent: number; created_at: string; updated_at: string;
}
export interface DocumentRow {
  id: string; workspace_id: string; space_id: string | null; source_id: string | null;
  name: string; type: string; content: string; content_hash: string; summary: string;
  language: string; status: string; token_count: number; tags: string;
  source_metadata: string; quality: string; validated_at: string | null;
  last_updated: string; source: string; taxonomy: string; consumers: string;
  category_id: string; created_at: string; updated_at: string;
}
export interface SourceRow {
  id: string; workspace_id: string; name: string; type: string; status: string;
  config: string; last_sync_at: string | null; documents_count: number;
  created_at: string; updated_at: string;
}
export interface SyncJobRow {
  id: string; source_id: string; workspace_id: string; space_id: string | null;
  status: string; phase: string; progress_current: number; progress_total: number;
  documents_created: number; documents_updated: number; documents_skipped: number;
  errors: string; started_at: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
}
export interface ContextPackageRow {
  id: string; workspace_id: string; name: string; description: string; status: string;
  filter_criteria: string; document_ids: string; total_tokens: number;
  document_count: number; built_content: string; built_at: string | null;
  created_at: string; updated_at: string;
}

const VAULT_BASE = '/vault';

export const vaultApiService = {
  // ── Workspaces ──

  async listWorkspaces(): Promise<WorkspaceRow[]> {
    return apiClient.get<WorkspaceRow[]>(`${VAULT_BASE}/workspaces`);
  },

  async getWorkspace(id: string): Promise<WorkspaceRow> {
    return apiClient.get<WorkspaceRow>(`${VAULT_BASE}/workspaces/${id}`);
  },

  async createWorkspace(data: { name: string; icon?: string; description?: string }): Promise<WorkspaceRow> {
    return apiClient.post<WorkspaceRow>(`${VAULT_BASE}/workspaces`, data);
  },

  async updateWorkspace(id: string, data: Record<string, unknown>): Promise<WorkspaceRow> {
    return apiClient.put<WorkspaceRow>(`${VAULT_BASE}/workspaces/${id}`, data);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await apiClient.delete(`${VAULT_BASE}/workspaces/${id}`);
  },

  // ── Spaces ──

  async listSpaces(workspaceId: string): Promise<SpaceRow[]> {
    return apiClient.get<SpaceRow[]>(`${VAULT_BASE}/workspaces/${workspaceId}/spaces`);
  },

  async createSpace(workspaceId: string, data: { name: string; icon?: string; description?: string }): Promise<SpaceRow> {
    return apiClient.post<SpaceRow>(`${VAULT_BASE}/workspaces/${workspaceId}/spaces`, data);
  },

  async updateSpace(id: string, data: Record<string, unknown>): Promise<SpaceRow> {
    return apiClient.put<SpaceRow>(`${VAULT_BASE}/spaces/${id}`, data);
  },

  async deleteSpace(id: string): Promise<void> {
    await apiClient.delete(`${VAULT_BASE}/spaces/${id}`);
  },

  // ── Documents ──

  async listDocuments(params?: {
    workspace_id?: string;
    space_id?: string;
    status?: string;
    category?: string;
  }): Promise<DocumentRow[]> {
    return apiClient.get<DocumentRow[]>(`${VAULT_BASE}/documents`, params as Record<string, string>);
  },

  async getDocument(id: string): Promise<DocumentRow> {
    return apiClient.get<DocumentRow>(`${VAULT_BASE}/documents/${id}`);
  },

  async createDocument(data: {
    workspaceId: string;
    spaceId?: string;
    name: string;
    type?: string;
    content?: string;
    categoryId?: string;
  }): Promise<DocumentRow> {
    return apiClient.post<DocumentRow>(`${VAULT_BASE}/documents`, data);
  },

  async updateDocument(id: string, data: Record<string, unknown>): Promise<DocumentRow> {
    return apiClient.put<DocumentRow>(`${VAULT_BASE}/documents/${id}`, data);
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`${VAULT_BASE}/documents/${id}`);
  },

  async validateDocument(id: string): Promise<DocumentRow> {
    return apiClient.post<DocumentRow>(`${VAULT_BASE}/documents/${id}/validate`);
  },

  // ── Upload & Paste ──

  async uploadDocument(formData: FormData): Promise<DocumentRow & { parserMetadata?: Record<string, unknown> }> {
    const baseUrl = apiClient.getBaseUrl();
    const response = await fetch(`${baseUrl}/api${VAULT_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }
    return response.json();
  },

  async pasteDocument(data: {
    content: string;
    name: string;
    workspaceId: string;
    spaceId?: string;
    category?: string;
  }): Promise<DocumentRow> {
    return apiClient.post<DocumentRow>(`${VAULT_BASE}/documents/paste`, data);
  },

  // ── AI Memory Import ──

  async importAiMemory(data: {
    content: string;
    workspaceId: string;
    spaceId?: string;
    provider?: string;
  }): Promise<{ imported: number; provider: string; documents: DocumentRow[] }> {
    return apiClient.post(`${VAULT_BASE}/documents/import-ai-memory`, data);
  },

  // ── Sources ──

  async listSources(workspaceId: string): Promise<SourceRow[]> {
    return apiClient.get<SourceRow[]>(`${VAULT_BASE}/workspaces/${workspaceId}/sources`);
  },

  async createSource(data: { workspaceId: string; name: string; type: string; config?: Record<string, unknown> }): Promise<SourceRow> {
    return apiClient.post<SourceRow>(`${VAULT_BASE}/sources`, data);
  },

  async testSource(id: string): Promise<{ ok: boolean; error?: string }> {
    return apiClient.post(`${VAULT_BASE}/sources/${id}/test`);
  },

  async syncSource(id: string, spaceId?: string): Promise<{ jobId: string; status: string }> {
    return apiClient.post(`${VAULT_BASE}/sources/${id}/sync`, { spaceId });
  },

  async deleteSource(id: string): Promise<void> {
    await apiClient.delete(`${VAULT_BASE}/sources/${id}`);
  },

  // ── Sync Jobs ──

  async getSyncJob(id: string): Promise<SyncJobRow> {
    return apiClient.get<SyncJobRow>(`${VAULT_BASE}/sync-jobs/${id}`);
  },

  // ── AI Services ──

  async classifyDocument(content: string, name: string): Promise<{ category: string; type: string; confidence: number; reasoning: string }> {
    return apiClient.post(`${VAULT_BASE}/ai/classify`, { content, name });
  },

  async summarizeDocument(content: string): Promise<{ summary: string }> {
    return apiClient.post(`${VAULT_BASE}/ai/summarize`, { content });
  },

  async scoreQuality(content: string, name: string): Promise<{ completeness: number; freshness: number; consistency: number; issues: string[] }> {
    return apiClient.post(`${VAULT_BASE}/ai/quality-score`, { content, name });
  },

  async generateTags(content: string, name: string): Promise<{ tags: string[] }> {
    return apiClient.post(`${VAULT_BASE}/ai/generate-tags`, { content, name });
  },

  // ── Context Packages ──

  async listPackages(workspaceId?: string): Promise<ContextPackageRow[]> {
    return apiClient.get<ContextPackageRow[]>(`${VAULT_BASE}/packages`, workspaceId ? { workspace_id: workspaceId } : undefined);
  },

  async createPackage(data: { workspaceId: string; name: string; description?: string; filterCriteria?: Record<string, unknown>; documentIds?: string[] }): Promise<ContextPackageRow> {
    return apiClient.post<ContextPackageRow>(`${VAULT_BASE}/packages`, data);
  },

  async buildPackage(id: string): Promise<{ totalTokens: number; documentCount: number; package: ContextPackageRow }> {
    return apiClient.post(`${VAULT_BASE}/packages/${id}/build`);
  },

  async exportPackage(id: string, format: 'markdown' | 'json' | 'yaml' = 'markdown'): Promise<string> {
    const baseUrl = apiClient.getBaseUrl();
    const response = await fetch(`${baseUrl}/api${VAULT_BASE}/packages/${id}/export?format=${format}`);
    if (!response.ok) throw new Error('Export failed');
    return response.text();
  },

  async deletePackage(id: string): Promise<void> {
    await apiClient.delete(`${VAULT_BASE}/packages/${id}`);
  },
};
