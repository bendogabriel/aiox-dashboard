/**
 * Shared API Contract — Engine ↔ Frontend
 *
 * SSOT for types, status values, column names, and SSE events.
 * Both engine routes and frontend services should reference this file.
 *
 * RULE: If you change a type here, grep for its name in both
 *   engine/src/routes/ and src/services/ to update all consumers.
 */

// ─── DB Column Reference (jobs table) ────────────────────
// Source of truth: engine/migrations/001_initial.sql
//
// id            TEXT PRIMARY KEY
// squad_id      TEXT NOT NULL
// agent_id      TEXT NOT NULL
// status        TEXT NOT NULL DEFAULT 'pending'
// priority      INTEGER NOT NULL DEFAULT 2
// input_payload TEXT NOT NULL          ← JSON string, NOT "command"
// output_result TEXT
// workflow_id   TEXT
// started_at    TEXT
// completed_at  TEXT
// created_at    TEXT NOT NULL
// error_message TEXT

// ─── Status Values ───────────────────────────────────────

/** Engine/DB status values (what the engine stores and returns) */
export type EngineJobStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'failed'
  | 'timeout'
  | 'rejected'
  | 'cancelled';

/** Frontend orchestration status values */
export type FrontendTaskStatus =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'awaiting_approval'
  | 'executing'
  | 'completed'
  | 'failed';

/** Maps engine status → frontend status. Use this in any bridge code. */
export const ENGINE_TO_FRONTEND_STATUS: Record<string, FrontendTaskStatus> = {
  pending: 'analyzing',
  started: 'analyzing',
  running: 'analyzing',
  analyzing: 'analyzing',
  planning: 'planning',
  awaiting_approval: 'awaiting_approval',
  executing: 'executing',
  completed: 'completed',
  done: 'completed',
  failed: 'failed',
  timeout: 'failed',
  rejected: 'failed',
  cancelled: 'failed',
};

/** Terminal statuses (engine-side) — polling and SSE should stop for these */
export const ENGINE_TERMINAL_STATUSES: EngineJobStatus[] = ['done', 'failed', 'timeout', 'rejected', 'cancelled'];

/** Terminal statuses (frontend-side) */
export const FRONTEND_TERMINAL_STATUSES: FrontendTaskStatus[] = ['completed', 'failed', 'idle'];

// ─── SSE Event Types ─────────────────────────────────────

/** All SSE events emitted by GET /tasks/:id/stream */
export const SSE_EVENT_TYPES = [
  'task:state',
  'task:analyzing',
  'task:squads-selected',
  'task:planning',
  'task:plan-ready',
  'task:squad-planned',
  'task:workflow-created',
  'task:executing',
  'step:started',
  'step:completed',
  'step:streaming:start',
  'step:streaming:chunk',
  'step:streaming:end',
  'task:completed',
  'task:failed',
] as const;

export type SSEEventType = (typeof SSE_EVENT_TYPES)[number];

// ─── API Request/Response Shapes ─────────────────────────

/** POST /tasks request body */
export interface CreateTaskRequest {
  demand: string;
}

/** POST /tasks response */
export interface CreateTaskResponse {
  taskId: string;
  status: string;
}

/** Agent reference in API responses */
export interface TaskAgentRef {
  id: string;
  name: string;
  squad?: string;
  title?: string;
}

/** Squad selection in task responses */
export interface TaskSquadSelection {
  squadId: string;
  chief: string;
  agentCount: number;
  agents: TaskAgentRef[];
}

/** Workflow reference in task responses */
export interface TaskWorkflow {
  id: string;
  name: string;
  stepCount: number;
}

/** Artifact extracted from agent output */
export interface TaskArtifact {
  id: string;
  type: 'markdown' | 'code' | 'diagram' | 'data' | 'table';
  language?: string;
  filename?: string;
  title?: string;
  content: string;
  lineRange?: [number, number];
}

/** LLM execution metadata */
export interface LLMMetadata {
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

/** Single step output in task response */
export interface TaskStepOutput {
  stepId: string;
  stepName: string;
  output: {
    response?: string;
    content?: string;
    artifacts?: TaskArtifact[];
    agent?: TaskAgentRef;
    role?: string;
    processingTimeMs?: number;
    llmMetadata?: LLMMetadata;
  };
}

/** GET /tasks/:id response — normalized shape for frontend consumption */
export interface TaskResponse {
  id: string;
  demand: string;
  status: string;
  squads: TaskSquadSelection[];
  workflow: TaskWorkflow | null;
  outputs: TaskStepOutput[];
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  totalTokens?: number;
  totalDuration?: number;
  stepCount?: number;
  completedSteps?: number;
  error?: string | null;
}

/** Execution plan step (sent in task:plan-ready) */
export interface ExecutionPlanStep {
  id: string;
  name?: string;
  agent?: TaskAgentRef;
  squadId?: string;
  agentId?: string;
  agentName?: string;
  squadName?: string;
  task?: string;
  role?: string;
  dependsOn?: string[];
  estimatedDuration?: string;
  status?: string;
}

// ─── DB ↔ API Mapping Helpers ────────────────────────────

/** Column name for demand in jobs table. NEVER use "command". */
export const DB_DEMAND_COLUMN = 'input_payload' as const;

/** How demand is stored in input_payload */
export function encodeDemand(demand: string): string {
  return JSON.stringify({ demand });
}

/** How to extract demand from input_payload */
export function decodeDemand(inputPayload: string): string {
  try {
    const parsed = JSON.parse(inputPayload);
    return parsed.demand ?? inputPayload;
  } catch {
    return inputPayload;
  }
}
