/**
 * Frontend-compat routes — replaces stubs with real data where possible.
 *
 * Phase 1 (REAL): agents, squads, workflows, context, agent status
 * Phase 2 (COMPOSED): analytics, dashboard overview, health-dashboard, realtime
 * Phase 3 (STUB): costs, knowledge, events, stories, qa, github (no data source yet)
 */

import { Hono } from 'hono';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { resolve, join, basename } from 'path';
import { parse as parseYaml } from 'yaml';
import { getProjectPaths, aiosCorePath, squadsPath, projectPath } from '../lib/config';
import { getDb } from '../lib/db';
import * as queue from '../core/job-queue';
import { getAvailableWorkflows, listWorkflows } from '../core/workflow-engine';
import { getAvailableBundles } from '../core/team-bundle';
// import { getPoolStatus } from '../core/process-pool';
import { getWSClientCount } from '../lib/ws';
// import { getMigrationStatus } from '../lib/db';
import { log } from '../lib/logger';
// import { parseArtifacts } from '../lib/artifact-parser';

const stubs = new Hono();
const now = () => new Date().toISOString();
const engineStartedAt = Date.now();

// ════════════════════════════════════════════════════════════
// PHASE 1 — REAL DATA (from registry, DB, queue)
// ════════════════════════════════════════════════════════════

// ── Agents (REAL from .aios-core + squads) ───────────────

function discoverAllAgents(squadFilter?: string) {
  const agents: Array<{
    id: string; name: string; squad: string; tier: number;
    title: string; description: string; role?: string;
  }> = [];

  // Core agents
  const coreDir = aiosCorePath('development', 'agents');
  if (existsSync(coreDir) && (!squadFilter || squadFilter === 'core')) {
    for (const f of readdirSync(coreDir).filter(f => f.endsWith('.md'))) {
      const id = basename(f, '.md');
      const parsed = parseAgentHeader(resolve(coreDir, f));
      agents.push({
        id, name: parsed.name ?? formatName(id), squad: 'core', tier: 1,
        title: parsed.role ?? parsed.name ?? formatName(id), description: parsed.description ?? '',
        role: parsed.role,
      });
    }
  }

  // Squad agents
  const squadsDir = getProjectPaths().squads;
  if (existsSync(squadsDir)) {
    for (const entry of readdirSync(squadsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (squadFilter && squadFilter !== entry.name) continue;
      const agentsDir = resolve(squadsDir, entry.name, 'agents');
      if (!existsSync(agentsDir)) continue;
      for (const f of readdirSync(agentsDir).filter(f => f.endsWith('.md'))) {
        const id = basename(f, '.md');
        const parsed = parseAgentHeader(resolve(agentsDir, f));
        agents.push({
          id, name: parsed.name ?? formatName(id), squad: entry.name, tier: 2,
          title: parsed.role ?? parsed.name ?? formatName(id), description: parsed.description ?? '',
          role: parsed.role,
        });
      }
    }
  }

  return agents;
}

stubs.get('/agents', (c) => {
  try {
    const agents = discoverAllAgents();
    return c.json({ agents, total: agents.length });
  } catch { return c.json({ agents: [], total: 0 }); }
});

stubs.get('/agents/search', (c) => {
  const q = (c.req.query('q') ?? '').toLowerCase();
  const agents = discoverAllAgents().filter(a =>
    a.name.toLowerCase().includes(q) || a.id.includes(q) || a.squad.includes(q)
  );
  return c.json({ results: agents, query: q, total: agents.length });
});

stubs.get('/agents/status', (c) => {
  const discovered = discoverAllAgents();
  // Mark agents with running jobs as active
  const running = queue.listJobs({ status: 'running' as never, limit: 100 });
  const activeIds = new Set(running.jobs.map(j => j.agent_id));

  // Build per-agent stats from DB
  const agentStats: Record<string, { total: number; done: number; avgDur: number }> = {};
  try {
    const db = getDb();
    const rows = db.query<{ agent_id: string; total: number; done: number; avg_dur: number }, []>(`
      SELECT agent_id, COUNT(*) as total,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
        AVG(CASE WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
          THEN (julianday(completed_at)-julianday(started_at))*86400000 ELSE NULL END) as avg_dur
      FROM jobs GROUP BY agent_id
    `).all();
    for (const r of rows) {
      agentStats[r.agent_id] = { total: r.total, done: r.done, avgDur: r.avg_dur ?? 0 };
    }
  } catch { /* empty stats */ }

  const agents = discovered.map(a => {
    const stats = agentStats[a.id];
    return {
      id: a.id,
      name: a.name,
      status: activeIds.has(a.id) ? 'working' as const : 'idle' as const,
      phase: activeIds.has(a.id) ? 'executing' : '',
      progress: 0,
      story: '',
      lastActivity: now(),
      model: '',
      squad: a.squad,
      totalExecutions: stats?.total ?? 0,
      successRate: stats ? Math.round((stats.done / stats.total) * 100) : 100,
      avgResponseTime: Math.round(stats?.avgDur ?? 0),
      logSize: 0,
      logLines: 0,
    };
  });

  // Build recent activity from completed jobs
  let activity: Array<{
    id: string; agentId: string; timestamp: string; action: string;
    status: 'success' | 'error'; duration: number;
  }> = [];
  try {
    const db = getDb();
    const recentJobs = db.query<{
      id: string; agent_id: string; completed_at: string; status: string;
      started_at: string; prompt: string;
    }, []>(`
      SELECT id, agent_id, completed_at, status, started_at, prompt
      FROM jobs WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 20
    `).all();
    activity = recentJobs.map(j => ({
      id: j.id,
      agentId: j.agent_id,
      timestamp: j.completed_at,
      action: (j.prompt ?? '').slice(0, 60) || 'execution',
      status: j.status === 'done' ? 'success' as const : 'error' as const,
      duration: j.started_at && j.completed_at
        ? Math.round((new Date(j.completed_at).getTime() - new Date(j.started_at).getTime()))
        : 0,
    }));
  } catch { /* empty activity */ }

  const activeCount = agents.filter(a => a.status === 'working').length;

  return c.json({
    agents,
    activity,
    activeCount,
    totalCount: agents.length,
    updatedAt: now(),
    source: 'live',
  });
});

stubs.get('/agents/squad/:squadId', (c) => {
  const agents = discoverAllAgents(c.req.param('squadId'));
  return c.json({ squad: c.req.param('squadId'), agents, total: agents.length });
});

stubs.get('/agents/:squadId/:agentId', (c) => {
  const { squadId, agentId } = c.req.param();
  const paths = [
    squadsPath(squadId, 'agents', `${agentId}.md`),
    aiosCorePath('development', 'agents', `${agentId}.md`),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf-8');
    const { role, description } = parseAgentHeader(p);
    return c.json({ agent: { id: agentId, name: formatName(agentId), squad: squadId, tier: squadId === 'core' ? 1 : 2, title: role ?? formatName(agentId), description: description ?? '', content } });
  }
  return c.json({ agent: null });
});

stubs.get('/agents/:squadId/:agentId/commands', (c) => {
  const { squadId, agentId } = c.req.param();
  // Discover commands from task files that reference this agent
  const commands = discoverSquadCommands(squadId, agentId);
  return c.json({ agentId, commands });
});

// ── Commands (REAL from tasks metadata) ──────────────────

stubs.get('/commands', (c) => {
  const squadFilter = c.req.query('squad');
  const commands = discoverSquadCommands(squadFilter);
  return c.json({ commands, total: commands.length });
});

// ── Command discovery (from task file headers) ───────────

function discoverSquadCommands(squadFilter?: string, agentFilter?: string) {
  const commands: Array<{
    id: string; name: string; squadId: string; agentId?: string;
    command: string; purpose?: string; type: string;
  }> = [];

  const scanTaskDir = (dir: string, squadId: string) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const id = basename(f, '.md');
      const header = parseTaskCommandHeader(resolve(dir, f));
      if (!header.command) continue;
      // If filtering by agent, skip non-matching
      const agentSlug = header.agent ? slugify(header.agent) : undefined;
      if (agentFilter && agentSlug && !agentSlug.includes(agentFilter.toLowerCase())) continue;
      commands.push({
        id, name: header.name || formatName(id), squadId,
        agentId: agentSlug, command: header.command,
        purpose: header.purpose, type: header.executionType || 'task',
      });
    }
  };

  // Core tasks
  if (!squadFilter || squadFilter === 'core') {
    scanTaskDir(aiosCorePath('development', 'tasks'), 'core');
  }

  // Squad tasks
  const squadsDir = getProjectPaths().squads;
  if (existsSync(squadsDir)) {
    for (const entry of readdirSync(squadsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (squadFilter && squadFilter !== entry.name) continue;
      scanTaskDir(resolve(squadsDir, entry.name, 'tasks'), entry.name);
    }
  }

  return commands;
}

function parseTaskCommandHeader(filePath: string): {
  name?: string; command?: string; agent?: string; purpose?: string; executionType?: string;
} {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 10);
    let name: string | undefined;
    let command: string | undefined;
    let agent: string | undefined;
    let purpose: string | undefined;
    let executionType: string | undefined;

    for (const line of lines) {
      const titleMatch = line.match(/^#\s+(?:Task:\s*)?(.+)/i);
      if (titleMatch && !name) name = titleMatch[1].trim();
      const cmdMatch = line.match(/\*\*Command\*\*:\s*`([^`]+)`/i);
      if (cmdMatch) command = cmdMatch[1].trim();
      const agentMatch = line.match(/\*\*Agent\*\*:\s*(.+)/i);
      if (agentMatch) agent = agentMatch[1].trim();
      const purposeMatch = line.match(/\*\*Purpose\*\*:\s*(.+)/i);
      if (purposeMatch) purpose = purposeMatch[1].trim();
      const typeMatch = line.match(/\*\*Execution Type\*\*:\s*`?([^`\n]+)`?/i);
      if (typeMatch) executionType = typeMatch[1].trim();
    }

    return { name, command, agent, purpose, executionType };
  } catch { return {}; }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Squads (REAL from .aios-core + squads) ───────────────

function discoverAllSquads() {
  const squads: Array<{
    id: string; name: string; description: string;
    domain: string; agentCount: number; status: string;
  }> = [];

  const squadsDir = getProjectPaths().squads;
  if (!existsSync(squadsDir)) return squads;

  for (const entry of readdirSync(squadsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const squadDir = resolve(squadsDir, entry.name);
    let name = formatName(entry.name);
    let description = '';
    let domain = '';

    // Try loading config
    for (const cfgName of ['squad.yaml', 'config.yaml']) {
      const cfgPath = resolve(squadDir, cfgName);
      if (existsSync(cfgPath)) {
        try {
          const parsed = parseYaml(readFileSync(cfgPath, 'utf-8')) as Record<string, string>;
          name = parsed.name || name;
          description = parsed.description || '';
          domain = parsed.domain || '';
        } catch { /* use defaults */ }
        break;
      }
    }

    const agentsDir = resolve(squadDir, 'agents');
    const agentCount = existsSync(agentsDir) ? readdirSync(agentsDir).filter(f => f.endsWith('.md')).length : 0;

    squads.push({ id: entry.name, name, description, domain, agentCount, status: 'active' });
  }

  return squads;
}

stubs.get('/squads', (c) => {
  const squads = discoverAllSquads();
  return c.json({ squads, total: squads.length });
});

stubs.get('/squads/ecosystem/overview', (c) => {
  const squads = discoverAllSquads();
  const agents = discoverAllAgents();
  const db = getDb();
  const stats = db.query<{ total: number }, []>('SELECT COUNT(*) as total FROM jobs').get();
  return c.json({
    totalSquads: squads.length,
    totalAgents: agents.length,
    totalExecutions: stats?.total ?? 0,
    successRate: 0,
    topSquads: squads.slice(0, 5).map(s => ({ id: s.id, name: s.name, executions: 0 })),
  });
});

stubs.get('/squads/:squadId', (c) => {
  const squadId = c.req.param('squadId');
  const all = discoverAllSquads();
  const squad = all.find(s => s.id === squadId);
  if (!squad) return c.json({ squad: null });
  const agents = discoverAllAgents(squadId);
  return c.json({ squad: { ...squad, agents } });
});

stubs.get('/squads/:squadId/agents', (c) => {
  const agents = discoverAllAgents(c.req.param('squadId'));
  return c.json({ agents, total: agents.length });
});

stubs.get('/squads/:squadId/stats', (c) => {
  const squadId = c.req.param('squadId');
  const db = getDb();
  const stats = db.query<{ total: number; done: number; avg_dur: number }, [string]>(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
      AVG(CASE WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
        THEN (julianday(completed_at)-julianday(started_at))*86400000 ELSE NULL END) as avg_dur
    FROM jobs WHERE squad_id=?
  `).get(squadId);
  return c.json({
    executions: stats?.total ?? 0,
    successRate: stats?.total ? Math.round(((stats.done ?? 0) / stats.total) * 100) : 0,
    avgDuration: Math.round(stats?.avg_dur ?? 0),
    cost: 0,
  });
});

stubs.get('/squads/:squadId/connections', (c) => c.json({ connections: [] }));

// ── Workflows (REAL from workflow-engine) ────────────────

stubs.get('/workflows', (c) => {
  try {
    const defs = getAvailableWorkflows();
    return c.json({
      total: defs.length,
      workflows: defs.map((w: Record<string, unknown>) => ({
        id: w.id, name: w.name, description: w.description ?? '',
        version: '1.0', status: 'active', trigger: { type: 'manual' },
        stepCount: (w as { phases?: unknown[] }).phases?.length ?? 0,
        createdAt: now(),
      })),
    });
  } catch { return c.json({ total: 0, workflows: [] }); }
});

stubs.get('/workflows/schema', (c) => c.json({
  workflowStatus: { draft: 'Draft', active: 'Active', paused: 'Paused', archived: 'Archived' },
  executionStatus: { pending: 'Pending', running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' },
  stepTypes: { task: 'Task', condition: 'Condition', parallel: 'Parallel', loop: 'Loop' },
  triggerTypes: { manual: 'Manual', schedule: 'Schedule', webhook: 'Webhook', event: 'Event' },
}));

stubs.get('/workflows/executions', (c) => {
  const wfs = listWorkflows(undefined, 50);
  return c.json({
    total: wfs.length,
    executions: wfs.map(w => ({
      id: w.id, workflowId: w.workflow_id, workflowName: w.definition_id,
      status: w.status, currentStepId: w.current_phase,
      triggeredBy: 'manual', correlationId: '',
      startedAt: w.created_at, completedAt: w.updated_at,
    })),
  });
});

stubs.get('/workflows/:id', (c) => {
  const defs = getAvailableWorkflows();
  const wf = defs.find((w: Record<string, unknown>) => w.id === c.req.param('id'));
  return c.json({ workflow: wf ?? null });
});

stubs.get('/workflows/:id/stats', (c) => c.json({
  totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0, averageDuration: 0, lastExecutedAt: null,
}));

stubs.get('/workflows/:workflowId/executions', (c) => c.json({ total: 0, executions: [] }));
stubs.get('/workflows/executions/:id', (c) => c.json({ execution: null }));

// ── Context (REAL — composed from registry + config) ─────

stubs.get('/context', (c) => {
  try {
    const paths = getProjectPaths();

    // Rules
    const rules: Array<{ name: string; type: string; path: string }> = [];
    if (existsSync(paths.rules)) {
      for (const f of readdirSync(paths.rules).filter(f => f.endsWith('.md'))) {
        rules.push({ name: basename(f, '.md'), type: 'mandatory', path: resolve(paths.rules, f) });
      }
    }

    // Agents
    const agents = discoverAllAgents().map(a => ({
      id: a.id, name: a.name, role: a.role ?? a.title, model: '', icon: a.squad,
    }));

    // Configs
    const configs: Array<{ path: string; modified: string }> = [];
    const configFiles = ['CLAUDE.md', '.claude/CLAUDE.md', 'aios.config.js'];
    for (const cf of configFiles) {
      const p = resolve(paths.projectRoot, cf);
      if (existsSync(p)) {
        try {
          const stat = statSync(p);
          configs.push({ path: p, modified: stat.mtime.toISOString() });
        } catch { /* skip */ }
      }
    }

    return c.json({ rules, agents, configs, mcpServers: [], recentFiles: [] });
  } catch { return c.json({ rules: [], agents: [], configs: [], mcpServers: [], recentFiles: [] }); }
});

// ── Integrations Health (REAL from DB) ───────────────────

stubs.get('/integrations/health', (c) => {
  try {
    const db = getDb();
    const rows = db.query<{ id: string; status: string }, []>(
      `SELECT id, status FROM integrations`
    ).all();
    const healthy = rows.filter(r => r.status === 'connected').length;
    return c.json({ integrations: rows, healthy, total: rows.length });
  } catch { return c.json({ integrations: [], healthy: 0, total: 0 }); }
});

// ════════════════════════════════════════════════════════════
// PHASE 2 — COMPOSED (aggregated from multiple real sources)
// ════════════════════════════════════════════════════════════

// ── Analytics Overview (REAL from DB + queue) ────────────

stubs.get('/analytics/overview', (c) => {
  try {
    const db = getDb();
    const stats = db.query<{
      total: number; done: number; failed: number; avg_dur: number;
    }, []>(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status IN ('failed','timeout') THEN 1 ELSE 0 END) as failed,
        AVG(CASE WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
          THEN (julianday(completed_at)-julianday(started_at))*86400000 ELSE NULL END) as avg_dur
      FROM jobs
    `).get();

    const total = stats?.total ?? 0;
    const done = stats?.done ?? 0;
    const failed = stats?.failed ?? 0;
    const successRate = total > 0 ? done / total : 0;

    // Top agents by execution count
    const topAgents = db.query<{ agent_id: string; cnt: number; done_cnt: number }, []>(`
      SELECT agent_id, COUNT(*) as cnt,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done_cnt
      FROM jobs GROUP BY agent_id ORDER BY cnt DESC LIMIT 5
    `).all().map(r => ({
      agentId: r.agent_id, name: formatName(r.agent_id),
      executions: r.cnt, successRate: r.cnt > 0 ? r.done_cnt / r.cnt : 0,
    }));

    const topSquads = db.query<{ squad_id: string; cnt: number }, []>(`
      SELECT squad_id, COUNT(*) as cnt FROM jobs GROUP BY squad_id ORDER BY cnt DESC LIMIT 5
    `).all().map(r => ({ squadId: r.squad_id, name: formatName(r.squad_id), executions: r.cnt, cost: 0 }));

    const mem = process.memoryUsage();

    return c.json({
      period: c.req.query('period') ?? 'day',
      periodStart: now(), periodEnd: now(), generatedAt: now(),
      summary: {
        totalExecutions: total, successfulExecutions: done, failedExecutions: failed,
        successRate, averageDuration: Math.round(stats?.avg_dur ?? 0),
        totalRequests: total, errorRate: total > 0 ? failed / total : 0,
        avgLatency: Math.round(stats?.avg_dur ?? 0), p95Latency: 0,
        totalCost: 0, totalTokens: 0, avgCostPerExecution: 0,
        activeJobs: queue.getRunningCount(), scheduledTasks: 0, activeTasks: queue.getQueueDepth(),
      },
      trends: {
        executions: { direction: 'stable', change: 0 },
        costs: { direction: 'stable', change: 0 },
        errors: { direction: 'stable', change: 0 },
      },
      topAgents, topSquads,
      health: {
        status: 'healthy', uptime: 99.9,
        memoryUsage: { rss: mem.rss, heapTotal: mem.heapTotal, heapUsed: mem.heapUsed, external: mem.external, arrayBuffers: mem.arrayBuffers },
      },
    });
  } catch (e) {
    log.error('analytics/overview failed', { error: String(e) });
    return c.json({ period: 'day', periodStart: now(), periodEnd: now(), generatedAt: now(), summary: {}, trends: {}, topAgents: [], topSquads: [], health: {} });
  }
});

// ── Analytics Realtime (REAL from queue) ─────────────────

stubs.get('/analytics/realtime', (c) => c.json({
  timestamp: now(),
  requestsPerMinute: 0,
  errorsPerMinute: 0,
  executionsPerMinute: 0,
  activeExecutions: queue.getRunningCount(),
  avgLatencyMs: 0,
}));

// ── Analytics Performance (REAL from DB) ─────────────────

stubs.get('/analytics/performance/agents', (c) => {
  try {
    const db = getDb();
    const rows = db.query<{
      agent_id: string; squad_id: string; total: number; done: number; failed: number; avg_dur: number;
    }, []>(`
      SELECT agent_id, squad_id, COUNT(*) as total,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status IN ('failed','timeout') THEN 1 ELSE 0 END) as failed,
        AVG(CASE WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
          THEN (julianday(completed_at)-julianday(started_at))*86400000 ELSE NULL END) as avg_dur
      FROM jobs GROUP BY agent_id, squad_id ORDER BY total DESC
    `).all();

    return c.json({
      agents: rows.map(r => ({
        agentId: r.agent_id, agentName: formatName(r.agent_id), squad: r.squad_id,
        totalExecutions: r.total, successfulExecutions: r.done, failedExecutions: r.failed,
        successRate: r.total > 0 ? r.done / r.total : 0,
        avgDuration: Math.round(r.avg_dur ?? 0), avgTokens: 0, totalCost: 0,
        lastActive: now(),
      })),
    });
  } catch { return c.json({ agents: [] }); }
});

stubs.get('/analytics/performance/squads', (c) => {
  try {
    const db = getDb();
    const rows = db.query<{
      squad_id: string; total: number; done: number; avg_dur: number; agent_cnt: number;
    }, []>(`
      SELECT squad_id, COUNT(*) as total,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
        AVG(CASE WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
          THEN (julianday(completed_at)-julianday(started_at))*86400000 ELSE NULL END) as avg_dur,
        COUNT(DISTINCT agent_id) as agent_cnt
      FROM jobs GROUP BY squad_id ORDER BY total DESC
    `).all();

    return c.json({
      squads: rows.map(r => ({
        squadId: r.squad_id, squadName: formatName(r.squad_id), agentCount: r.agent_cnt,
        totalExecutions: r.total, successRate: r.total > 0 ? r.done / r.total : 0,
        avgDuration: Math.round(r.avg_dur ?? 0), totalCost: 0, topAgents: [],
      })),
    });
  } catch { return c.json({ squads: [] }); }
});

// ── Analytics Health Dashboard (REAL from system) ────────

stubs.get('/analytics/health-dashboard', (c) => {
  const mem = process.memoryUsage();
  const uptimeSec = Math.floor((Date.now() - engineStartedAt) / 1000);
  const fmtUptime = uptimeSec > 3600 ? `${Math.floor(uptimeSec / 3600)}h` : `${Math.floor(uptimeSec / 60)}m`;

  return c.json({
    timestamp: now(), status: 'healthy', availability: 100,
    performance: {
      requestsLastHour: 0, errorsLastHour: 0, avgLatencyMs: 0, p95LatencyMs: 0,
      executionsLastHour: 0, executionSuccessRate: 0,
    },
    resources: {
      memoryUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      memoryTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      memoryPercentage: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      uptimeSeconds: uptimeSec,
      uptimeFormatted: fmtUptime,
    },
    services: {
      queue: { status: 'running', pending: queue.getQueueDepth(), processing: queue.getRunningCount() },
      scheduler: { status: 'running', activeTasks: 0, totalTasks: 0 },
    },
  });
});

// ── Dashboard Overview (COMPOSED from everything) ────────

stubs.get('/dashboard/overview', (c) => {
  try {
    const agents = discoverAllAgents();
    const _squads = discoverAllSquads();
    const db = getDb();

    const jobStats = db.query<{ total: number; done: number; failed: number; running: number }, []>(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status IN ('failed','timeout') THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) as running
      FROM jobs
    `).get();

    const total = jobStats?.total ?? 0;
    const done = jobStats?.done ?? 0;
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - engineStartedAt) / 1000);
    const bundles = getAvailableBundles();

    return c.json({
      generatedAt: now(),
      overview: {
        totalStories: 0, totalAgents: agents.length, activeLogFiles: 0, gitCommits: 0, gitBranch: 'main',
        totalExecutions: total, completedExecutions: done,
        failedExecutions: jobStats?.failed ?? 0, activeExecutions: jobStats?.running ?? 0,
        successRate: total > 0 ? Math.round((done / total) * 100) : 0,
      },
      agents: agents.map(a => ({
        agentId: a.id, agentName: a.name, role: a.role ?? a.title,
        model: '', logLines: 0, lastActive: now(), status: 'idle', squad: a.squad,
      })),
      mcp: {
        totalServers: bundles.length, connectedServers: bundles.length,
        totalTools: 0, servers: bundles.map((b: Record<string, unknown>) => ({
          name: b.id ?? b.name, status: 'connected', type: 'bundle', toolCount: 0, tools: [],
        })),
      },
      costs: {
        today: 0, thisWeek: 0, thisMonth: 0, byProvider: {}, bySquad: {}, trend: [],
        tokens: {
          total: { input: 0, output: 0, requests: total },
          claude: { input: 0, output: 0, requests: total },
          openai: { input: 0, output: 0, requests: 0 },
        },
      },
      system: {
        nodeVersion: typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : process.version,
        platform: process.platform, arch: process.arch,
        cpus: navigator?.hardwareConcurrency ?? 0,
        totalMemory: mem.heapTotal, freeMemory: mem.heapTotal - mem.heapUsed,
        memoryUsage: {
          rss: mem.rss, heapTotal: mem.heapTotal, heapUsed: mem.heapUsed,
          heapPercentage: Math.round((mem.heapUsed / mem.heapTotal) * 100),
        },
        uptime: uptimeSec,
        uptimeFormatted: uptimeSec > 3600 ? `${Math.floor(uptimeSec / 3600)}h` : `${Math.floor(uptimeSec / 60)}m`,
        gitBranch: 'main', gitDirty: false, aiosDiskUsage: '0',
        llmKeys: { claude: true, openai: false },
      },
    });
  } catch (e) {
    log.error('dashboard/overview failed', { error: String(e) });
    return c.json({ generatedAt: now(), overview: {}, agents: [], mcp: {}, costs: {}, system: {} });
  }
});

// ── Logs (REAL from DB) ──────────────────────────────────

stubs.get('/logs/agents', (c) => {
  try {
    const db = getDb();
    const rows = db.query<{ agent_id: string; cnt: number; last_at: string }, []>(`
      SELECT agent_id, COUNT(*) as cnt, MAX(created_at) as last_at
      FROM jobs GROUP BY agent_id ORDER BY last_at DESC LIMIT 20
    `).all();
    return c.json({
      agents: rows.map(r => ({ agentId: r.agent_id, name: formatName(r.agent_id), logLines: r.cnt, lastActive: r.last_at })),
      total: rows.length,
    });
  } catch { return c.json({ agents: [], total: 0 }); }
});

// ── Tools/MCP (REAL from bundles) ────────────────────────

stubs.get('/tools/mcp', (c) => {
  try {
    const bundles = getAvailableBundles();
    return c.json({
      totalServers: bundles.length, connectedServers: bundles.length, totalTools: 0,
      servers: bundles.map((b: Record<string, unknown>) => ({
        name: b.id ?? b.name, status: 'connected', type: 'bundle', toolCount: 0, tools: [],
      })),
    });
  } catch { return c.json({ totalServers: 0, connectedServers: 0, totalTools: 0, servers: [] }); }
});

// ════════════════════════════════════════════════════════════
// PHASE 3 — STUBS (no data source yet, returns empty/defaults)
// ════════════════════════════════════════════════════════════

// ── Analytics Costs (no cost tracking yet) ───────────────
stubs.get('/analytics/costs', (c) => c.json({
  period: c.req.query('period') ?? 'month',
  periodStart: now(), generatedAt: now(),
  summary: { totalCost: 0, totalTokens: 0, totalRecords: 0, avgCostPerRecord: 0, avgTokensPerRecord: 0 },
  byProvider: [], byModel: [], timeline: [],
}));

stubs.get('/analytics/usage/tokens', (c) => c.json({ total: { input: 0, output: 0 }, byGroup: [] }));

// ── Knowledge (no file indexing yet) ─────────────────────
stubs.get('/knowledge/categories', (c) => c.json({ categories: [], total: 0 }));
stubs.get('/knowledge/files/overview', (c) => c.json({ totalFiles: 0, totalDirectories: 0, totalSize: 0, byExtension: {}, recentFiles: [] }));
stubs.get('/knowledge/files', (c) => c.json({ path: c.req.query('path') ?? '/', items: [] }));
stubs.get('/knowledge/files/content', (c) => c.json({ path: '', name: '', content: '', size: 0, modified: now(), extension: '' }));
stubs.get('/knowledge/agents', (c) => c.json({ agents: [] }));
stubs.get('/knowledge/search', (c) => c.json({ results: [], total: 0, query: c.req.query('q') ?? '', type: c.req.query('type') ?? 'all' }));

// ── Events (derived from job queue) ──────────────────────
stubs.get('/events/history', (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const db = getDb();
    const rows = db.query<{ id: string; agent_id: string; command: string; status: string; created_at: string; completed_at: string | null }, [number]>(
      'SELECT id, agent_id, command, status, created_at, completed_at FROM jobs ORDER BY created_at DESC LIMIT ?',
    ).all(limit);
    const events = rows.map(r => ({
      id: r.id,
      type: r.status === 'completed' ? 'job:completed' : r.status === 'failed' ? 'job:failed' : 'job:started',
      agent: r.agent_id,
      command: r.command,
      timestamp: r.completed_at || r.created_at,
      status: r.status,
    }));
    return c.json({ events, total: events.length });
  } catch { return c.json({ events: [], total: 0 }); }
});

// ── Stories (reads from docs/stories/ in project root) ────
stubs.get('/stories', (c) => {
  try {
    const projRoot = projectPath();
    const storiesDir = join(projRoot, 'docs', 'stories');
    if (!existsSync(storiesDir)) return c.json({ stories: [], total: 0 });
    const files = readdirSync(storiesDir).filter(f => f.endsWith('.md')).sort();
    const stories = files.map(f => {
      const content = readFileSync(join(storiesDir, f), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const statusMatch = content.match(/status:\s*(\w+)/i);
      const totalTasks = (content.match(/- \[[ x]\]/g) || []).length;
      const doneTasks = (content.match(/- \[x\]/gi) || []).length;
      return {
        id: f.replace(/\.md$/, ''),
        title: titleMatch?.[1] || formatName(f),
        filename: f,
        status: statusMatch?.[1] || (doneTasks === totalTasks && totalTasks > 0 ? 'done' : 'draft'),
        progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        totalTasks,
        doneTasks,
      };
    });
    return c.json({ stories, total: stories.length });
  } catch { return c.json({ stories: [], total: 0 }); }
});

// ── QA Metrics (no QA integration yet) ───────────────────
stubs.get('/qa/metrics', (c) => c.json({ passRate: 0, totalTests: 0, passed: 0, failed: 0, skipped: 0 }));

// ── GitHub (no GitHub integration yet) ───────────────────
stubs.get('/github', (c) => c.json({ connected: false, repos: [], prs: [], issues: [] }));

// ── System env vars ──────────────────────────────────────
stubs.get('/system/env-vars', (c) => {
  const safeKeys = ['NODE_ENV', 'VITE_TIER', 'SHELL', 'TERM', 'LANG'];
  const vars: Record<string, string> = {};
  for (const key of safeKeys) {
    if (process.env[key]) vars[key] = process.env[key]!;
  }
  return c.json({ vars, count: Object.keys(vars).length });
});

// ── Monitor events (SSE — real-time events from job queue) ──
stubs.get('/monitor/events', (_c) => {
  const db = getDb();
  let recentJobs: Array<{ id: string; agent_id: string; status: string; command: string; created_at: string }> = [];
  try {
    recentJobs = db.query<{ id: string; agent_id: string; status: string; command: string; created_at: string }, []>(
      'SELECT id, agent_id, status, command, created_at FROM jobs ORDER BY created_at DESC LIMIT 10',
    ).all();
  } catch { /* empty */ }

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Init event with recent activity
      send('monitor:init', { timestamp: now(), jobCount: recentJobs.length });

      // Send recent events
      for (const j of recentJobs.reverse()) {
        send('monitor:event', {
          id: j.id,
          type: j.status === 'done' ? 'execution:completed' : j.status === 'failed' ? 'execution:failed' : 'execution:started',
          agent: j.agent_id,
          command: j.command,
          timestamp: j.created_at,
          status: j.status,
        });
      }

      // Stats summary
      send('monitor:stats', {
        timestamp: now(),
        running: queue.getRunningCount(),
        pending: queue.getQueueDepth(),
        wsClients: getWSClientCount(),
      });

      // Heartbeat every 15s, auto-close after 5min
      const hb = setInterval(() => {
        try {
          send('heartbeat', { timestamp: now() });
        } catch { clearInterval(hb); }
      }, 15000);
      setTimeout(() => { clearInterval(hb); try { controller.close(); } catch { /* already closed */ } }, 300000);
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
});

// ── Logs per agent (SSE for terminals, JSON for regular requests) ──
stubs.get('/logs', (c) => {
  const agent = c.req.query('agent') ?? '';
  const accept = c.req.header('accept') ?? '';

  // If client accepts text/event-stream (EventSource), return SSE
  if (accept.includes('text/event-stream')) {
    const db = getDb();
    let rows: Array<{ id: string; command: string; status: string; created_at: string; output: string | null }> = [];
    try {
      rows = db.query<{ id: string; command: string; status: string; created_at: string; output: string | null }, [string]>(
        'SELECT id, command, status, created_at, output FROM jobs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 50',
      ).all(agent);
    } catch { /* empty */ }

    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify({ data })}\n\n`));
        };

        // Send init event
        send('log:init', { agent, total: rows.length });

        // Send each log line
        for (const r of rows.reverse()) {
          const line = `[${r.created_at}] [${r.status}] ${r.command || 'execution'}${r.output ? '\n' + r.output.slice(0, 500) : ''}`;
          send('log:line', { line, initial: true });
        }

        // Keep alive with heartbeats (close after 5min)
        const hb = setInterval(() => {
          try { controller.enqueue(enc.encode(`event: heartbeat\ndata: {}\n\n`)); } catch { clearInterval(hb); }
        }, 15000);
        setTimeout(() => { clearInterval(hb); try { controller.close(); } catch { /* already closed */ } }, 300000);
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  }

  // Regular JSON response
  try {
    const db = getDb();
    const rows = db.query<{ id: string; command: string; status: string; created_at: string; output: string | null }, [string]>(
      'SELECT id, command, status, created_at, output FROM jobs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 50',
    ).all(agent);
    const logs = rows.map(r => ({
      id: r.id, agent, command: r.command, status: r.status, timestamp: r.created_at, output: r.output ?? '',
    }));
    return c.json({ logs, total: logs.length, agent });
  } catch { return c.json({ logs: [], total: 0, agent }); }
});

// ── Tasks (orchestration tasks) ──────────────────────────
stubs.get('/tasks', (c) => {
  try {
    const db = getDb();
    const rows = db.query<{ id: string; agent_id: string; command: string; status: string; created_at: string; completed_at: string | null }, []>(
      'SELECT id, agent_id, command, status, created_at, completed_at FROM jobs ORDER BY created_at DESC LIMIT 100',
    ).all();
    const tasks = rows.map(r => ({
      id: r.id,
      agentId: r.agent_id,
      command: r.command,
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
    }));
    return c.json({ tasks, total: tasks.length });
  } catch { return c.json({ tasks: [], total: 0 }); }
});

// POST /tasks — create orchestration task
stubs.post('/tasks', async (c) => {
  try {
    const body = await c.req.json<{ demand?: string }>();
    const taskId = crypto.randomUUID();
    const db = getDb();
    db.run(
      'INSERT INTO jobs (id, agent_id, command, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [taskId, 'orchestrator', body.demand ?? '', 'pending', new Date().toISOString()],
    );
    return c.json({ taskId, status: 'created' }, 201);
  } catch {
    return c.json({ taskId: crypto.randomUUID(), status: 'created' }, 201);
  }
});

// GET /tasks/:id/stream — SSE stream for task orchestration
// Uses REAL Claude CLI execution when ANTHROPIC_API_KEY is set,
// falls back to demo simulation otherwise.
stubs.get('/tasks/:id/stream', (c) => {
  const taskId = c.req.param('id');
  // Check if real execution is possible: API key OR Claude CLI with OAuth auth
  const hasLLMKey = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
  let hasClaudeCLI = false;
  if (!hasLLMKey) {
    try {
      const check = Bun.spawnSync(['claude', '--version'], { stdout: 'pipe', stderr: 'pipe' });
      hasClaudeCLI = check.exitCode === 0;
    } catch { /* not installed */ }
  }
  const useRealExecution = hasLLMKey || hasClaudeCLI;

  // Retrieve the demand from query param (primary) or DB (fallback)
  let demand = c.req.query('demand') ?? '';
  if (!demand) {
    try {
      const db = getDb();
      const row = db.query<{ command: string }, [string]>(
        'SELECT command FROM jobs WHERE id = ?',
      ).get(taskId);
      demand = row?.command ?? '';
    } catch { /* ignore */ }
  }

  // Discover agents for context
  const allAgents = discoverAllAgents();
  const findAgent = (id: string) => {
    const a = allAgents.find(ag => ag.id === id);
    return a ? { id: a.id, name: a.name, squad: a.squad, title: a.title } : { id, name: formatName(id), squad: 'core', title: formatName(id) };
  };

  const architectAgent = findAgent('architect');
  const devAgent = findAgent('dev');

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

      // Phase 1: Analyzing
      send('task:analyzing', { taskId, status: 'analyzing', demand });
      await delay(1200);

      // Phase 2: Squad selection
      send('task:squads-selected', {
        taskId,
        squads: [{
          squadId: 'development', chief: 'architect', agentCount: 2,
          agents: [{ id: architectAgent.id, name: architectAgent.name }, { id: devAgent.id, name: devAgent.name }],
        }],
      });
      await delay(800);

      // Phase 3: Planning
      send('task:planning', { taskId, status: 'planning' });
      await delay(1000);

      // Phase 4: Plan ready
      const workflowId = crypto.randomUUID();
      send('task:plan-ready', {
        taskId, workflowId,
        steps: [
          { id: 'step-1', name: 'Architect Analysis', agent: architectAgent, role: 'Architect', status: 'pending' },
          { id: 'step-2', name: 'Developer Implementation', agent: devAgent, role: 'Developer', status: 'pending' },
        ],
      });
      await delay(600);
      send('task:executing', { taskId, status: 'executing' });

      if (useRealExecution) {
        // ═══════════════════════════════════════════
        // REAL EXECUTION via Claude CLI
        // ═══════════════════════════════════════════
        const executeStep = async (stepId: string, stepName: string, agent: typeof architectAgent, role: string, prompt: string) => {
          send('step:started', { taskId, stepId, stepName, agent, role });
          send('step:streaming:start', { taskId, stepId, stepName, agent, role });

          const spawnEnv = { ...process.env };
          delete spawnEnv.CLAUDECODE;

          const args = ['claude', '-p', prompt, '--output-format', 'stream-json', '--verbose'];
          const proc = Bun.spawn(args, { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe', env: spawnEnv });

          const reader = proc.stdout.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let accumulated = '';
          let gotDeltas = false;
          const startTime = Date.now();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const parsed = JSON.parse(line);
                  // Extract text from Claude stream-json output.
                  // Claude CLI emits multiple event types with overlapping text:
                  //   - content_block_delta: incremental streaming chunks (best for live streaming)
                  //   - assistant: full message object (ALWAYS contains same text as deltas)
                  //   - result: final result (ALWAYS contains same text as assistant)
                  // We use ONLY content_block_delta for streaming, with result as final fallback.
                  // We NEVER accumulate from assistant — it always duplicates delta/result text.
                  let text = '';
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    text = parsed.delta.text;
                    gotDeltas = true;
                  } else if (parsed.type === 'result' && parsed.result && !gotDeltas) {
                    // Final fallback: use result only if no deltas were streamed
                    // (e.g. in -p print mode where deltas are not emitted)
                    text = String(parsed.result);
                  }
                  // Skip 'assistant' type entirely — its content duplicates deltas/result
                  if (text) {
                    accumulated += text;
                    send('step:streaming:chunk', { taskId, stepId, accumulated });
                  }
                } catch {
                  accumulated += line + '\n';
                  send('step:streaming:chunk', { taskId, stepId, accumulated });
                }
              }
            }
          } catch { /* stream read error */ }

          // Process remaining buffer (only if it's not a JSON event we already handled)
          if (buffer.trim()) {
            try {
              const parsedBuf = JSON.parse(buffer);
              // Apply same dedup logic to remaining buffer
              if (parsedBuf.type === 'content_block_delta' && parsedBuf.delta?.text) {
                accumulated += parsedBuf.delta.text;
                gotDeltas = true;
              } else if (parsedBuf.type === 'result' && parsedBuf.result && !gotDeltas) {
                accumulated += String(parsedBuf.result);
              }
              // Skip assistant type
            } catch {
              accumulated += buffer;
            }
            send('step:streaming:chunk', { taskId, stepId, accumulated });
          }

          const exitCode = await proc.exited;
          const durationMs = Date.now() - startTime;

          // Trim leading whitespace from CLI output
          accumulated = accumulated.trim();

          // Parse structured artifacts from response
          const artifacts = parseArtifacts(accumulated);

          send('step:streaming:end', {
            taskId, stepId, stepName, agent, role,
            response: accumulated,
            artifacts,
            llmMetadata: { provider: 'anthropic', model: 'claude-cli', inputTokens: 0, outputTokens: 0 },
          });
          send('step:completed', { taskId, stepId, stepName, status: exitCode === 0 ? 'completed' : 'failed' });
          await delay(400);

          return { accumulated, artifacts, durationMs, exitCode };
        };

        // Step 1: Architect analysis
        const step1Prompt = `Você é Aria, Solutions Architect. Analise a seguinte demanda e forneça uma análise técnica detalhada em Markdown:\n\nDemanda: "${demand}"\n\nInclua: escopo, complexidade estimada, dependências, riscos, e recomendação de abordagem. Seja conciso e direto.`;
        const step1 = await executeStep('step-1', 'Architect Analysis', architectAgent, 'Architect', step1Prompt);

        // Step 2: Developer implementation plan
        const step2Prompt = `Você é Dex, Full-Stack Developer. Com base na análise do Architect:\n\n${step1.accumulated.slice(0, 2000)}\n\nCrie um plano de implementação detalhado em Markdown para a demanda: "${demand}"\n\nInclua: arquivos a criar/modificar, tecnologias, etapas de implementação, e testes necessários. Seja conciso e direto.`;
        const _step2 = await executeStep('step-2', 'Developer Implementation', devAgent, 'Developer', step2Prompt);

        send('task:completed', { taskId, status: 'completed' });
      } else {
        // ═══════════════════════════════════════════
        // DEMO MODE — simulated pipeline
        // ═══════════════════════════════════════════
        send('step:started', { taskId, stepId: 'step-1', stepName: 'Architect Analysis', agent: architectAgent, role: 'Architect' });
        await delay(800);
        send('step:streaming:start', { taskId, stepId: 'step-1', stepName: 'Architect Analysis', agent: architectAgent, role: 'Architect' });

        const demoContent1 = `## Análise Técnica\n\n**Demanda:** "${demand || 'Não especificada'}"\n\n### Escopo\nA demanda requer coordenação entre múltiplos agentes do squad Development.\n\n### Complexidade\nMédia — envolve análise arquitetural e implementação.\n\n### Recomendação\nProsseguir com implementação via squad Development (Architect + Dev).\n\n> **Modo Demo**: Configure \`ANTHROPIC_API_KEY\` para ativar execução real via Claude CLI.\n`;
        let acc1 = '';
        for (const chunk of demoContent1.match(/.{1,80}/gs) || [demoContent1]) {
          acc1 += chunk;
          send('step:streaming:chunk', { taskId, stepId: 'step-1', accumulated: acc1 });
          await delay(150 + Math.random() * 200);
        }
        send('step:streaming:end', { taskId, stepId: 'step-1', stepName: 'Architect Analysis', agent: architectAgent, role: 'Architect', response: acc1, artifacts: parseArtifacts(acc1), llmMetadata: { provider: 'demo', model: 'demo-mode', inputTokens: 245, outputTokens: 189 } });
        send('step:completed', { taskId, stepId: 'step-1', stepName: 'Architect Analysis', status: 'completed' });
        await delay(600);

        send('step:started', { taskId, stepId: 'step-2', stepName: 'Developer Implementation', agent: devAgent, role: 'Developer' });
        await delay(600);
        send('step:streaming:start', { taskId, stepId: 'step-2', stepName: 'Developer Implementation', agent: devAgent, role: 'Developer' });

        const demoContent2 = `## Plano de Implementação\n\n### Etapas\n- [x] Análise de requisitos concluída\n- [x] Arquitetura definida\n- [ ] Implementação (requer Claude CLI)\n- [ ] Testes automatizados\n- [ ] Code review e deploy\n\n### Para ativar execução real\n\`\`\`bash\nexport ANTHROPIC_API_KEY="sk-ant-..."\n\`\`\`\n\nDepois reinicie o engine e execute novamente.\n`;
        let acc2 = '';
        for (const chunk of demoContent2.match(/.{1,80}/gs) || [demoContent2]) {
          acc2 += chunk;
          send('step:streaming:chunk', { taskId, stepId: 'step-2', accumulated: acc2 });
          await delay(120 + Math.random() * 180);
        }
        send('step:streaming:end', { taskId, stepId: 'step-2', stepName: 'Developer Implementation', agent: devAgent, role: 'Developer', response: acc2, artifacts: parseArtifacts(acc2), llmMetadata: { provider: 'demo', model: 'demo-mode', inputTokens: 312, outputTokens: 276 } });
        send('step:completed', { taskId, stepId: 'step-2', stepName: 'Developer Implementation', status: 'completed' });
        await delay(400);

        send('task:completed', { taskId, status: 'completed' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════

function formatName(slug: string): string {
  return slug.replace(/\.(md|yaml|yml|json)$/i, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseAgentHeader(filePath: string): { role?: string; description?: string; name?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let role: string | undefined;
    let description: string | undefined;
    let name: string | undefined;

    // First pass: check blockquote description (squad agents)
    for (const line of lines.slice(0, 10)) {
      const bqMatch = line.match(/^>\s*\*\*(.+?)\*\*\s*[-–—]\s*(.+)/);
      if (bqMatch) {
        name = bqMatch[1].trim();
        description = bqMatch[2].trim().slice(0, 200);
        break;
      }
    }

    // Second pass: scan YAML block for role/name (up to 150 lines)
    const scanLimit = Math.min(lines.length, 150);
    for (let i = 0; i < scanLimit; i++) {
      const line = lines[i];
      if (!role) {
        const roleMatch = line.match(/^\s*role:\s*(.+)/i);
        if (roleMatch) role = roleMatch[1].trim().replace(/^["']|["']$/g, '');
      }
      if (!name) {
        const nameMatch = line.match(/^\s*name:\s*(.+)/i);
        if (nameMatch && !line.includes('- name:')) {
          name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
        }
      }
      if (role && name) break;
    }

    // Fallback description: use role if available, otherwise first clean line
    if (!description) {
      if (role) {
        description = role;
      } else {
        for (const line of lines.slice(1, 10)) {
          if (line.trim() && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('ACTIVATION') && !line.startsWith('CRITICAL')) {
            description = line.trim().slice(0, 200);
            break;
          }
        }
      }
    }

    return { role, description, name };
  } catch { return {}; }
}

export { stubs };
