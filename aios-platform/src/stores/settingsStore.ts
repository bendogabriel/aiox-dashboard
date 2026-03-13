import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import { supabaseSettingsService } from '../services/supabase/settings';

export interface AgentColorConfig {
  id: string;
  label: string;
  color: string;
  squad?: string;
}

const DEFAULT_AGENT_COLORS: AgentColorConfig[] = [
  { id: 'dev', label: 'Dev', color: '#22c55e' },
  { id: 'qa', label: 'QA', color: '#a855f7' },
  { id: 'architect', label: 'Architect', color: '#3b82f6' },
  { id: 'pm', label: 'PM', color: '#f97316' },
  { id: 'po', label: 'PO', color: '#ec4899' },
  { id: 'analyst', label: 'Analyst', color: '#06b6d4' },
  { id: 'devops', label: 'DevOps', color: '#eab308' },
];

interface SettingsState {
  // Auto Refresh
  autoRefresh: boolean;
  refreshInterval: number; // seconds

  // Stories Directory
  storiesPath: string;

  // Agent Colors
  agentColors: AgentColorConfig[];

  // Sync state
  _supabaseSynced: boolean;
}

interface SettingsActions {
  setAutoRefresh: (value: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setStoriesPath: (path: string) => void;
  setAgentColor: (agentId: string, color: string) => void;
  resetToDefaults: () => void;
  /** Load settings from Supabase (called once on init) */
  loadFromSupabase: () => Promise<void>;
}

const defaultState: Omit<SettingsState, '_supabaseSynced'> = {
  autoRefresh: true,
  refreshInterval: 30,
  storiesPath: 'docs/stories',
  agentColors: DEFAULT_AGENT_COLORS,
};

/** Debounce timer for Supabase sync */
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 1500;

/** Fire-and-forget sync of current settings to Supabase */
function syncToSupabase(state: SettingsState) {
  if (!supabaseSettingsService.isAvailable()) return;

  // Debounce to avoid rapid-fire writes
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    const payload = {
      autoRefresh: state.autoRefresh,
      refreshInterval: state.refreshInterval,
      storiesPath: state.storiesPath,
      agentColors: state.agentColors,
    };
    supabaseSettingsService.upsertSetting('settings', payload).catch(() => {
      // Silent fail — local-first, Supabase is optional
    });
  }, SYNC_DEBOUNCE_MS);
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...defaultState,
        _supabaseSynced: false,

        setAutoRefresh: (value) => set({ autoRefresh: value }),

        setRefreshInterval: (seconds) => set({ refreshInterval: seconds }),

        setStoriesPath: (path) => set({ storiesPath: path }),

        setAgentColor: (agentId, color) =>
          set((state) => ({
            agentColors: state.agentColors.map((a) =>
              a.id === agentId ? { ...a, color } : a
            ),
          })),

        resetToDefaults: () => set({ ...defaultState }),

        loadFromSupabase: async () => {
          if (get()._supabaseSynced) return;
          if (!supabaseSettingsService.isAvailable()) {
            set({ _supabaseSynced: true });
            return;
          }

          try {
            const remote = await supabaseSettingsService.getSetting<{
              autoRefresh?: boolean;
              refreshInterval?: number;
              storiesPath?: string;
              agentColors?: AgentColorConfig[];
            }>('settings');

            if (remote) {
              // Merge remote into local — remote wins for fields that exist
              set({
                autoRefresh: remote.autoRefresh ?? get().autoRefresh,
                refreshInterval: remote.refreshInterval ?? get().refreshInterval,
                storiesPath: remote.storiesPath ?? get().storiesPath,
                agentColors: remote.agentColors ?? get().agentColors,
                _supabaseSynced: true,
              });
            } else {
              // No remote data — push current local state to Supabase
              set({ _supabaseSynced: true });
              syncToSupabase(get());
            }
          } catch {
            set({ _supabaseSynced: true });
          }
        },
      }),
      {
        name: 'aios-settings',
        storage: safePersistStorage,
        partialize: (state) => ({
          autoRefresh: state.autoRefresh,
          refreshInterval: state.refreshInterval,
          storiesPath: state.storiesPath,
          agentColors: state.agentColors,
        }),
      }
    )
  )
);

// Subscribe to state changes and sync to Supabase (fire-and-forget)
useSettingsStore.subscribe(
  (state) => ({
    autoRefresh: state.autoRefresh,
    refreshInterval: state.refreshInterval,
    storiesPath: state.storiesPath,
    agentColors: state.agentColors,
  }),
  (_current) => {
    // Only sync after initial load is complete
    const store = useSettingsStore.getState();
    if (store._supabaseSynced) {
      syncToSupabase(store);
    }
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
);

// Trigger initial Supabase load
if (typeof window !== 'undefined') {
  // Delay slightly to let the store rehydrate from localStorage first
  setTimeout(() => {
    useSettingsStore.getState().loadFromSupabase();
  }, 500);
}
