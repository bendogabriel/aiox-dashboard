/**
 * Graph Store — Integration graph data (nodes, edges, cross-squad refs)
 *
 * Fetches from engine /platform/graph/stats and /platform/graph/data.
 */
import { create } from 'zustand';
import { engineApi } from '../services/api/engine';
import type { GraphStats } from '../services/api/engine';

export interface GraphNode {
  id: string;
  type: 'squad' | 'task';
  squad: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'depends_on' | 'feeds_into' | 'cross_squad';
  squad?: string;
}

interface GraphState {
  /** Aggregated stats */
  stats: GraphStats | null;
  /** Full graph data (nodes + edges) */
  graphData: { nodes: GraphNode[]; edges: GraphEdge[] } | null;
  /** Loading state */
  loading: boolean;
  /** Error */
  error: string | null;
  /** Last fetch timestamp */
  lastFetched: number | null;

  // Actions
  fetchStats: () => Promise<void>;
  fetchFullGraph: () => Promise<void>;
  clear: () => void;

  // Derived
  getSquadConnections: (squad: string) => GraphEdge[];
  getIsolatedSquads: () => string[];
  getCycles: () => Array<{ cycle: string[]; length: number }>;
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  stats: null,
  graphData: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchStats: async () => {
    const last = get().lastFetched;
    if (last && Date.now() - last < 60_000 && get().stats) return;

    set({ loading: true, error: null });
    try {
      const stats = await engineApi.getGraphStats();
      set({ stats, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch graph stats',
      });
    }
  },

  fetchFullGraph: async () => {
    set({ loading: true, error: null });
    try {
      const data = await engineApi.getGraphData();
      // Normalize graph data into nodes + edges
      const raw = data as { nodes?: GraphNode[]; edges?: GraphEdge[]; [key: string]: unknown };
      set({
        graphData: {
          nodes: raw.nodes || [],
          edges: raw.edges || [],
        },
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch graph data',
      });
    }
  },

  clear: () => set({ stats: null, graphData: null, lastFetched: null, error: null }),

  getSquadConnections: (squad) => {
    const data = get().graphData;
    if (!data) return [];
    return data.edges.filter(e => e.squad === squad || e.source.startsWith(squad) || e.target.startsWith(squad));
  },

  getIsolatedSquads: () => {
    return get().stats?.isolatedSquads || [];
  },

  getCycles: () => {
    return get().stats?.cycles || [];
  },
}));
