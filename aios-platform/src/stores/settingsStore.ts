import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentColorConfig {
  id: string;
  label: string;
  color: string;
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
  // Demo Mode
  useMockData: boolean;

  // Auto Refresh
  autoRefresh: boolean;
  refreshInterval: number; // seconds

  // Stories Directory
  storiesPath: string;

  // Agent Colors
  agentColors: AgentColorConfig[];
}

interface SettingsActions {
  setUseMockData: (value: boolean) => void;
  setAutoRefresh: (value: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setStoriesPath: (path: string) => void;
  setAgentColor: (agentId: string, color: string) => void;
  resetToDefaults: () => void;
}

const defaultState: SettingsState = {
  useMockData: true,
  autoRefresh: true,
  refreshInterval: 30,
  storiesPath: 'docs/stories',
  agentColors: DEFAULT_AGENT_COLORS,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultState,

      setUseMockData: (value) => set({ useMockData: value }),

      setAutoRefresh: (value) => set({ autoRefresh: value }),

      setRefreshInterval: (seconds) => set({ refreshInterval: seconds }),

      setStoriesPath: (path) => set({ storiesPath: path }),

      setAgentColor: (agentId, color) =>
        set((state) => ({
          agentColors: state.agentColors.map((a) =>
            a.id === agentId ? { ...a, color } : a
          ),
        })),

      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'aios-settings',
      partialize: (state) => ({
        useMockData: state.useMockData,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        storiesPath: state.storiesPath,
        agentColors: state.agentColors,
      }),
    }
  )
);
