import { Brain, Target, Activity, CheckCircle2 } from 'lucide-react';
import { getSquadInlineStyle } from '../../lib/theme';
import type { TaskArtifact } from '../../services/api/tasks';

export type { TaskArtifact };

export interface TaskEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

export interface SquadSelection {
  squadId: string;
  chief: string;
  agentCount: number;
  agents: Array<{ id: string; name: string; squad?: string }>;
}

export interface AgentOutput {
  stepId: string;
  stepName: string;
  agent: {
    id: string;
    name: string;
    squad: string;
    title?: string;
  };
  role: string;
  response: string;
  artifacts?: TaskArtifact[];
  processingTimeMs: number;
  isStreaming?: boolean;
  llmMetadata?: {
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface StreamingOutput {
  stepId: string;
  stepName: string;
  agent: {
    id: string;
    name: string;
    squad: string;
  };
  role: string;
  accumulated: string;
  startedAt: number;
}

export interface ExecutionPlanStep {
  id: string;
  squadId: string;
  agentId: string;
  agentName: string;
  squadName: string;
  task: string;
  dependsOn: string[];
  estimatedDuration?: string;
}

export interface ExecutionPlan {
  summary: string;
  reasoning: string;
  steps: ExecutionPlanStep[];
  estimatedDuration?: string;
}

export interface TaskState {
  taskId: string | null;
  status: 'idle' | 'analyzing' | 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed';
  demand: string;
  selectedSquads: string[];
  squadSelections: SquadSelection[];
  workflowId: string | null;
  workflowSteps: Array<{ id: string; name: string }>;
  currentStep: string | null;
  agentOutputs: AgentOutput[];
  streamingOutputs: Map<string, StreamingOutput>;
  error: string | null;
  events: TaskEvent[];
  startTime: number | null;
  /** Execution plan from orchestrator, shown for approval */
  plan: ExecutionPlan | null;
}

export const initialState: TaskState = {
  taskId: null,
  status: 'idle',
  demand: '',
  selectedSquads: [],
  squadSelections: [],
  workflowId: null,
  workflowSteps: [],
  currentStep: null,
  agentOutputs: [],
  streamingOutputs: new Map(),
  error: null,
  events: [],
  startTime: null,
  plan: null,
};

export const getSquadColor = (squadId: string) => getSquadInlineStyle(squadId);

export const phases = [
  { id: 'analyzing', label: 'Analisando', icon: Brain, color: 'cyan' },
  { id: 'planning', label: 'Planejando', icon: Target, color: 'purple' },
  { id: 'awaiting_approval', label: 'Aprovação', icon: CheckCircle2, color: 'yellow' },
  { id: 'executing', label: 'Executando', icon: Activity, color: 'orange' },
  { id: 'completed', label: 'Concluído', icon: CheckCircle2, color: 'green' },
];

export function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    completed: { label: 'Concluído', color: 'text-[var(--color-status-success)] bg-[var(--color-status-success)]/15' },
    failed: { label: 'Falhou', color: 'text-[var(--bb-error)] bg-[var(--bb-error)]/15' },
    executing: { label: 'Executando', color: 'text-[var(--bb-flare)] bg-[var(--bb-flare)]/15' },
    awaiting_approval: { label: 'Aguardando Aprovação', color: 'text-[var(--bb-warning)] bg-[var(--bb-warning)]/15' },
    planning: { label: 'Planejando', color: 'text-[var(--aiox-gray-muted)] bg-[var(--aiox-gray-muted)]/15' },
    analyzing: { label: 'Analisando', color: 'text-[var(--aiox-blue)] bg-[var(--aiox-blue)]/15' },
    pending: { label: 'Pendente', color: 'text-white/40 bg-white/5' },
    started: { label: 'Iniciado', color: 'text-[var(--aiox-blue)] bg-[var(--aiox-blue)]/15' },
  };
  return map[status] || map.pending;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m${rem}s`;
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
