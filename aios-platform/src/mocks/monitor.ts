import type { MonitorEvent } from '../stores/monitorStore';

export interface SystemMetrics {
  cpu: number;
  memory: number;
  latency: number;
  throughput: number;
}

export interface MonitorAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  dismissed: boolean;
}

export const mockMetrics: SystemMetrics = {
  cpu: 42,
  memory: 67,
  latency: 128,
  throughput: 1250,
};

export const mockAlerts: MonitorAlert[] = [
  {
    id: 'alert-1',
    message: 'Latência elevada detectada no provider Claude (>200ms)',
    severity: 'warning',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    dismissed: false,
  },
  {
    id: 'alert-2',
    message: 'Taxa de erro acima de 5% nos últimos 10 minutos',
    severity: 'error',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    dismissed: false,
  },
  {
    id: 'alert-3',
    message: 'Nova sessão de agente conectada: @dev (Dex)',
    severity: 'info',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    dismissed: false,
  },
];

export const mockEvents: MonitorEvent[] = [
  {
    id: 'evt-001',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'system',
    agent: 'System',
    description: 'Monitor server iniciado na porta 4001',
  },
  {
    id: 'evt-002',
    timestamp: new Date(Date.now() - 280000).toISOString(),
    type: 'message',
    agent: '@dev',
    description: 'Sessão iniciada para Story 2.3',
  },
  {
    id: 'evt-003',
    timestamp: new Date(Date.now() - 250000).toISOString(),
    type: 'tool_call',
    agent: '@dev',
    description: 'Read: src/components/monitor/LiveMonitor.tsx',
    duration: 45,
    success: true,
  },
  {
    id: 'evt-004',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    type: 'tool_call',
    agent: '@dev',
    description: 'Grep: useMonitorStore pattern search',
    duration: 120,
    success: true,
  },
  {
    id: 'evt-005',
    timestamp: new Date(Date.now() - 220000).toISOString(),
    type: 'tool_call',
    agent: '@dev',
    description: 'Edit: src/stores/monitorStore.ts',
    duration: 30,
    success: true,
  },
  {
    id: 'evt-006',
    timestamp: new Date(Date.now() - 200000).toISOString(),
    type: 'tool_call',
    agent: '@qa',
    description: 'Bash: npm run typecheck',
    duration: 3200,
    success: true,
  },
  {
    id: 'evt-007',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    type: 'error',
    agent: '@dev',
    description: 'TypeError: Cannot read property "phases" of undefined',
    success: false,
  },
  {
    id: 'evt-008',
    timestamp: new Date(Date.now() - 160000).toISOString(),
    type: 'tool_call',
    agent: '@dev',
    description: 'Edit: fix null check in BobOrchestration.tsx',
    duration: 25,
    success: true,
  },
  {
    id: 'evt-009',
    timestamp: new Date(Date.now() - 140000).toISOString(),
    type: 'tool_call',
    agent: '@qa',
    description: 'Bash: npm run lint',
    duration: 2100,
    success: true,
  },
  {
    id: 'evt-010',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'message',
    agent: '@sm',
    description: 'Story 2.4 criada: Implementar MetricsPanel',
  },
  {
    id: 'evt-011',
    timestamp: new Date(Date.now() - 100000).toISOString(),
    type: 'tool_call',
    agent: '@dev',
    description: 'Write: src/components/monitor/MetricsPanel.tsx',
    duration: 15,
    success: true,
  },
  {
    id: 'evt-012',
    timestamp: new Date(Date.now() - 80000).toISOString(),
    type: 'tool_call',
    agent: '@dev',
    description: 'Bash: npm run dev (verificação visual)',
    duration: 1500,
    success: true,
  },
];

export interface AgentStatus {
  id: string;
  name: string;
  status: 'working' | 'idle' | 'waiting';
  task: string;
  duration: string;
  model: string;
}

export const mockAgentStatuses: AgentStatus[] = [
  { id: 'dev', name: '@dev (Dex)', status: 'working', task: 'Implementando MetricsPanel', duration: '4m 32s', model: 'sonnet' },
  { id: 'qa', name: '@qa (Quinn)', status: 'waiting', task: 'Aguardando build para review', duration: '1m 15s', model: 'sonnet' },
  { id: 'sm', name: '@sm (River)', status: 'idle', task: 'Story 2.5 pendente', duration: '-', model: 'haiku' },
  { id: 'architect', name: '@architect (Aria)', status: 'idle', task: '-', duration: '-', model: 'opus' },
];

// ── Agent Monitor mock data (Fase 6) ──────────────────────────

export interface MockAgentMonitor {
  id: string;
  name: string;
  status: 'working' | 'waiting' | 'idle' | 'error';
  phase: string;
  progress: number;
  story: string;
  lastActivity: string;
  model: string;
  squad: string;
  tier: number;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
}

export const mockAgentMonitors: MockAgentMonitor[] = [
  {
    id: 'dev',
    name: '@dev (Dex)',
    status: 'working',
    phase: 'coding',
    progress: 65,
    story: 'Story 2.3',
    lastActivity: new Date(Date.now() - 30000).toISOString(),
    model: 'sonnet',
    squad: 'full-stack-dev',
    tier: 2,
    totalExecutions: 142,
    successRate: 94,
    avgResponseTime: 2800,
  },
  {
    id: 'qa',
    name: '@qa (Quinn)',
    status: 'waiting',
    phase: 'testing',
    progress: 90,
    story: 'Story 2.2',
    lastActivity: new Date(Date.now() - 120000).toISOString(),
    model: 'sonnet',
    squad: 'full-stack-dev',
    tier: 2,
    totalExecutions: 87,
    successRate: 98,
    avgResponseTime: 3400,
  },
  {
    id: 'architect',
    name: '@architect (Aria)',
    status: 'working',
    phase: 'planning',
    progress: 30,
    story: 'Story 2.5',
    lastActivity: new Date(Date.now() - 60000).toISOString(),
    model: 'opus',
    squad: 'full-stack-dev',
    tier: 1,
    totalExecutions: 56,
    successRate: 100,
    avgResponseTime: 4200,
  },
  {
    id: 'sm',
    name: '@sm (River)',
    status: 'idle',
    phase: '',
    progress: 0,
    story: '',
    lastActivity: new Date(Date.now() - 600000).toISOString(),
    model: 'haiku',
    squad: 'full-stack-dev',
    tier: 2,
    totalExecutions: 34,
    successRate: 97,
    avgResponseTime: 1200,
  },
  {
    id: 'po',
    name: '@po (Pax)',
    status: 'idle',
    phase: '',
    progress: 0,
    story: '',
    lastActivity: new Date(Date.now() - 1800000).toISOString(),
    model: 'haiku',
    squad: 'full-stack-dev',
    tier: 2,
    totalExecutions: 22,
    successRate: 100,
    avgResponseTime: 900,
  },
  {
    id: 'devops',
    name: '@devops (Gage)',
    status: 'error',
    phase: 'deploying',
    progress: 45,
    story: 'Story 2.1',
    lastActivity: new Date(Date.now() - 300000).toISOString(),
    model: 'sonnet',
    squad: 'full-stack-dev',
    tier: 2,
    totalExecutions: 28,
    successRate: 82,
    avgResponseTime: 5100,
  },
  {
    id: 'pm',
    name: '@pm (Morgan)',
    status: 'idle',
    phase: '',
    progress: 0,
    story: '',
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    model: 'sonnet',
    squad: 'orquestrador-global',
    tier: 1,
    totalExecutions: 18,
    successRate: 100,
    avgResponseTime: 3600,
  },
];

export interface AgentActivityEntry {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  duration: number;
}

export const mockAgentActivity: AgentActivityEntry[] = [
  { id: 'act-1', agentId: 'dev', timestamp: new Date(Date.now() - 30000).toISOString(), action: 'Write: MetricsPanel.tsx', status: 'success', duration: 15 },
  { id: 'act-2', agentId: 'dev', timestamp: new Date(Date.now() - 60000).toISOString(), action: 'Edit: monitorStore.ts', status: 'success', duration: 30 },
  { id: 'act-3', agentId: 'dev', timestamp: new Date(Date.now() - 90000).toISOString(), action: 'Bash: npm run typecheck', status: 'success', duration: 3200 },
  { id: 'act-4', agentId: 'dev', timestamp: new Date(Date.now() - 120000).toISOString(), action: 'Read: LiveMonitor.tsx', status: 'success', duration: 45 },
  { id: 'act-5', agentId: 'qa', timestamp: new Date(Date.now() - 120000).toISOString(), action: 'Bash: npm run lint', status: 'success', duration: 2100 },
  { id: 'act-6', agentId: 'qa', timestamp: new Date(Date.now() - 180000).toISOString(), action: 'Bash: npm run test', status: 'success', duration: 4500 },
  { id: 'act-7', agentId: 'architect', timestamp: new Date(Date.now() - 60000).toISOString(), action: 'Read: architecture docs', status: 'success', duration: 80 },
  { id: 'act-8', agentId: 'devops', timestamp: new Date(Date.now() - 300000).toISOString(), action: 'Bash: git push origin', status: 'error', duration: 8500 },
  { id: 'act-9', agentId: 'devops', timestamp: new Date(Date.now() - 360000).toISOString(), action: 'Bash: npm run build', status: 'success', duration: 6200 },
  { id: 'act-10', agentId: 'sm', timestamp: new Date(Date.now() - 600000).toISOString(), action: 'Write: Story 2.5 draft', status: 'success', duration: 25 },
];
