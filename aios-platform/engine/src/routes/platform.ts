/**
 * Platform Intelligence routes.
 *
 * Exposes .aios-core analytics to the dashboard:
 *   GET /platform/maturity          — 6-dimension maturity score + L1-L5 level
 *   GET /platform/health            — Squad health scores (ci-health-gate)
 *   GET /platform/quality-gates     — Quality gate compliance per squad
 *   GET /platform/graph/stats       — Integration graph statistics
 *   GET /platform/graph/data        — Full graph data (nodes + edges)
 *   GET /platform/knowledge/stats   — Knowledge index statistics
 *   GET /platform/knowledge/search  — TF-IDF knowledge search
 *   GET /platform/status            — Full platform status summary
 */
import { Hono } from 'hono';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export const platformApp = new Hono();

// .aios-core paths relative to engine cwd (dashboard/aios-platform/engine/)
const SCRIPTS_ROOT = '../../../.aios-core/scripts';
const DATA_ROOT = '../../../.aios-core/data';

// ── Helpers ────────────────────────────────────────────────

interface ScriptResult {
  ok: boolean;
  data: unknown;
  error?: string;
}

async function runScript(script: string, args: string[] = []): Promise<ScriptResult> {
  const scriptPath = `${SCRIPTS_ROOT}/${script}`;
  try {
    const proc = Bun.spawn(
      ['node', scriptPath, ...args],
      {
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      }
    );

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0 && !stdout.trim()) {
      console.warn(`[Platform] ${script} ${args.join(' ')} failed:`, stderr.trim());
      return { ok: false, data: null, error: stderr.trim() };
    }

    try {
      const data = JSON.parse(stdout);
      return { ok: true, data };
    } catch {
      return { ok: true, data: { raw: stdout.trim() } };
    }
  } catch (err) {
    console.error(`[Platform] Failed to run ${script}:`, err);
    return { ok: false, data: null, error: String(err) };
  }
}

function readJsonFile(relativePath: string): unknown | null {
  const fullPath = resolve(relativePath);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

// ── GET /platform/maturity ─────────────────────────────────

platformApp.get('/maturity', async (c) => {
  // Compute 6 maturity dimensions by calling sub-scripts in parallel
  const details: Record<string, unknown> = {};

  const [health, graph, gates] = await Promise.all([
    runScript('ci-health-gate.js', ['--json']),
    runScript('integration-graph-visualizer.js', ['--json']),
    runScript('quality-gate-checker.js', ['--json']),
  ]);

  const structureData = readJsonFile(`${DATA_ROOT}/knowledge-index/chunk-metadata.json`);
  const scores: Record<string, number> = {};

  // Health dimension
  if (health.ok && health.data) {
    const h = health.data as { summary?: { average?: number }; failing_squads?: number };
    scores.health = h.summary?.average || 0;
    details.health = health.data;
  } else {
    scores.health = 0;
  }

  // Structure dimension — derived from health per-squad structural scores
  if (health.ok && health.data) {
    const healthData = health.data as Record<string, unknown>;
    const squadResults = (healthData.results || []) as Array<{ dimensions?: { structural?: number } }>;
    if (squadResults.length > 0) {
      const avgStructural = squadResults.reduce((sum, s) => sum + (s.dimensions?.structural || 0), 0) / squadResults.length;
      scores.structure = Math.round((avgStructural / 25) * 100);
    } else {
      scores.structure = 50;
    }
  } else {
    scores.structure = 50;
  }

  // Integration dimension
  if (graph.ok && graph.data) {
    const g = graph.data as { crossSquadEdges?: number; cycles?: unknown[]; isolatedSquads?: unknown[] };
    const cyclePenalty = (g.cycles?.length || 0) * 10;
    const isolatedPenalty = (g.isolatedSquads?.length || 0) * 3;
    const crossBonus = Math.min(g.crossSquadEdges || 0, 100);
    scores.integration = Math.max(0, Math.min(100, crossBonus - cyclePenalty - isolatedPenalty));
    details.graph = graph.data;
  } else {
    scores.integration = 0;
  }

  // Knowledge dimension
  if (Array.isArray(structureData)) {
    const squads = new Set((structureData as Array<{ squad: string }>).map(c => c.squad));
    scores.knowledge = Math.round((squads.size / 38) * 100);
    details.knowledge = { chunks: structureData.length, squadsIndexed: squads.size };
  } else {
    scores.knowledge = 0;
  }

  // Tooling dimension (quality gates)
  if (gates.ok && gates.data) {
    const q = gates.data as { totalPass?: number; totalFail?: number };
    const totalChecks = (q.totalPass || 0) + (q.totalFail || 0);
    scores.tooling = totalChecks > 0 ? Math.round(((q.totalPass || 0) / totalChecks) * 100) : 0;
    details.qualityGates = gates.data;
  } else {
    scores.tooling = 0;
  }

  // Execution dimension
  scores.execution = 30; // baseline — execution tracking is wired but no prod data yet

  // Overall weighted score
  const weights = { structure: 0.15, health: 0.20, integration: 0.20, knowledge: 0.15, execution: 0.15, tooling: 0.15 };
  const overall = Math.round(
    Object.entries(weights).reduce((sum, [dim, w]) => sum + (scores[dim as keyof typeof scores] || 0) * w, 0)
  );

  let level: string;
  if (overall >= 91) level = 'L5 Optimizing';
  else if (overall >= 81) level = 'L4 Managed';
  else if (overall >= 61) level = 'L3 Standardized';
  else if (overall >= 41) level = 'L2 Defined';
  else level = 'L1 Initial';

  return c.json({
    date: new Date().toISOString().split('T')[0],
    scores,
    weights,
    overall,
    level,
    details,
  });
});

// ── GET /platform/health ───────────────────────────────────

platformApp.get('/health', async (c) => {
  const squad = c.req.query('squad');
  const args = ['--json'];
  if (squad) args.push('--squad', squad);

  const result = await runScript('ci-health-gate.js', args);
  if (!result.ok) {
    return c.json({ error: result.error || 'Health check failed' }, 500);
  }
  return c.json(result.data);
});

// ── GET /platform/quality-gates ────────────────────────────

platformApp.get('/quality-gates', async (c) => {
  const squad = c.req.query('squad');
  const args = ['--json'];
  if (squad) args.push('--squad', squad);

  const result = await runScript('quality-gate-checker.js', args);
  if (!result.ok) {
    return c.json({ error: result.error || 'Quality gate check failed' }, 500);
  }
  return c.json(result.data);
});

// ── GET /platform/graph/stats ──────────────────────────────

platformApp.get('/graph/stats', async (c) => {
  const result = await runScript('integration-graph-visualizer.js', ['--json']);
  if (!result.ok) {
    return c.json({ error: result.error || 'Graph analysis failed' }, 500);
  }
  return c.json(result.data);
});

// ── GET /platform/graph/data ───────────────────────────────

platformApp.get('/graph/data', (c) => {
  const data = readJsonFile(`${DATA_ROOT}/integration-graph/graph-data.json`) as {
    taskNodes?: Array<{ id: string; squad: string; taskId: string }>;
    taskEdges?: Array<{ from: string; to: string; type: string }>;
    crossSquadEdges?: Array<{ from: string; to: string; taskSource: string }>;
    squadLinks?: Array<{ from: string; to: string; count: number; tasks: string[] }>;
    stats?: unknown;
  } | null;
  if (!data) {
    return c.json({ error: 'Graph data not found. Run: node aios-cli.js graph' }, 404);
  }

  // Normalize to { nodes, edges } format for frontend consumption
  const nodes = (data.taskNodes || []).map(n => ({
    id: n.id,
    squad: n.squad,
    label: n.taskId,
    type: 'task' as const,
  }));

  const edges = (data.taskEdges || []).map(e => ({
    source: e.from,
    target: e.to,
    type: e.type || 'depends_on',
  }));

  return c.json({
    nodes,
    edges,
    crossSquadEdges: data.crossSquadEdges || [],
    squadLinks: data.squadLinks || [],
    stats: data.stats || null,
  });
});

// ── GET /platform/knowledge/stats ──────────────────────────

platformApp.get('/knowledge/stats', (c) => {
  const chunks = readJsonFile(`${DATA_ROOT}/knowledge-index/chunk-metadata.json`);
  if (!Array.isArray(chunks)) {
    return c.json({ error: 'Knowledge index not built. Run: node aios-cli.js index' }, 404);
  }

  const squads = new Set((chunks as Array<{ squad: string }>).map(ch => ch.squad));
  const bySquad: Record<string, number> = {};
  for (const ch of chunks as Array<{ squad: string }>) {
    bySquad[ch.squad] = (bySquad[ch.squad] || 0) + 1;
  }

  return c.json({
    totalChunks: chunks.length,
    squadsIndexed: squads.size,
    bySquad,
  });
});

// ── GET /platform/knowledge/search ─────────────────────────

platformApp.get('/knowledge/search', async (c) => {
  const query = c.req.query('q');
  if (!query || !query.trim()) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  const result = await runScript('knowledge-indexer.js', ['--search', query, '--json']);
  if (!result.ok) {
    return c.json({ error: result.error || 'Search failed' }, 500);
  }
  return c.json(result.data);
});

// ── GET /platform/status ───────────────────────────────────

platformApp.get('/status', async (c) => {
  // Run health + graph + quality gates in parallel for a full snapshot
  const [health, graph, gates] = await Promise.all([
    runScript('ci-health-gate.js', ['--json']),
    runScript('integration-graph-visualizer.js', ['--json']),
    runScript('quality-gate-checker.js', ['--json']),
  ]);

  const chunks = readJsonFile(`${DATA_ROOT}/knowledge-index/chunk-metadata.json`);
  const knowledgeStats = Array.isArray(chunks) ? {
    totalChunks: chunks.length,
    squadsIndexed: new Set((chunks as Array<{ squad: string }>).map(ch => ch.squad)).size,
  } : null;

  return c.json({
    date: new Date().toISOString().split('T')[0],
    health: health.ok ? health.data : null,
    graph: graph.ok ? graph.data : null,
    qualityGates: gates.ok ? gates.data : null,
    knowledge: knowledgeStats,
  });
});
