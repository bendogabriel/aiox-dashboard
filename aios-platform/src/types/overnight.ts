// ── Overnight Programs Types ──

export type ProgramStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'exhausted';
export type ProgramType = 'code-optimize' | 'qa-sweep' | 'content-generate' | 'research' | 'vault-enrich' | 'security-audit' | 'custom';
export type ExperimentStatus = 'keep' | 'discard' | 'error' | 'skipped';
export type ConvergenceReason = 'max_iterations' | 'stale_iterations' | 'target_reached' | 'time_exceeded' | 'cost_exceeded' | 'token_exceeded' | 'consecutive_errors';

export interface OvernightProgram {
  id: string;
  name: string;
  definitionPath: string;
  status: ProgramStatus;
  type: ProgramType;
  currentIteration: number;
  maxIterations: number;
  baselineMetric: number | null;
  bestMetric: number | null;
  bestIteration: number | null;
  branchName: string | null;
  convergenceReason: ConvergenceReason | null;
  tokensUsed: number;
  estimatedCost: number;
  wallClockMs: number;
  triggerType: 'manual' | 'scheduled';
  schedule: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Experiment {
  id: string;
  programId: string;
  iteration: number;
  hypothesis: string | null;
  commitSha: string | null;
  metricBefore: number | null;
  metricAfter: number | null;
  delta: number | null;
  deltaPct: number | null;
  status: ExperimentStatus;
  filesModified: string[];
  durationMs: number;
  tokensUsed: number;
  errorMessage: string | null;
  pipelineStep: string | null;
  createdAt: string;
}

export interface ProgramAnalytics {
  program: OvernightProgram;
  stats: {
    total: number;
    keeps: number;
    discards: number;
    errors: number;
    avgDuration: number;
    totalTokens: number;
  };
  metricHistory: Array<{
    iteration: number;
    metricAfter: number;
    status: string;
  }>;
  improvement: string | null;
}

export interface JournalSummary {
  summary: string;
  patterns: {
    strategies: Array<{
      category: string;
      total: number;
      keeps: number;
      successRate: number;
      avgDelta: number;
    }>;
    topFiles: Array<{ file: string; total: number; keeps: number }>;
    totalExperiments: number;
    keepCount: number;
    discardCount: number;
    errorCount: number;
    keepRate: number;
  };
  nearMisses: Array<{
    hypothesis: string;
    deltaPct: number;
  }>;
  total: number;
}
