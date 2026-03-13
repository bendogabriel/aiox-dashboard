import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────

export type EngineStatus = 'unknown' | 'discovering' | 'online' | 'offline' | 'error';

export interface EngineHealthData {
  version: string;
  uptime_ms: number;
  ws_clients: number;
  migrations?: number;
}

interface EngineState {
  status: EngineStatus;
  url: string | null;
  health: EngineHealthData | null;
  lastChecked: number | null;
  error: string | null;
  /** Number of consecutive failures (for backoff) */
  failCount: number;
}

interface EngineActions {
  setOnline: (url: string, health: EngineHealthData) => void;
  setOffline: (error?: string) => void;
  setDiscovering: () => void;
  reset: () => void;
}

// ── Store ─────────────────────────────────────────────────

export const useEngineStore = create<EngineState & EngineActions>()((set) => ({
  status: 'unknown',
  url: null,
  health: null,
  lastChecked: null,
  error: null,
  failCount: 0,

  setOnline: (url, health) =>
    set({
      status: 'online',
      url,
      health,
      lastChecked: Date.now(),
      error: null,
      failCount: 0,
    }),

  setOffline: (error) =>
    set((state) => ({
      status: 'offline',
      health: null,
      lastChecked: Date.now(),
      error: error || 'Engine unreachable',
      failCount: state.failCount + 1,
    })),

  setDiscovering: () =>
    set({ status: 'discovering' }),

  reset: () =>
    set({
      status: 'unknown',
      url: null,
      health: null,
      lastChecked: null,
      error: null,
      failCount: 0,
    }),
}));
