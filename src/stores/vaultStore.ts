import { create } from 'zustand';
import type { VaultWorkspace, VaultDocument, VaultActivity, VaultTab } from '../types/vault';
import { MOCK_WORKSPACES, MOCK_DOCUMENTS, MOCK_ACTIVITIES } from '../mocks/vault-data';
import { supabaseVaultService } from '../services/supabase/vault';

interface VaultStore {
  // State
  workspaces: VaultWorkspace[];
  documents: VaultDocument[];
  activities: VaultActivity[];
  selectedWorkspaceId: string | null;
  selectedDocumentId: string | null;
  activeTab: VaultTab;
  level: 1 | 2 | 3;
  _initialized: boolean;

  // Actions
  selectWorkspace: (id: string) => void;
  selectDocument: (id: string) => void;
  setActiveTab: (tab: VaultTab) => void;
  goBack: () => void;
  updateDocument: (id: string, content: string) => void;
  _initFromSupabase: () => Promise<void>;
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  workspaces: MOCK_WORKSPACES,
  documents: MOCK_DOCUMENTS,
  activities: MOCK_ACTIVITIES,
  selectedWorkspaceId: null,
  selectedDocumentId: null,
  activeTab: 'dados',
  level: 1,
  _initialized: false,

  selectWorkspace: (id) =>
    set({ selectedWorkspaceId: id, selectedDocumentId: null, activeTab: 'dados', level: 2 }),

  selectDocument: (id) =>
    set({ selectedDocumentId: id, level: 3 }),

  setActiveTab: (tab) =>
    set({ activeTab: tab }),

  goBack: () =>
    set((state) => {
      if (state.level === 3) return { selectedDocumentId: null, level: 2 };
      if (state.level === 2) return { selectedWorkspaceId: null, selectedDocumentId: null, level: 1 };
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
            tokenCount: content.split(/\s+/).length,
            lastUpdated: new Date().toISOString(),
          };
          return updatedDoc;
        }
        return doc;
      }),
    }));
    // Sync to Supabase in background
    if (updatedDoc) {
      supabaseVaultService.upsertDocument(updatedDoc).catch(() => {});
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
        // Supabase is available but empty — seed with mock data
        const currentWorkspaces = get().workspaces;
        for (const workspace of currentWorkspaces) {
          supabaseVaultService.upsertWorkspace(workspace).catch(() => {});
        }
      }

      // Load documents
      const documents = await supabaseVaultService.listDocuments();
      if (documents && documents.length > 0) {
        set({ documents });
      } else if (documents !== null && documents.length === 0) {
        // Supabase is available but empty — seed with mock data
        const currentDocuments = get().documents;
        for (const doc of currentDocuments) {
          supabaseVaultService.upsertDocument(doc).catch(() => {});
        }
      }
      // If null, Supabase is unavailable — keep local mock data
    } catch (error) {
      console.error('[VaultStore] Failed to init from Supabase:', error);
      // Keep local mock data as fallback
    }
  },
}));

// Initialize from Supabase on first load
useVaultStore.getState()._initFromSupabase();
