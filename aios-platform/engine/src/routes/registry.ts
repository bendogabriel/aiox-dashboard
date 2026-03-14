/**
 * Registry routes — agents, squads, jobs, pool, cron, workflows, tasks, commands, resources.
 * All 14 endpoints the frontend expects, backed by filesystem discovery + real stores.
 */
import { Hono } from 'hono';
import {
  getAllAgents,
  getAgentsBySquad,
  getAgentDetail,
  getAllSquads,
  getSquadStats,
  getSquadConnections,
  getWorkflows,
  getTaskDefs,
  getCommands,
  getResources,
} from '../core/registry-discovery';
import { createJob, listJobs as listJobsFromStore, toEngineJob } from '../core/job-store';
import { getPoolStatus } from '../core/worker-pool';
import { listCrons, toCronJobDef } from '../core/cron-store';

export const registryApp = new Hono();

// ── Agents ─────────────────────────────────────────────────

// GET /agents — list all agents (optionally filtered by squad)
// Returns { agents: [...], count: N } with squadId field for frontend compat
registryApp.get('/agents', (c) => {
  const squad = c.req.query('squad');
  const limit = Number(c.req.query('limit')) || 500;
  const raw = squad ? getAgentsBySquad(squad) : getAllAgents();
  const agents = raw.slice(0, limit).map((a) => ({
    ...a,
    squadId: a.squad, // Frontend expects squadId, engine uses squad
  }));
  return c.json({ agents, count: agents.length });
});

// GET /agents/squad/:squadId — list agents by squad (explicit /squad/ path)
registryApp.get('/agents/squad/:squadId', (c) => {
  const squadId = c.req.param('squadId');
  const raw = getAgentsBySquad(squadId);
  const agents = raw.map((a) => ({ ...a, squadId: a.squad }));
  return c.json({ agents, count: agents.length });
});

// GET /agents/:squad/:agentId — single agent detail (compound ID format)
registryApp.get('/agents/:squad/:agentId', (c) => {
  const squad = c.req.param('squad');
  const agentId = c.req.param('agentId');
  const detail = getAgentDetail(agentId) || getAgentDetail(`${squad}-${agentId}`);
  if (!detail) return c.json({ error: `Agent ${squad}/${agentId} not found` }, 404);
  return c.json({ agent: { ...detail, squadId: detail.squad } });
});

// GET /agents/:id — single agent detail (simple ID format)
registryApp.get('/agents/:id', (c) => {
  const id = c.req.param('id');
  const detail = getAgentDetail(id);
  if (!detail) return c.json({ error: `Agent ${id} not found` }, 404);
  return c.json({ agent: { ...detail, squadId: detail.squad } });
});

// ── Squads ─────────────────────────────────────────────────

// GET /squads — list all squads
registryApp.get('/squads', (c) => {
  return c.json(getAllSquads());
});

// GET /squads/:id/stats — squad statistics
registryApp.get('/squads/:id/stats', (c) => {
  const id = c.req.param('id');
  return c.json(getSquadStats(id));
});

// GET /squads/:id/connections — squad agent network
registryApp.get('/squads/:id/connections', (c) => {
  const id = c.req.param('id');
  return c.json(getSquadConnections(id));
});

// ── Jobs ───────────────────────────────────────────────────

// POST /jobs — create a new job
registryApp.post('/jobs', async (c) => {
  const body = await c.req.json<{ name?: string; agent?: string; squad?: string; input?: Record<string, unknown> }>();
  if (!body.name) return c.json({ error: 'name is required' }, 400);
  const job = createJob({ name: body.name, agent: body.agent, squad: body.squad, input: body.input });
  return c.json({ job: toEngineJob(job) });
});

// GET /jobs — list jobs from SQLite
registryApp.get('/jobs', (c) => {
  const status = c.req.query('status') || undefined;
  const limit = Number(c.req.query('limit')) || 20;
  const jobs = listJobsFromStore({ status, limit });
  return c.json({ jobs: jobs.map(toEngineJob) });
});

// ── Pool ───────────────────────────────────────────────────

// GET /pool — worker pool status (real in-memory state)
registryApp.get('/pool', (c) => {
  return c.json(getPoolStatus());
});

// ── Cron ───────────────────────────────────────────────────

// GET /cron — list cron jobs from SQLite
registryApp.get('/cron', (c) => {
  const crons = listCrons();
  return c.json({ crons: crons.map(toCronJobDef) });
});

// ── Registry: Tasks ────────────────────────────────────────

// GET /tasks — list task definitions by squad (not orchestration tasks)
// Note: orchestration tasks are handled by tasksApp on /tasks
// This handles /registry-tasks?squad=X which the frontend calls as /tasks?squad=X
// We merge this into the registry router and let index.ts mount appropriately

// ── Registry: Workflows ────────────────────────────────────

// GET /workflows — list workflow definitions by squad
registryApp.get('/workflows', (c) => {
  const squad = c.req.query('squad');
  return c.json({ workflows: getWorkflows(squad || undefined) });
});

// ── Registry: Commands ─────────────────────────────────────

// GET /commands — list commands by squad
registryApp.get('/commands', (c) => {
  const squad = c.req.query('squad');
  return c.json({ commands: getCommands(squad || undefined) });
});

// ── Registry: Resources ────────────────────────────────────

// GET /registry/resources — list resources by squad
registryApp.get('/registry/resources', (c) => {
  const squad = c.req.query('squad');
  return c.json({ resources: getResources(squad || undefined) });
});
