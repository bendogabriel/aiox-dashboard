import { create } from 'zustand';
import type { OvernightProgram, Experiment, ProgramAnalytics } from '../types/overnight';

// ── Mock Data ──

const MOCK_PROGRAMS: OvernightProgram[] = [
  {
    id: 'prog-demo-1',
    name: 'Bundle Size Optimizer',
    definitionPath: 'programs/code-optimize/program.md',
    status: 'completed',
    type: 'code-optimize',
    currentIteration: 23,
    maxIterations: 50,
    baselineMetric: 234.5,
    bestMetric: 198.3,
    bestIteration: 19,
    branchName: 'overnight/bundle-size-optimizer/20260309-0100',
    convergenceReason: 'stale_iterations',
    tokensUsed: 187420,
    estimatedCost: 3.42,
    wallClockMs: 6840000,
    triggerType: 'scheduled',
    schedule: '0 1 * * 1-5',
    startedAt: '2026-03-09T01:00:00Z',
    completedAt: '2026-03-09T02:54:00Z',
    createdAt: '2026-03-08T22:00:00Z',
  },
  {
    id: 'prog-demo-2',
    name: 'QA Sweep',
    definitionPath: 'programs/qa-sweep/program.md',
    status: 'running',
    type: 'qa-sweep',
    currentIteration: 8,
    maxIterations: 30,
    baselineMetric: 14,
    bestMetric: 6,
    bestIteration: 7,
    branchName: 'overnight/qa-sweep/20260310-0200',
    convergenceReason: null,
    tokensUsed: 62300,
    estimatedCost: 1.12,
    wallClockMs: 2400000,
    triggerType: 'scheduled',
    schedule: '0 2 * * 1-5',
    startedAt: '2026-03-10T02:00:00Z',
    completedAt: null,
    createdAt: '2026-03-09T22:00:00Z',
  },
  {
    id: 'prog-demo-3',
    name: 'Security Audit',
    definitionPath: 'programs/security-audit/program.md',
    status: 'idle',
    type: 'security-audit',
    currentIteration: 0,
    maxIterations: 30,
    baselineMetric: null,
    bestMetric: null,
    bestIteration: null,
    branchName: null,
    convergenceReason: null,
    tokensUsed: 0,
    estimatedCost: 0,
    wallClockMs: 0,
    triggerType: 'scheduled',
    schedule: '0 3 * * 0',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-03-08T10:00:00Z',
  },
];

const MOCK_EXPERIMENTS: Experiment[] = [
  { id: 'exp-1', programId: 'prog-demo-1', iteration: 1, hypothesis: 'Remove unused lucide-react barrel import in Sidebar.tsx', commitSha: 'a1b2c3d', metricBefore: 234.5, metricAfter: 232.1, delta: -2.4, deltaPct: -1.02, status: 'keep', filesModified: ['src/components/layout/Sidebar.tsx'], durationMs: 45000, tokensUsed: 8200, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:05:00Z' },
  { id: 'exp-2', programId: 'prog-demo-1', iteration: 2, hypothesis: 'Lazy-load SquadsView component in App.tsx', commitSha: 'e4f5g6h', metricBefore: 232.1, metricAfter: 228.7, delta: -3.4, deltaPct: -1.46, status: 'keep', filesModified: ['src/App.tsx'], durationMs: 52000, tokensUsed: 9100, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:10:00Z' },
  { id: 'exp-3', programId: 'prog-demo-1', iteration: 3, hypothesis: 'Replace framer-motion barrel with direct imports', commitSha: 'i7j8k9l', metricBefore: 228.7, metricAfter: 230.2, delta: 1.5, deltaPct: 0.66, status: 'discard', filesModified: ['src/components/layout/Sidebar.tsx', 'src/App.tsx'], durationMs: 61000, tokensUsed: 10300, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:17:00Z' },
  { id: 'exp-4', programId: 'prog-demo-1', iteration: 4, hypothesis: 'Tree-shake icons.ts — export only used icons', commitSha: 'm0n1o2p', metricBefore: 228.7, metricAfter: 225.1, delta: -3.6, deltaPct: -1.57, status: 'keep', filesModified: ['src/lib/icons.ts'], durationMs: 48000, tokensUsed: 7800, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:23:00Z' },
  { id: 'exp-5', programId: 'prog-demo-1', iteration: 5, hypothesis: 'Code-split MarketplaceBrowse into own chunk', commitSha: null, metricBefore: 225.1, metricAfter: null, delta: null, deltaPct: null, status: 'error', filesModified: [], durationMs: 38000, tokensUsed: 6200, errorMessage: 'Build failed: Cannot find module', pipelineStep: null, createdAt: '2026-03-09T01:29:00Z' },
  { id: 'exp-6', programId: 'prog-demo-1', iteration: 6, hypothesis: 'Remove dead export from utils.ts', commitSha: 'q3r4s5t', metricBefore: 225.1, metricAfter: 224.8, delta: -0.3, deltaPct: -0.13, status: 'keep', filesModified: ['src/lib/utils.ts'], durationMs: 32000, tokensUsed: 5400, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:34:00Z' },
  { id: 'exp-7', programId: 'prog-demo-1', iteration: 7, hypothesis: 'Lazy-load BrainstormRoom', commitSha: 'u6v7w8x', metricBefore: 224.8, metricAfter: 219.4, delta: -5.4, deltaPct: -2.40, status: 'keep', filesModified: ['src/App.tsx'], durationMs: 55000, tokensUsed: 8900, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:40:00Z' },
  { id: 'exp-8', programId: 'prog-demo-1', iteration: 8, hypothesis: 'Extract shared motion variants to constants', commitSha: 'y9z0a1b', metricBefore: 219.4, metricAfter: 220.1, delta: 0.7, deltaPct: 0.32, status: 'discard', filesModified: ['src/lib/motion.ts', 'src/App.tsx'], durationMs: 44000, tokensUsed: 7600, errorMessage: null, pipelineStep: null, createdAt: '2026-03-09T01:46:00Z' },
];

// ── Store ──

interface OvernightStore {
  programs: OvernightProgram[];
  experiments: Map<string, Experiment[]>;
  selectedProgramId: string | null;
  selectedExperimentId: string | null;
  level: 1 | 2 | 3;

  selectProgram: (id: string) => void;
  selectExperiment: (id: string) => void;
  goBack: () => void;
  getExperiments: (programId: string) => Experiment[];
}

export const useOvernightStore = create<OvernightStore>((set, get) => ({
  programs: MOCK_PROGRAMS,
  experiments: new Map([
    ['prog-demo-1', MOCK_EXPERIMENTS],
  ]),
  selectedProgramId: null,
  selectedExperimentId: null,
  level: 1,

  selectProgram: (id) =>
    set({ selectedProgramId: id, selectedExperimentId: null, level: 2 }),

  selectExperiment: (id) =>
    set({ selectedExperimentId: id, level: 3 }),

  goBack: () =>
    set((state) => {
      if (state.level === 3) return { selectedExperimentId: null, level: 2 };
      if (state.level === 2) return { selectedProgramId: null, selectedExperimentId: null, level: 1 };
      return {};
    }),

  getExperiments: (programId) => {
    return get().experiments.get(programId) ?? [];
  },
}));
