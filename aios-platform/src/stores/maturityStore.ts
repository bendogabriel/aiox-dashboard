/**
 * Maturity Store — Platform maturity score (6 dimensions + overall L1-L5)
 *
 * Fetches from engine /platform/maturity and caches results.
 */
import { create } from 'zustand';
import { engineApi } from '../services/api/engine';
import type { MaturityReport, MaturityScores } from '../services/api/engine';

interface MaturityState {
  /** Latest maturity report */
  report: MaturityReport | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Last fetch timestamp */
  lastFetched: number | null;

  // Actions
  fetch: () => Promise<void>;
  clear: () => void;
}

export const useMaturityStore = create<MaturityState>()((set, get) => ({
  report: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetch: async () => {
    // Skip if fetched within last 60 seconds
    const last = get().lastFetched;
    if (last && Date.now() - last < 60_000 && get().report) return;

    set({ loading: true, error: null });
    try {
      const report = await engineApi.getMaturity();
      set({ report, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch maturity',
      });
    }
  },

  clear: () => set({ report: null, lastFetched: null, error: null }),
}));

/** Helper: get dimension labels in Portuguese */
export const MATURITY_DIMENSIONS: Array<{ key: keyof MaturityScores; label: string; color: string }> = [
  { key: 'structure', label: 'Estrutura', color: '#D1FF00' },
  { key: 'health', label: 'Saúde', color: '#0099FF' },
  { key: 'integration', label: 'Integração', color: '#ED4609' },
  { key: 'knowledge', label: 'Conhecimento', color: '#3DB2FF' },
  { key: 'execution', label: 'Execução', color: '#F06838' },
  { key: 'tooling', label: 'Ferramentas', color: '#BDBDBD' },
];

/** Helper: get level badge color */
export function getLevelColor(level: string): string {
  if (level.includes('L5')) return '#D1FF00';
  if (level.includes('L4')) return '#0099FF';
  if (level.includes('L3')) return '#F06838';
  if (level.includes('L2')) return '#f59e0b';
  return '#EF4444';
}
