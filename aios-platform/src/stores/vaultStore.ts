import { create } from 'zustand';
import type { VaultWorkspace, VaultDocument, VaultActivity, VaultTab, VaultSpace, DataSource } from '../types/vault';
import { MOCK_WORKSPACES, MOCK_DOCUMENTS, MOCK_ACTIVITIES, MOCK_SPACES, MOCK_SOURCES } from '../mocks/vault-data';
import { supabaseVaultService } from '../services/supabase/vault';
import { vaultApiService } from '../services/api/vault';

interface VaultStore {
  // State
  workspaces: VaultWorkspace[];
  documents: VaultDocument[];
  spaces: VaultSpace[];
  sources: DataSource[];
  activities: VaultActivity[];
  selectedWorkspaceId: string | null;
  selectedDocumentId: string | null;
  selectedSpaceId: string | null;
  activeTab: VaultTab;
  level: 1 | 2 | 3;
  _initialized: boolean;

  // Actions
  selectWorkspace: (id: string) => void;
  selectDocument: (id: string) => void;
  selectSpace: (id: string | null) => void;
  setActiveTab: (tab: VaultTab) => void;
  goBack: () => void;
  updateDocument: (id: string, content: string) => void;
  createDocument: (data: Partial<VaultDocument>) => Promise<void>;
  uploadDocuments: (files: File[], workspaceId: string) => Promise<void>;
  pasteContent: (data: { content: string; name: string; workspaceId: string; spaceId?: string; category?: string }) => Promise<void>;
  _initFromSupabase: () => Promise<void>;
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  workspaces: MOCK_WORKSPACES,
  documents: MOCK_DOCUMENTS,
  spaces: MOCK_SPACES,
  sources: MOCK_SOURCES,
  activities: MOCK_ACTIVITIES,
  selectedWorkspaceId: null,
  selectedDocumentId: null,
  selectedSpaceId: null,
  activeTab: 'overview',
  level: 1,
  _initialized: false,

  selectWorkspace: (id) =>
    set({ selectedWorkspaceId: id, selectedDocumentId: null, selectedSpaceId: null, activeTab: 'overview', level: 2 }),

  selectDocument: (id) =>
    set({ selectedDocumentId: id, level: 3 }),

  selectSpace: (id) =>
    set({ selectedSpaceId: id }),

  setActiveTab: (tab) =>
    set({ activeTab: tab }),

  goBack: () =>
    set((state) => {
      if (state.level === 3) return { selectedDocumentId: null, level: 2 };
      if (state.level === 2) return { selectedWorkspaceId: null, selectedDocumentId: null, selectedSpaceId: null, level: 1 };
      return {};
    }),

  updateDocument: (id, content) => {
    let updatedDoc: VaultDocument | undefined;
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id === id) {
          updatedDoc = {
            ...doc,
            content,
            tokenCount: Math.ceil(content.split(/\s+/).length / 0.75),
            lastUpdated: new Date().toISOString(),
          };
          return updatedDoc;
        }
        return doc;
      }),
    }));
    // Sync to Supabase in background
    if (updatedDoc) {
      supabaseVaultService.upsertDocumentV2(updatedDoc).catch(() => {});
    }
  },

  createDocument: async (data) => {
    try {
      const result = await vaultApiService.createDocument({
        workspaceId: data.workspaceId || '',
        spaceId: data.spaceId || undefined,
        name: data.name || 'Untitled',
        type: data.type,
        content: data.content,
        categoryId: data.categoryId,
      });
      // Add to local state
      const newDoc: VaultDocument = {
        id: result.id,
        workspaceId: result.workspace_id,
        spaceId: result.space_id || null,
        sourceId: result.source_id || null,
        name: result.name,
        type: result.type as VaultDocument['type'],
        content: result.content,
        contentHash: result.content_hash || '',
        summary: result.summary || '',
        language: result.language || 'pt-BR',
        status: result.status as VaultDocument['status'],
        tokenCount: result.token_count,
        tags: JSON.parse(result.tags || '[]'),
        sourceMetadata: JSON.parse(result.source_metadata || '{}'),
        quality: JSON.parse(result.quality || '{"completeness":0,"freshness":0,"consistency":0}'),
        validatedAt: result.validated_at || null,
        lastUpdated: result.last_updated,
        createdAt: result.created_at,
        source: result.source,
        taxonomy: result.taxonomy,
        consumers: JSON.parse(result.consumers || '[]'),
        categoryId: result.category_id,
      };
      set((state) => ({ documents: [newDoc, ...state.documents] }));
    } catch (error) {
      console.error('[VaultStore] Failed to create document:', error);
    }
  },

  uploadDocuments: async (files, workspaceId) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);

        const spaceId = get().selectedSpaceId;
        if (spaceId) formData.append('spaceId', spaceId);

        const result = await vaultApiService.uploadDocument(formData);
        const newDoc: VaultDocument = {
          id: result.id,
          workspaceId: result.workspace_id,
          spaceId: result.space_id || null,
          sourceId: result.source_id || null,
          name: result.name,
          type: result.type as VaultDocument['type'],
          content: result.content,
          contentHash: result.content_hash || '',
          summary: result.summary || '',
          language: result.language || 'pt-BR',
          status: result.status as VaultDocument['status'],
          tokenCount: result.token_count,
          tags: JSON.parse(result.tags || '[]'),
          sourceMetadata: JSON.parse(result.source_metadata || '{}'),
          quality: JSON.parse(result.quality || '{"completeness":0,"freshness":0,"consistency":0}'),
          validatedAt: result.validated_at || null,
          lastUpdated: result.last_updated,
          createdAt: result.created_at,
          source: result.source,
          taxonomy: result.taxonomy,
          consumers: JSON.parse(result.consumers || '[]'),
          categoryId: result.category_id,
        };
        set((state) => ({ documents: [newDoc, ...state.documents] }));
      } catch (error) {
        console.error(`[VaultStore] Failed to upload ${file.name}:`, error);
      }
    }
  },

  pasteContent: async (data) => {
    try {
      const result = await vaultApiService.pasteDocument(data);
      const newDoc: VaultDocument = {
        id: result.id,
        workspaceId: result.workspace_id,
        spaceId: result.space_id || null,
        sourceId: result.source_id || null,
        name: result.name,
        type: result.type as VaultDocument['type'],
        content: result.content,
        contentHash: result.content_hash || '',
        summary: result.summary || '',
        language: result.language || 'pt-BR',
        status: result.status as VaultDocument['status'],
        tokenCount: result.token_count,
        tags: JSON.parse(result.tags || '[]'),
        sourceMetadata: JSON.parse(result.source_metadata || '{}'),
        quality: JSON.parse(result.quality || '{"completeness":0,"freshness":0,"consistency":0}'),
        validatedAt: result.validated_at || null,
        lastUpdated: result.last_updated,
        createdAt: result.created_at,
        source: result.source,
        taxonomy: result.taxonomy,
        consumers: JSON.parse(result.consumers || '[]'),
        categoryId: result.category_id,
      };
      set((state) => ({ documents: [newDoc, ...state.documents] }));
    } catch (error) {
      console.error('[VaultStore] Failed to paste content:', error);
    }
  },

  _initFromSupabase: async () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    try {
      // Load workspaces
      const workspaces = await supabaseVaultService.listWorkspaces();
      if (workspaces && workspaces.length > 0) {
        set({ workspaces });
      } else if (workspaces !== null && workspaces.length === 0) {
        const currentWorkspaces = get().workspaces;
        for (const workspace of currentWorkspaces) {
          supabaseVaultService.upsertWorkspace(workspace).catch(() => {});
        }
      }

      // Load documents (try v2 first, fall back to v1)
      const documentsV2 = await supabaseVaultService.listDocumentsV2();
      if (documentsV2 && documentsV2.length > 0) {
        set({ documents: documentsV2 });
      } else {
        const documents = await supabaseVaultService.listDocuments();
        if (documents && documents.length > 0) {
          // Convert v1 docs to v2 shape with defaults
          const v2Docs: VaultDocument[] = documents.map((doc) => ({
            ...doc,
            spaceId: null,
            sourceId: null,
            contentHash: '',
            summary: '',
            language: 'pt-BR',
            tags: [],
            sourceMetadata: {},
            quality: { completeness: 0, freshness: 0, consistency: 0 },
            validatedAt: doc.status === 'validated' ? doc.lastUpdated : null,
            createdAt: doc.lastUpdated,
          }));
          set({ documents: v2Docs });
        } else if (documents !== null && documents.length === 0) {
          const currentDocuments = get().documents;
          for (const doc of currentDocuments) {
            supabaseVaultService.upsertDocumentV2(doc).catch(() => {});
          }
        }
      }

      // Load spaces
      const spaces = await supabaseVaultService.listSpaces();
      if (spaces && spaces.length > 0) {
        set({ spaces });
      } else if (spaces !== null && spaces.length === 0) {
        const currentSpaces = get().spaces;
        for (const space of currentSpaces) {
          supabaseVaultService.upsertSpace(space).catch(() => {});
        }
      }

      // Load sources
      const sources = await supabaseVaultService.listSources();
      if (sources && sources.length > 0) {
        set({ sources });
      }
    } catch (error) {
      console.error('[VaultStore] Failed to init from Supabase:', error);
    }
  },
}));

// Initialize from Supabase on first load
useVaultStore.getState()._initFromSupabase();
