/**
 * Connection Profile Store — P10
 *
 * Manages saved configuration profiles (presets + custom)
 * for quick environment switching.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import { useIntegrationStore, type IntegrationId, type IntegrationConfig } from './integrationStore';

// ── Types ─────────────────────────────────────────────────

export interface ConnectionProfile {
  id: string;
  name: string;
  description: string;
  isPreset: boolean;
  createdAt: string;
  configs: Partial<Record<IntegrationId, IntegrationConfig>>;
  settings: ProfileSettings;
}

export interface ProfileSettings {
  engineUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface ConnectionProfileState {
  profiles: ConnectionProfile[];
  activeProfileId: string | null;

  // Actions
  saveCurrentAsProfile: (name: string, description?: string) => string;
  applyProfile: (id: string) => { applied: string[]; notFound: boolean };
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  getProfile: (id: string) => ConnectionProfile | undefined;
  getActiveProfile: () => ConnectionProfile | undefined;
  setActiveProfileId: (id: string | null) => void;
}

// ── Built-in presets ─────────────────────────────────────

const PRESETS: ConnectionProfile[] = [
  {
    id: 'preset:local-dev',
    name: 'Local Dev',
    description: 'Local development with Docker engine on localhost',
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    configs: {
      engine: { url: 'http://localhost:4002' },
      supabase: { url: 'http://localhost:54321' },
    },
    settings: {
      engineUrl: 'http://localhost:4002',
      supabaseUrl: 'http://localhost:54321',
    },
  },
  {
    id: 'preset:docker-compose',
    name: 'Docker Compose',
    description: 'Engine running in Docker Compose network',
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    configs: {
      engine: { url: 'http://engine:4002' },
    },
    settings: {
      engineUrl: 'http://engine:4002',
    },
  },
  {
    id: 'preset:demo',
    name: 'Demo Mode',
    description: 'Offline demo — no external services required',
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    configs: {},
    settings: {},
  },
];

// ── Helpers ──────────────────────────────────────────────

function generateId(): string {
  return `profile:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function captureCurrentConfig(): {
  configs: Partial<Record<IntegrationId, IntegrationConfig>>;
  settings: ProfileSettings;
} {
  const { integrations } = useIntegrationStore.getState();

  const configs: Partial<Record<IntegrationId, IntegrationConfig>> = {};
  for (const [id, entry] of Object.entries(integrations)) {
    if (Object.keys(entry.config).length > 0) {
      configs[id as IntegrationId] = { ...entry.config };
    }
  }

  return {
    configs,
    settings: {
      engineUrl: integrations.engine?.config?.url || undefined,
      supabaseUrl: integrations.supabase?.config?.url || undefined,
    },
  };
}

// ── Store ─────────────────────────────────────────────────

export const useConnectionProfileStore = create<ConnectionProfileState>()(
  persist(
    (set, get) => ({
      profiles: [...PRESETS],
      activeProfileId: null,

      saveCurrentAsProfile: (name, description = '') => {
        const id = generateId();
        const { configs, settings } = captureCurrentConfig();
        const profile: ConnectionProfile = {
          id,
          name,
          description,
          isPreset: false,
          createdAt: new Date().toISOString(),
          configs,
          settings,
        };
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfileId: id,
        }));
        return id;
      },

      applyProfile: (id) => {
        const profile = get().profiles.find((p) => p.id === id);
        if (!profile) return { applied: [], notFound: true };

        const store = useIntegrationStore.getState();
        const applied: string[] = [];

        for (const [intId, config] of Object.entries(profile.configs)) {
          if (config && Object.keys(config).length > 0) {
            store.setConfig(intId as IntegrationId, config);
            applied.push(intId);
          }
        }

        set({ activeProfileId: id });
        return { applied, notFound: false };
      },

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id || p.isPreset),
          activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
        })),

      renameProfile: (id, name) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id && !p.isPreset ? { ...p, name } : p,
          ),
        })),

      getProfile: (id) => get().profiles.find((p) => p.id === id),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return activeProfileId ? profiles.find((p) => p.id === activeProfileId) : undefined;
      },

      setActiveProfileId: (id) => set({ activeProfileId: id }),
    }),
    {
      name: 'aios-connection-profiles',
      storage: safePersistStorage,
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
      merge: (persisted: any, current) => {
        // Ensure presets are always present
        const persistedProfiles = persisted?.profiles || [];
        const presetIds = new Set(PRESETS.map((p) => p.id));
        const customProfiles = persistedProfiles.filter(
          (p: ConnectionProfile) => !presetIds.has(p.id),
        );
        return {
          ...current,
          ...persisted,
          profiles: [...PRESETS, ...customProfiles],
        };
      },
    },
  ),
);
