/**
 * Quality Gate Store — Per-squad quality gate compliance
 *
 * Fetches from engine /platform/quality-gates and provides
 * filtering/aggregation for the dashboard.
 */
import { create } from 'zustand';
import { engineApi } from '../services/api/engine';
import type { QualityGateReport, QualityGateSquadResult } from '../services/api/engine';

interface QualityGateState {
  /** Full report */
  report: QualityGateReport | null;
  /** Loading state */
  loading: boolean;
  /** Error */
  error: string | null;
  /** Last fetch timestamp */
  lastFetched: number | null;
  /** Currently selected squad filter */
  selectedSquad: string | null;

  // Actions
  fetch: (squad?: string) => Promise<void>;
  setSelectedSquad: (squad: string | null) => void;
  clear: () => void;

  // Derived
  getSquadResult: (squad: string) => QualityGateSquadResult | undefined;
  getPassRate: () => number;
  getCriticalFailures: () => QualityGateSquadResult[];
}

export const useQualityGateStore = create<QualityGateState>()((set, get) => ({
  report: null,
  loading: false,
  error: null,
  lastFetched: null,
  selectedSquad: null,

  fetch: async (squad?: string) => {
    const last = get().lastFetched;
    if (last && Date.now() - last < 60_000 && get().report) return;

    set({ loading: true, error: null });
    try {
      const report = await engineApi.getQualityGates(squad);
      set({ report, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch quality gates',
      });
    }
  },

  setSelectedSquad: (squad) => set({ selectedSquad: squad }),

  clear: () => set({ report: null, lastFetched: null, error: null, selectedSquad: null }),

  getSquadResult: (squad) => {
    return get().report?.results.find(r => r.squad === squad);
  },

  getPassRate: () => {
    const report = get().report;
    if (!report || report.totalChecks === 0) return 100;
    return Math.round((report.totalPass / report.totalChecks) * 100);
  },

  getCriticalFailures: () => {
    const report = get().report;
    if (!report) return [];
    return report.results.filter(r => r.criticalFailed > 0);
  },
}));
