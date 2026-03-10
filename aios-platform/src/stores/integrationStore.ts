import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';

// ── Types ─────────────────────────────────────────────────

export type IntegrationId =
  | 'engine'
  | 'whatsapp'
  | 'supabase'
  | 'api-keys'
  | 'voice';

export type IntegrationStatus = 'connected' | 'disconnected' | 'checking' | 'error' | 'partial';

export interface IntegrationConfig {
  [key: string]: string;
}

export interface IntegrationEntry {
  id: IntegrationId;
  status: IntegrationStatus;
  lastChecked?: number;
  message?: string;
  config: IntegrationConfig;
}

interface IntegrationState {
  integrations: Record<IntegrationId, IntegrationEntry>;
  setupModalOpen: IntegrationId | null;
}

interface IntegrationActions {
  setStatus: (id: IntegrationId, status: IntegrationStatus, message?: string) => void;
  setConfig: (id: IntegrationId, config: IntegrationConfig) => void;
  openSetup: (id: IntegrationId) => void;
  closeSetup: () => void;
  getIntegration: (id: IntegrationId) => IntegrationEntry;
}

// ── Defaults ──────────────────────────────────────────────

function makeEntry(id: IntegrationId): IntegrationEntry {
  return { id, status: 'disconnected', config: {} };
}

const defaultIntegrations: Record<IntegrationId, IntegrationEntry> = {
  engine: makeEntry('engine'),
  whatsapp: makeEntry('whatsapp'),
  supabase: makeEntry('supabase'),
  'api-keys': makeEntry('api-keys'),
  voice: makeEntry('voice'),
};

// ── Store ─────────────────────────────────────────────────

export const useIntegrationStore = create<IntegrationState & IntegrationActions>()(
  persist(
    (set, get) => ({
      integrations: { ...defaultIntegrations },
      setupModalOpen: null,

      setStatus: (id, status, message) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            [id]: {
              ...state.integrations[id],
              status,
              message,
              lastChecked: Date.now(),
            },
          },
        })),

      setConfig: (id, config) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            [id]: {
              ...state.integrations[id],
              config: { ...state.integrations[id].config, ...config },
            },
          },
        })),

      openSetup: (id) => set({ setupModalOpen: id }),
      closeSetup: () => set({ setupModalOpen: null }),

      getIntegration: (id) => get().integrations[id],
    }),
    {
      name: 'aios-integrations',
      storage: safePersistStorage,
      partialize: (state) => ({
        integrations: state.integrations,
      }),
    },
  ),
);
