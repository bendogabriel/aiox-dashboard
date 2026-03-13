import { getEngineUrl } from '../../lib/connection';

// ============================================================
// Engine API Client — Access to AIOS Engine (Bun/Hono on port 4002)
// Routes have NO /api prefix — paths are used as-is (e.g. /health, /jobs).
// ============================================================

const ENGINE_BASE = () => getEngineUrl() || '';

/**
 * Fetch from the engine server (Hono on port 4002).
 * Engine routes have NO /api prefix — paths are used as-is.
 */
async function engineFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = ENGINE_BASE();
  if (!base) {
    throw Object.assign(new Error('Engine not configured'), {
      status: 0,
      isNetworkError: true,
    });
  }
  const url = `${base}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
  } catch (err) {
    throw Object.assign(new Error('Engine unreachable'), {
      status: 0,
      isNetworkError: true,
      cause: err,
    });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Engine ${res.status}`), {
      status: res.status,
      body,
    });
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// -- Types --

export interface EngineHealth {
  status: string;
  version: string;
  uptime_ms: number;
  pid: number;
  ws_clients: number;
}

export interface PoolSlot {
  id: number;
  jobId: string | null;
  pid: number | null;
  squadId: string | null;
  agentId: string | null;
  startedAt: number | null;
  status: 'idle' | 'running';
}

export interface PoolStatus {
  total: number;
  occupied: number;
  idle: number;
  queue_depth: number;
  slots: PoolSlot[];
}

export interface EngineJob {
  id: string;
  squad_id: string;
  agent_id: string;
  status: string;
  priority: number;
  trigger_type: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  attempt: number;
  max_attempts?: number;
  output_result?: string;
  error_message?: string;
  workspace_dir?: string;
  context_hash?: string;
  pid?: number;
  timeout_ms?: number;
}

export interface CronJobDef {
  id: string;
  name?: string;
  description?: string;
  schedule: string;
  squad_id: string;
  agent_id: string;
  enabled: boolean;
  last_run_at?: string;
  last_job_id?: string;
  next_run_at?: string;
  created_at?: string;
}

export interface WorkflowDef {
  id: string;
  name: string;
  phases: number;
  description?: string;
  type?: string;
}

export interface WorkflowState {
  id: string;
  workflowId: string;
  definitionId: string;
  currentPhase: string;
  status: string;
  iterationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorityCheckResult {
  allowed: boolean;
  reason?: string;
  suggestAgent?: string;
}

export interface BundleInfo {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  agentCount: number;
}

export type ResourceType = 'checklists' | 'templates' | 'data' | 'protocols' | 'config' | 'docs' | 'scripts' | 'rules' | 'minds' | 'skills';

export interface ResourceInfo {
  id: string;
  name: string;
  squadId: string;
  type: ResourceType;
  file: string;
  filePath: string;
  description?: string;
  format: string;
  checkboxTotal?: number;
  checkboxChecked?: number;
  runtime?: string;
  subItems?: number;
}

// -- API --

export const engineApi = {
  // System
  health: () => engineFetch<EngineHealth>('/health'),
  pool: () => engineFetch<PoolStatus>('/pool'),
  resizePool: (size: number) =>
    engineFetch<PoolStatus>('/pool/resize', {
      method: 'POST',
      body: JSON.stringify({ size }),
    }),

  // Jobs — Fastify route: /api/jobs
  listJobs: (params?: { status?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return engineFetch<{ jobs: EngineJob[] }>(`/jobs${q ? `?${q}` : ''}`);
  },
  getJob: (id: string) => engineFetch<{ job: EngineJob }>(`/jobs/${id}`),
  getJobLogs: (id: string, tail = 100) =>
    engineFetch<{ logs: string[]; hasMore: boolean }>(`/jobs/${id}/logs?tail=${tail}`),
  cancelJob: (id: string) => engineFetch<{ status: string }>(`/jobs/${id}`, { method: 'DELETE' }),

  // Execute — Fastify route: /api/execute
  executeAgent: (data: {
    squadId: string;
    agentId: string;
    message: string;
    priority?: number;
  }) => engineFetch<{ executionId: string; status: string }>('/execute/agent', {
    method: 'POST',
    body: JSON.stringify({
      squadId: data.squadId,
      agentId: data.agentId,
      input: { message: data.message },
      options: data.priority !== undefined ? { priority: data.priority } : undefined,
    }),
  }),

  // Workflows — Fastify route: /api/execute/workflows
  listWorkflowDefs: () => engineFetch<{ workflows: WorkflowDef[] }>('/execute/workflows'),
  startWorkflow: (data: {
    workflowId: string;
    input: Record<string, unknown>;
    parentJobId?: string;
  }) => engineFetch<{ workflowId: string; definitionId: string; status: string }>('/execute/orchestrate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getWorkflowState: (id: string) =>
    engineFetch<{ state: WorkflowState }>(`/execute/orchestrate/${id}`),
  listActiveWorkflows: () =>
    engineFetch<{ workflows: WorkflowState[] }>('/execute/orchestrate/active'),

  // Webhooks — Fastify route: /api/webhooks
  triggerOrchestrator: (data: {
    message: string;
    callback_url?: string;
    priority?: number;
  }) => engineFetch<{ job_id: string; routed_to: { squad: string; agent: string } }>(
    '/webhooks/orchestrator',
    { method: 'POST', body: JSON.stringify(data) },
  ),
  triggerSquad: (squadId: string, data: {
    message: string;
    agentId?: string;
    callback_url?: string;
  }) => engineFetch<{ job_id: string; squad_id: string; agent_id: string }>(
    `/webhooks/${squadId}`,
    { method: 'POST', body: JSON.stringify(data) },
  ),

  // Cron/Scheduler — Fastify route: /api/scheduler
  listCrons: () => engineFetch<{ crons: CronJobDef[] }>('/cron'),
  createCron: (data: {
    name: string;
    schedule: string;
    squad_id: string;
    agent_id: string;
    message: string;
  }) => engineFetch<{ cron: CronJobDef }>('/cron', {
    method: 'POST',
    body: JSON.stringify({
      squadId: data.squad_id,
      agentId: data.agent_id,
      schedule: data.schedule,
      description: data.name,
      input: data.message ? { message: data.message } : undefined,
    }),
  }),
  toggleCron: (id: string, enabled: boolean) =>
    engineFetch<{ cron: CronJobDef }>(`/cron/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),
  deleteCron: (id: string) => engineFetch<{ status: string }>(`/cron/${id}`, { method: 'DELETE' }),

  // Memory — Fastify route: /api/memory
  storeMemory: (scope: string, data: { content: string; metadata?: Record<string, unknown> }) =>
    engineFetch<{ id: string }>(`/memory/${scope}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recallMemory: (scope: string, query: string, limit?: number) => {
    return engineFetch<{ memories: Array<{ id: string; content: string; score?: number }> }>(
      '/memory/recall',
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          scopes: [scope],
          limit: limit || 10,
        }),
      },
    );
  },

  // Authority — Fastify route: /api/audit
  checkAuthority: (agentId: string, operation: string, squadId: string) =>
    engineFetch<AuthorityCheckResult>('/authority/check', {
      method: 'POST',
      body: JSON.stringify({ agentId, operation, squadId }),
    }),
  getAuditLog: (limit?: number) =>
    engineFetch<{ entries: Array<Record<string, unknown>> }>(
      `/authority/audit${limit ? `?limit=${limit}` : ''}`,
    ),
  reloadAuthority: () =>
    engineFetch<{ status: string }>('/authority/reload', { method: 'POST' }),

  // Bundles
  listBundles: () =>
    engineFetch<{ bundles: BundleInfo[]; active: string | null }>('/bundles'),
  activateBundle: (bundleId: string | null) =>
    engineFetch<{ active: string | null }>('/bundles/activate', {
      method: 'POST',
      body: JSON.stringify({ bundleId }),
    }),

  // Registry — Fastify routes: /api/agents, /api/squads, /api/workflows, /api/tasks
  getProjectInfo: () =>
    engineFetch<{
      projectRoot: string;
      aiosCore: string;
      squads: string;
      rules: string;
      hasAiosCore: boolean;
      hasSquads: boolean;
      hasRules: boolean;
    }>('/registry/project'),

  getRegistrySquads: () =>
    engineFetch<{
      squads: Array<{
        id: string;
        name: string;
        description?: string;
        domain?: string;
        agentCount: number;
        taskCount: number;
        workflowCount: number;
        checklistCount: number;
        templateCount: number;
        dataCount: number;
        protocolCount: number;
        configCount: number;
        docCount: number;
        scriptCount: number;
        ruleCount: number;
        mindCount: number;
        skillCount: number;
        hasConfig: boolean;
      }>;
      count: number;
      projectRoot: string;
    }>('/squads'),

  getRegistryAgents: (squad?: string) => {
    const qs = squad ? `?squad=${encodeURIComponent(squad)}` : '';
    return engineFetch<{
      agents: Array<{
        id: string;
        name: string;
        squadId: string;
        role?: string;
        description?: string;
        filePath: string;
      }>;
      count: number;
    }>(`/agents${qs}`);
  },

  getRegistryAgent: async (squadId: string, agentId: string) => {
    const res = await engineFetch<{
      agent: {
        id: string;
        name: string;
        squad: string;
        tier?: number;
        title?: string;
        description?: string;
        content?: string;
      };
    }>(`/agents/${squadId}/${agentId}`);
    // Normalize: engine returns { agent: { squad, title } }, callers expect { squadId, role }
    const a = res.agent;
    return {
      id: a.id,
      squadId: a.squad,
      name: a.name,
      role: a.title,
      description: a.description,
      content: a.content || '',
      filePath: '',
    };
  },

  getRegistryWorkflows: (squad?: string) => {
    const qs = squad ? `?squad=${encodeURIComponent(squad)}` : '';
    return engineFetch<{
      workflows: Array<{ id: string; name: string; squadId: string; description: string; phases: number; file: string }>;
      count: number;
    }>(`/workflows${qs}`);
  },

  getRegistryTasks: (squad?: string) => {
    const qs = squad ? `?squad=${encodeURIComponent(squad)}` : '';
    return engineFetch<{
      tasks: Array<{ id: string; name: string; squadId: string; command?: string; agent?: string; purpose?: string; file: string }>;
      count: number;
    }>(`/tasks${qs}`);
  },

  getRegistryCommands: (squad?: string) => {
    const qs = squad ? `?squad=${encodeURIComponent(squad)}` : '';
    return engineFetch<{
      commands: Array<{ id: string; name: string; squadId: string; agentId?: string; command: string; purpose?: string; file: string }>;
      count: number;
    }>(`/commands${qs}`);
  },

  // Resources — discovery of checklists, templates, data, protocols, etc.
  getRegistryResources: (type?: ResourceType, squad?: string) => {
    const qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (squad) qs.set('squad', squad);
    const q = qs.toString();
    return engineFetch<{
      resources: ResourceInfo[];
      count: number;
      types: ResourceType[];
    }>(`/registry/resources${q ? `?${q}` : ''}`);
  },

  getResourceDetail: (type: ResourceType, squadId: string, id: string) =>
    engineFetch<{
      id: string;
      squadId: string;
      type: ResourceType;
      name: string;
      format: string;
      content?: string;
      files?: Array<{ path: string; name: string }>;
      filePath: string;
    }>(`/registry/resources/${type}/${squadId}/${encodeURIComponent(id)}`),

  getResourceTypes: () =>
    engineFetch<{ types: ResourceType[] }>('/registry/resource-types'),

  // Integrations — Fastify route: /api/integrations
  listIntegrations: () =>
    engineFetch<Array<{
      id: string;
      status: string;
      config: Record<string, string>;
      message: string | null;
      last_checked: number | null;
    }>>('/integrations'),

  getIntegration: (id: string) =>
    engineFetch<{
      id: string;
      status: string;
      config: Record<string, string>;
      message: string | null;
    }>(`/integrations/${id}`),

  upsertIntegration: (id: string, data: { status?: string; config?: Record<string, string>; message?: string }) =>
    engineFetch<{ ok: boolean; id: string }>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Secrets vault — Fastify route: /api/secrets
  listSecrets: (integrationId?: string) => {
    const qs = integrationId ? `?integration=${encodeURIComponent(integrationId)}` : '';
    return engineFetch<Array<{ key: string; integration_id: string | null; updated_at: string }>>(
      `/secrets/list${qs}`,
    );
  },

  storeSecret: (key: string, value: string, integration?: string) =>
    engineFetch<{ ok: boolean; key: string }>('/secrets', {
      method: 'POST',
      body: JSON.stringify({ key, value, integration }),
    }),

  getSecretPreview: (key: string) =>
    engineFetch<{ key: string; exists: boolean; preview: string }>(`/secrets/${key}`),

  deleteSecretKey: (key: string) =>
    engineFetch<{ ok: boolean }>(`/secrets/${key}`, { method: 'DELETE' }),
};
