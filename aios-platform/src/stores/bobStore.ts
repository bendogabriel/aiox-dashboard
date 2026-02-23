import { create } from 'zustand';

// Bob Pipeline Types
export interface PipelinePhase {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  duration?: string;
  progress?: number;
}

export interface BobAgent {
  id: string;
  name: string;
  task: string;
  status: 'working' | 'completed' | 'waiting' | 'failed';
}

export interface BobDecision {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  resolved?: boolean;
}

export interface BobError {
  id: string;
  message: string;
  source: string;
  timestamp: string;
}

export interface Pipeline {
  status: 'active' | 'completed' | 'failed' | 'stale';
  currentPhase: string;
  phases: PipelinePhase[];
  agents: BobAgent[];
  errors: BobError[];
  decisions: BobDecision[];
}

interface BobState {
  isActive: boolean;
  pipeline: Pipeline | null;
  errors: BobError[];
  agents: BobAgent[];
  decisions: BobDecision[];
  setActive: (active: boolean) => void;
  setPipeline: (pipeline: Pipeline | null) => void;
  addError: (error: BobError) => void;
  addDecision: (decision: BobDecision) => void;
  resolveDecision: (id: string) => void;
}

export const useBobStore = create<BobState>((set) => ({
  isActive: false,
  pipeline: null,
  errors: [],
  agents: [],
  decisions: [],

  setActive: (active) => set({ isActive: active }),

  setPipeline: (pipeline) =>
    set({
      pipeline,
      isActive: pipeline !== null,
      agents: pipeline?.agents ?? [],
      errors: pipeline?.errors ?? [],
      decisions: pipeline?.decisions ?? [],
    }),

  addError: (error) =>
    set((state) => ({
      errors: [...state.errors, error],
    })),

  addDecision: (decision) =>
    set((state) => ({
      decisions: [...state.decisions, decision],
    })),

  resolveDecision: (id) =>
    set((state) => ({
      decisions: state.decisions.map((d) =>
        d.id === id ? { ...d, resolved: true } : d
      ),
    })),
}));
