/**
 * Orchestration store.
 * Tracks multi-task orchestration state, background completions,
 * badge display, toast triggers, and live task for ActivityPanel.
 *
 * Tier 1: Reconnection — state survives route changes (in-memory).
 * Tier 2: Global manager — SSE connections managed outside components.
 * Tier 3: Multi-task — taskMap supports concurrent orchestrations.
 */
import { create } from 'zustand';
import type {
  AgentOutput,
  StreamingOutput,
  TaskEvent,
  SquadSelection,
  ExecutionPlan,
} from '../components/orchestration/orchestration-types';

// ─── Types ───────────────────────────────────────────────────

type TaskStatus =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'awaiting_approval'
  | 'executing'
  | 'completed'
  | 'failed';

interface OrchestrationNotification {
  taskId: string;
  demand: string;
  status: 'completed' | 'failed';
  timestamp: number;
}

/** Full task state stored in taskMap. Arrays only (no Map/Set). */
export interface OrchestrationTaskState {
  taskId: string | null;
  status: TaskStatus;
  demand: string;
  selectedSquads: string[];
  squadSelections: SquadSelection[];
  workflowId: string | null;
  workflowSteps: Array<{ id: string; name: string }>;
  currentStep: string | null;
  agentOutputs: AgentOutput[];
  streamingOutputs: StreamingOutput[];
  error: string | null;
  events: TaskEvent[];
  startTime: number | null;
  plan: ExecutionPlan | null;
}

/** Backward-compat snapshot for ActivityPanel (OrchestrationActivityPanel). */
export interface OrchestrationTaskSnapshot {
  taskId: string | null;
  status: TaskStatus;
  demand: string;
  squadSelections: Array<{
    squadId: string;
    chief: string;
    agentCount: number;
    agents: Array<{ id: string; name: string }>;
  }>;
  agentOutputs: Array<{
    stepId: string;
    stepName: string;
    agent: { id: string; name: string; squad: string };
    role: string;
    response: string;
    processingTimeMs: number;
    llmMetadata?: {
      provider: string;
      model: string;
      inputTokens?: number;
      outputTokens?: number;
    };
  }>;
  streamingAgents: Array<{
    agentId: string;
    agentName: string;
    squad: string;
    role: string;
  }>;
  events: Array<{ event: string; timestamp?: string }>;
  error: string | null;
  startTime: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────

const RUNNING_STATUSES: TaskStatus[] = [
  'analyzing',
  'planning',
  'awaiting_approval',
  'executing',
];

export const defaultTaskState: OrchestrationTaskState = {
  taskId: null,
  status: 'idle',
  demand: '',
  selectedSquads: [],
  squadSelections: [],
  workflowId: null,
  workflowSteps: [],
  currentStep: null,
  agentOutputs: [],
  streamingOutputs: [],
  error: null,
  events: [],
  startTime: null,
  plan: null,
};

function taskToSnapshot(
  task: OrchestrationTaskState
): OrchestrationTaskSnapshot {
  return {
    taskId: task.taskId,
    status: task.status,
    demand: task.demand,
    squadSelections: task.squadSelections,
    agentOutputs: task.agentOutputs.map((o) => ({
      stepId: o.stepId,
      stepName: o.stepName,
      agent: { id: o.agent.id, name: o.agent.name, squad: o.agent.squad },
      role: o.role,
      response: o.response,
      processingTimeMs: o.processingTimeMs,
      llmMetadata: o.llmMetadata,
    })),
    streamingAgents: task.streamingOutputs.map((s) => ({
      agentId: s.agent.id,
      agentName: s.agent.name,
      squad: s.agent.squad,
      role: s.role,
    })),
    events: task.events.map((e) => ({
      event: e.event,
      timestamp: e.timestamp,
    })),
    error: task.error,
    startTime: task.startTime,
  };
}

// ─── Store ───────────────────────────────────────────────────

interface OrchestrationStore {
  // === Multi-task state (Tier 3) ===
  /** All known orchestration tasks keyed by taskId */
  taskMap: Record<string, OrchestrationTaskState>;
  /** Currently focused task (shown in TaskOrchestrator) */
  activeTaskId: string | null;

  // === Multi-task actions ===
  setActiveTask: (id: string | null) => void;
  updateTask: (id: string, update: Partial<OrchestrationTaskState>) => void;
  removeTask: (id: string) => void;
  clearTerminalTasks: () => void;

  // === Backward-compat (existing consumers) ===
  pending: OrchestrationNotification[];
  isRunning: boolean;
  badgeCount: number;
  liveTask: OrchestrationTaskSnapshot | null;

  setRunning: (running: boolean) => void;
  addNotification: (
    notification: Omit<OrchestrationNotification, 'timestamp'>
  ) => void;
  clearPending: () => void;
  dismiss: (taskId: string) => void;
  /** @deprecated Use orchestrationManager — kept for ActivityPanel compat */
  setLiveTask: (task: OrchestrationTaskSnapshot | null) => void;
}

export const useOrchestrationStore = create<OrchestrationStore>((set, get) => ({
  // === Multi-task state ===
  taskMap: {},
  activeTaskId: null,

  // === Multi-task actions ===
  setActiveTask: (id) =>
    set((state) => {
      const task = id ? state.taskMap[id] : null;
      return {
        activeTaskId: id,
        liveTask: task ? taskToSnapshot(task) : null,
      };
    }),

  updateTask: (id, update) =>
    set((state) => {
      const existing = state.taskMap[id] || { ...defaultTaskState };
      const updated = { ...existing, ...update };
      const newMap = { ...state.taskMap, [id]: updated };

      // Auto-derive isRunning from all tasks
      const isRunning = Object.values(newMap).some((t) =>
        RUNNING_STATUSES.includes(t.status)
      );

      // Auto-sync liveTask for backward compat (only if this is the active task)
      const liveTask =
        state.activeTaskId === id
          ? taskToSnapshot(updated)
          : state.activeTaskId && newMap[state.activeTaskId]
            ? taskToSnapshot(newMap[state.activeTaskId])
            : state.liveTask;

      return { taskMap: newMap, isRunning, liveTask };
    }),

  removeTask: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.taskMap;
      const isRunning = Object.values(rest).some((t) =>
        RUNNING_STATUSES.includes(t.status)
      );
      const activeTaskId =
        state.activeTaskId === id ? null : state.activeTaskId;
      const liveTask =
        activeTaskId && rest[activeTaskId]
          ? taskToSnapshot(rest[activeTaskId])
          : null;
      return { taskMap: rest, isRunning, activeTaskId, liveTask };
    }),

  clearTerminalTasks: () =>
    set((state) => {
      const filtered = Object.fromEntries(
        Object.entries(state.taskMap).filter(
          ([, t]) => !['completed', 'failed'].includes(t.status)
        )
      );
      return { taskMap: filtered };
    }),

  // === Backward-compat ===
  pending: [],
  isRunning: false,
  badgeCount: 0,
  liveTask: null,

  setRunning: (running) => set({ isRunning: running }),

  addNotification: (notification) =>
    set((state) => {
      const item = { ...notification, timestamp: Date.now() };
      const pending = [...state.pending, item];
      // Re-derive isRunning from taskMap (a notification means a task finished)
      const isRunning = Object.values(state.taskMap).some((t) =>
        RUNNING_STATUSES.includes(t.status)
      );
      return { pending, badgeCount: pending.length, isRunning };
    }),

  clearPending: () => set({ pending: [], badgeCount: 0 }),

  dismiss: (taskId) =>
    set((state) => {
      const pending = state.pending.filter((n) => n.taskId !== taskId);
      return { pending, badgeCount: pending.length };
    }),

  setLiveTask: (task) => set({ liveTask: task }),
}));
