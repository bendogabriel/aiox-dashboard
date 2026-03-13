/**
 * Vault API Client — calls engine vault routes
 */
import { apiClient } from './client';
import type { WorkspaceRow, SpaceRow, DocumentRow } from '../../../engine/src/core/vault-store';

const VAULT_BASE = '/vault';

export const vaultApiService = {
  // ── Workspaces ──

  async listWorkspaces(): Promise<WorkspaceRow[]> {
    return apiClient.get<WorkspaceRow[]>(VAULT_BASE);
  },

  async getWorkspace(id: string): Promise<WorkspaceRow> {
    return apiClient.get<WorkspaceRow>(`${VAULT_BASE}/${id}`);
  },

  async createWorkspace(data: { name: string; icon?: string; description?: string }): Promise<WorkspaceRow> {
    return apiClient.post<WorkspaceRow>(VAULT_BASE, data);
  },

  async updateWorkspace(id: string, data: Record<string, unknown>): Promise<WorkspaceRow> {
    return apiClient.put<WorkspaceRow>(`${VAULT_BASE}/${id}`, data);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await apiClient.delete(`${VAULT_BASE}/${id}`);
  },

  // ── Spaces ──

  async listSpaces(workspaceId: string): Promise<SpaceRow[]> {
    return apiClient.get<SpaceRow[]>(`${VAULT_BASE}/${workspaceId}/spaces`);
  },

  async createSpace(workspaceId: string, data: { name: string; icon?: string; description?: string }): Promise<SpaceRow> {
    return apiClient.post<SpaceRow>(`${VAULT_BASE}/${workspaceId}/spaces`, data);
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
};
