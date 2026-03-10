import { create } from 'zustand';
import { supabaseRoadmapService } from '../services/supabase/roadmap';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  tags: string[];
  status: 'planned' | 'in_progress' | 'done';
  quarter?: Quarter;
  squad?: string;
}

export type RoadmapViewMode = 'cards' | 'timeline';

interface RoadmapState {
  features: RoadmapFeature[];
  filter: 'all' | 'must' | 'should' | 'could' | 'wont';
  viewMode: RoadmapViewMode;
  _initialized: boolean;
  setFilter: (filter: RoadmapState['filter']) => void;
  setViewMode: (mode: RoadmapViewMode) => void;
  addFeature: (feature: RoadmapFeature) => void;
  updateFeature: (id: string, updates: Partial<RoadmapFeature>) => void;
  removeFeature: (id: string) => void;
  _initFromSupabase: () => Promise<void>;
}

// Sample data for timeline visualization (used as fallback)
const sampleFeatures: RoadmapFeature[] = [
  { id: '1', title: 'Agent Memory System', description: 'Persistent agent memory across sessions', priority: 'must', impact: 'high', effort: 'high', tags: ['core', 'ai'], status: 'done', quarter: 'Q1', squad: 'development' },
  { id: '2', title: 'Multi-Agent Chat', description: 'Group conversations with multiple agents', priority: 'must', impact: 'high', effort: 'medium', tags: ['chat', 'ux'], status: 'done', quarter: 'Q1', squad: 'development' },
  { id: '3', title: 'AIOX Cockpit Theme', description: 'Brutalist dark theme based on AIOX brandbook', priority: 'should', impact: 'medium', effort: 'medium', tags: ['ui', 'theme'], status: 'done', quarter: 'Q1', squad: 'design' },
  { id: '4', title: 'Knowledge Graph', description: 'Visual knowledge base with graph exploration', priority: 'must', impact: 'high', effort: 'high', tags: ['knowledge', 'ai'], status: 'in_progress', quarter: 'Q2', squad: 'analytics' },
  { id: '5', title: 'Real-time Monitor', description: 'Live agent activity monitoring', priority: 'must', impact: 'high', effort: 'medium', tags: ['monitor', 'realtime'], status: 'in_progress', quarter: 'Q2', squad: 'engineering' },
  { id: '6', title: 'Workflow Canvas', description: 'Visual workflow builder with drag-and-drop', priority: 'should', impact: 'medium', effort: 'high', tags: ['workflow', 'ux'], status: 'in_progress', quarter: 'Q2', squad: 'development' },
  { id: '7', title: 'MCP Marketplace', description: 'Browse and install MCP tools from marketplace', priority: 'should', impact: 'medium', effort: 'medium', tags: ['mcp', 'tools'], status: 'planned', quarter: 'Q3', squad: 'engineering' },
  { id: '8', title: 'Team Collaboration', description: 'Multi-user collaboration with live cursors', priority: 'could', impact: 'high', effort: 'high', tags: ['collab', 'realtime'], status: 'planned', quarter: 'Q3', squad: 'development' },
  { id: '9', title: 'Mobile App', description: 'React Native mobile companion app', priority: 'could', impact: 'medium', effort: 'high', tags: ['mobile', 'native'], status: 'planned', quarter: 'Q4', squad: 'development' },
  { id: '10', title: 'Plugin System', description: 'Extensible plugin architecture for custom agents', priority: 'should', impact: 'high', effort: 'high', tags: ['plugins', 'extensibility'], status: 'planned', quarter: 'Q3', squad: 'engineering' },
  { id: '11', title: 'Analytics Dashboard v2', description: 'Advanced analytics with custom dashboards', priority: 'should', impact: 'medium', effort: 'medium', tags: ['analytics', 'dashboard'], status: 'planned', quarter: 'Q4', squad: 'analytics' },
  { id: '12', title: 'Voice Commands', description: 'Voice input for agent interactions', priority: 'wont', impact: 'low', effort: 'high', tags: ['voice', 'a11y'], status: 'planned', quarter: 'Q4', squad: 'design' },
];

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  features: sampleFeatures,
  filter: 'all',
  viewMode: 'timeline',
  _initialized: false,

  setFilter: (filter) => set({ filter }),
  setViewMode: (mode) => set({ viewMode: mode }),

  addFeature: (feature) => {
    set((state) => ({ features: [...state.features, feature] }));
    // Sync to Supabase in background
    supabaseRoadmapService.upsertFeature(feature).catch(() => {});
  },

  updateFeature: (id, updates) => {
    let updatedFeature: RoadmapFeature | undefined;
    set((state) => {
      const features = state.features.map((f) => {
        if (f.id === id) {
          updatedFeature = { ...f, ...updates };
          return updatedFeature;
        }
        return f;
      });
      return { features };
    });
    // Sync to Supabase in background
    if (updatedFeature) {
      supabaseRoadmapService.upsertFeature(updatedFeature).catch(() => {});
    }
  },

  removeFeature: (id) => {
    set((state) => ({ features: state.features.filter((f) => f.id !== id) }));
    // Sync to Supabase in background
    supabaseRoadmapService.deleteFeature(id).catch(() => {});
  },

  _initFromSupabase: async () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    try {
      const features = await supabaseRoadmapService.listFeatures();
      if (features && features.length > 0) {
        set({ features });
      } else if (features !== null && features.length === 0) {
        // Supabase is available but empty — seed with sample data
        const currentFeatures = get().features;
        for (const feature of currentFeatures) {
          supabaseRoadmapService.upsertFeature(feature).catch(() => {});
        }
      }
      // If features === null, Supabase is unavailable — keep local sample data
    } catch (error) {
      console.error('[RoadmapStore] Failed to init from Supabase:', error);
      // Keep local sample data as fallback
    }
  },
}));

// Initialize from Supabase on first load
useRoadmapStore.getState()._initFromSupabase();
