import { create } from 'zustand';

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  tags: string[];
  status: 'planned' | 'in_progress' | 'done';
}

interface RoadmapState {
  features: RoadmapFeature[];
  filter: 'all' | 'must' | 'should' | 'could' | 'wont';
  setFilter: (filter: RoadmapState['filter']) => void;
  addFeature: (feature: RoadmapFeature) => void;
  removeFeature: (id: string) => void;
}

const mockFeatures: RoadmapFeature[] = [
  {
    id: '1',
    title: 'Real-time Agent Collaboration',
    description: 'Enable multiple agents to work on the same story simultaneously with conflict resolution.',
    priority: 'must',
    impact: 'high',
    effort: 'high',
    tags: ['agents', 'core'],
    status: 'in_progress',
  },
  {
    id: '2',
    title: 'Automated QA Pipeline',
    description: 'End-to-end automated testing pipeline triggered on story completion.',
    priority: 'must',
    impact: 'high',
    effort: 'medium',
    tags: ['qa', 'automation'],
    status: 'planned',
  },
  {
    id: '3',
    title: 'Cost Optimization Dashboard',
    description: 'Visual dashboard for tracking and optimizing LLM token usage across agents.',
    priority: 'should',
    impact: 'medium',
    effort: 'medium',
    tags: ['dashboard', 'costs'],
    status: 'in_progress',
  },
  {
    id: '4',
    title: 'Agent Memory Persistence',
    description: 'Cross-session memory for agents using vector DB and semantic search.',
    priority: 'must',
    impact: 'high',
    effort: 'high',
    tags: ['memory', 'agents'],
    status: 'done',
  },
  {
    id: '5',
    title: 'Multi-model Support',
    description: 'Support for switching between Claude, GPT-4, and Gemini per agent.',
    priority: 'should',
    impact: 'medium',
    effort: 'high',
    tags: ['llm', 'flexibility'],
    status: 'planned',
  },
  {
    id: '6',
    title: 'GitHub Actions Integration',
    description: 'Trigger AIOS workflows from GitHub Actions and PR events.',
    priority: 'could',
    impact: 'medium',
    effort: 'low',
    tags: ['github', 'ci-cd'],
    status: 'planned',
  },
  {
    id: '7',
    title: 'Voice Command Interface',
    description: 'Natural language voice commands for hands-free agent interaction.',
    priority: 'wont',
    impact: 'low',
    effort: 'high',
    tags: ['ux', 'experimental'],
    status: 'planned',
  },
  {
    id: '8',
    title: 'Notification System',
    description: 'Push notifications for story completion, QA failures, and agent alerts.',
    priority: 'should',
    impact: 'medium',
    effort: 'low',
    tags: ['ux', 'notifications'],
    status: 'planned',
  },
  {
    id: '9',
    title: 'Plugin Architecture',
    description: 'Allow third-party plugins for custom agents, tools, and workflows.',
    priority: 'could',
    impact: 'high',
    effort: 'high',
    tags: ['architecture', 'extensibility'],
    status: 'planned',
  },
  {
    id: '10',
    title: 'Offline Mode',
    description: 'Basic dashboard functionality without internet connection.',
    priority: 'wont',
    impact: 'low',
    effort: 'medium',
    tags: ['pwa', 'offline'],
    status: 'planned',
  },
];

export const useRoadmapStore = create<RoadmapState>((set) => ({
  features: mockFeatures,
  filter: 'all',
  setFilter: (filter) => set({ filter }),
  addFeature: (feature) => set((state) => ({ features: [...state.features, feature] })),
  removeFeature: (id) => set((state) => ({ features: state.features.filter((f) => f.id !== id) })),
}));
