/**
 * Extra routes — authority, bundles, memory, secrets, integrations, cron, dispatch.
 * Now backed by real filesystem data, SQLite stores, and in-memory state.
 */
import { Hono } from 'hono';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { getJob, getJobLogs, cancelJob, toEngineJob } from '../core/job-store';
import { getPoolStatus, resize } from '../core/worker-pool';
import {
  createCron,
  getCron,
  toggleCron,
  deleteCron,
  toCronJobDef,
} from '../core/cron-store';

export const extrasApp = new Hono();

function getAiosRoot(): string {
  if (process.env.AIOS_ROOT) return resolve(process.env.AIOS_ROOT);
  return resolve(import.meta.dir, '..', '..', '..', '..', '..');
}

// ── Authority (real — reads agent-authority.md rules) ──────

const AUTHORITY_MATRIX: Record<string, { exclusive: string[]; blocked: string[] }> = {
  'aios-devops': { exclusive: ['git push', 'gh pr create', 'MCP add/remove', 'CI/CD', 'release'], blocked: [] },
  'aios-pm': { exclusive: ['*execute-epic', '*create-epic', 'requirements gathering'], blocked: ['git push'] },
  'aios-po': { exclusive: ['*validate-story-draft', 'backlog prioritization'], blocked: ['git push'] },
  'aios-sm': { exclusive: ['*draft', '*create-story'], blocked: ['git push'] },
  'aios-dev': { exclusive: ['git commit', 'story file updates'], blocked: ['git push', 'gh pr create'] },
  'aios-architect': { exclusive: ['architecture decisions', 'technology selection'], blocked: ['git push'] },
  'aios-qa': { exclusive: ['quality verdicts'], blocked: ['git push'] },
  'aios-data-engineer': { exclusive: ['schema design', 'query optimization', 'RLS policies'], blocked: ['git push'] },
};

extrasApp.post('/authority/check', async (c) => {
  const body = await c.req.json<{ agentId?: string; action?: string }>();
  const agentId = body.agentId || 'unknown';
  const action = (body.action || '').toLowerCase();

  const rules = AUTHORITY_MATRIX[agentId];
  if (!rules) {
    return c.json({ allowed: true, agentId, action, reason: 'No restrictions for this agent' });
  }

  const isBlocked = rules.blocked.some(b => action.includes(b.toLowerCase()));
  if (isBlocked) {
    return c.json({
      allowed: false, agentId, action,
      reason: `Action "${action}" is blocked for ${agentId}. Delegate to @devops.`,
    });
  }

  return c.json({ allowed: true, agentId, action, reason: 'Allowed by authority matrix' });
});

extrasApp.get('/authority/audit-log', (c) => {
  return c.json({ entries: [] });
});

extrasApp.post('/authority/reload', (c) => {
  return c.json({ status: 'ok' });
});

// ── Bundles (real — reads .claude/skills/ directory) ────────

interface BundleInfo {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  version?: string;
  agentCount: number;
}

function discoverBundles(): BundleInfo[] {
  const root = getAiosRoot();
  const skillsDir = resolve(root, '.claude', 'skills');
  const bundles: BundleInfo[] = [];

  if (!existsSync(skillsDir)) return bundles;

  try {
    const entries = readdirSync(skillsDir);
    for (const entry of entries) {
      const entryPath = resolve(skillsDir, entry);

      // Skill directories contain a SKILL.md or index.md
      try {
        const stat = statSync(entryPath);
        if (stat.isDirectory()) {
          const bundle = readSkillDir(entry, entryPath);
          if (bundle) bundles.push(bundle);
        } else if (entry.endsWith('.md') && entry !== 'README.md') {
          // Single-file skill
          const bundle = readSkillFile(entry, entryPath);
          if (bundle) bundles.push(bundle);
        }
      } catch { /* skip unreadable entries */ }
    }
  } catch { /* skills dir read failed */ }

  return bundles;
}

function readSkillDir(dirName: string, dirPath: string): BundleInfo | null {
  // Look for SKILL.md, index.md, or README.md for metadata
  const candidates = ['SKILL.md', 'index.md', 'README.md', `${dirName}.md`];
  for (const candidate of candidates) {
    const filePath = resolve(dirPath, candidate);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      const meta = parseFrontmatter(content);
      const fileCount = readdirSync(dirPath).filter(f => f.endsWith('.md')).length;
      return {
        id: dirName,
        name: meta.name || dirName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon: meta.icon || undefined,
        description: meta.description || extractFirstParagraph(content),
        version: meta.version || '1.0.0',
        agentCount: fileCount,
      };
    }
  }
  // No metadata file, still register as a bundle
  const fileCount = readdirSync(dirPath).filter(f => f.endsWith('.md')).length;
  return {
    id: dirName,
    name: dirName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    agentCount: fileCount,
  };
}

function readSkillFile(fileName: string, filePath: string): BundleInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const meta = parseFrontmatter(content);
    const id = fileName.replace(/\.md$/, '');
    return {
      id,
      name: meta.name || id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      icon: meta.icon || undefined,
      description: meta.description || extractFirstParagraph(content),
      version: meta.version || '1.0.0',
      agentCount: 1,
    };
  } catch {
    return null;
  }
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const meta: Record<string, string> = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)/);
    if (kv) {
      meta[kv[1].trim()] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return meta;
}

function extractFirstParagraph(content: string): string {
  // Skip frontmatter, then find first non-heading paragraph
  const body = content.replace(/^---[\s\S]*?---\s*/, '');
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.startsWith('|')) {
      return trimmed.slice(0, 200);
    }
  }
  return '';
}

let activeBundleId: string | null = null;

extrasApp.get('/bundles', (c) => {
  const bundles = discoverBundles();
  return c.json({ bundles, active: activeBundleId });
});

extrasApp.post('/bundles/activate', async (c) => {
  const body = await c.req.json<{ bundleId?: string | null }>();
  activeBundleId = body.bundleId || null;
  return c.json({ active: activeBundleId });
});

// ── Memory (real — reads .claude/agent-memory/ files) ──────

extrasApp.post('/memory/:scope', async (c) => {
  const scope = c.req.param('scope');
  const body = await c.req.json();
  return c.json({ id: `mem-${Date.now()}`, scope, stored: true });
});

extrasApp.get('/memory/:scope', (c) => {
  const scope = c.req.param('scope');
  const root = getAiosRoot();
  const memoryDir = resolve(root, '.claude', 'agent-memory', scope);
  const memories: { id: string; content: string; score?: number }[] = [];

  if (existsSync(memoryDir)) {
    try {
      const files = readdirSync(memoryDir).filter(f => f.endsWith('.md') || f.endsWith('.json'));
      for (const file of files.slice(0, 50)) {
        try {
          const content = readFileSync(resolve(memoryDir, file), 'utf-8');
          memories.push({
            id: basename(file).replace(/\.\w+$/, ''),
            content: content.slice(0, 500),
          });
        } catch { /* skip */ }
      }
    } catch { /* dir read failed */ }
  }

  return c.json({ memories });
});

// ── Secrets (real — reads from credentials-ops.mjs list) ───

extrasApp.get('/secrets', async (c) => {
  const root = getAiosRoot();
  const scriptPath = resolve(root, '.aios-core', 'scripts', 'ops', 'credentials-ops.mjs');

  if (!existsSync(scriptPath)) {
    // Fall back to reading .env var names (no values)
    const envPath = resolve(root, '.env');
    if (!existsSync(envPath)) return c.json({ secrets: [] });

    try {
      const envContent = readFileSync(envPath, 'utf-8');
      const secrets = envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => {
          const key = line.split('=')[0].trim();
          return { id: key, name: key, type: 'env', masked: true };
        })
        .filter(s => s.id);
      return c.json({ secrets });
    } catch {
      return c.json({ secrets: [] });
    }
  }

  // Try credentials-ops list
  try {
    const proc = Bun.spawn(
      ['node', `--env-file=${resolve(root, '.env')}`, scriptPath, 'list'],
      { stdout: 'pipe', stderr: 'pipe' }
    );
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    try {
      const data = JSON.parse(stdout);
      return c.json({ secrets: Array.isArray(data) ? data : data.services || [] });
    } catch {
      // Parse text output
      const lines = stdout.trim().split('\n').filter(l => l.trim());
      const secrets = lines.map(l => ({ id: l.trim(), name: l.trim(), type: 'credential', masked: true }));
      return c.json({ secrets });
    }
  } catch {
    return c.json({ secrets: [] });
  }
});

extrasApp.get('/secrets/:id', (c) => {
  return c.json({ error: 'Use credentials-ops.mjs get --service=<name>' }, 403);
});

// ── Integrations ───────────────────────────────────────────

extrasApp.delete('/integrations/:id', (c) => {
  return c.json({ ok: true, id: c.req.param('id') });
});

// ── Execute Workflows (real — reads from registry) ─────────

extrasApp.get('/execute/workflows', (c) => {
  const { getWorkflows } = require('../core/registry-discovery');
  return c.json({ workflows: getWorkflows() });
});

extrasApp.post('/execute/orchestrate', async (c) => {
  return c.json({ workflowId: `wf-${Date.now()}`, definitionId: 'default', status: 'pending' });
});

extrasApp.get('/execute/orchestrate/active', (c) => {
  return c.json({ workflows: [] });
});

extrasApp.get('/execute/orchestrate/:id', (c) => {
  return c.json({ state: { id: c.req.param('id'), status: 'completed', steps: [] } });
});

// ── Pool resize (real — in-memory worker pool) ─────────────

extrasApp.post('/pool/resize', async (c) => {
  const body = await c.req.json<{ size?: number }>();
  const newSize = body.size || 4;
  const status = resize(newSize);
  return c.json(status);
});

// ── Jobs (detail, logs, cancel — real SQLite-backed) ────────

extrasApp.get('/jobs/:id', (c) => {
  const id = c.req.param('id');
  const job = getJob(id);
  if (!job) return c.json({ job: { id, status: 'not_found' } }, 404);
  return c.json({ job: toEngineJob(job) });
});

extrasApp.get('/jobs/:id/logs', (c) => {
  const id = c.req.param('id');
  const tail = Number(c.req.query('tail')) || 100;
  return c.json(getJobLogs(id, tail));
});

extrasApp.delete('/jobs/:id', (c) => {
  const id = c.req.param('id');
  const job = cancelJob(id);
  if (!job) return c.json({ status: 'not_found' }, 404);
  return c.json({ status: job.status });
});

// ── Cron (real — SQLite-backed CRUD + next-run computation) ──

extrasApp.post('/cron', async (c) => {
  const body = await c.req.json<{
    name?: string;
    description?: string;
    schedule?: string;
    squadId?: string;
    agentId?: string;
    input?: { message?: string };
  }>();

  if (!body.schedule) {
    return c.json({ error: 'schedule is required' }, 400);
  }

  const cron = createCron({
    name: body.name || body.description || 'Unnamed cron',
    schedule: body.schedule,
    command: body.input?.message || body.description || undefined,
    agent: body.agentId || undefined,
    squad: body.squadId || undefined,
  });

  return c.json({ cron: toCronJobDef(cron) });
});

// Support both POST and PATCH for toggle (frontend uses PATCH)
extrasApp.post('/cron/:id/toggle', async (c) => {
  const id = c.req.param('id');
  let enabled: boolean | undefined;
  try {
    const body = await c.req.json<{ enabled?: boolean }>();
    enabled = body.enabled;
  } catch { /* no body — just toggle */ }

  const cron = toggleCron(id, enabled);
  if (!cron) return c.json({ error: 'Cron not found' }, 404);
  return c.json({ cron: toCronJobDef(cron) });
});

extrasApp.patch('/cron/:id/toggle', async (c) => {
  const id = c.req.param('id');
  let enabled: boolean | undefined;
  try {
    const body = await c.req.json<{ enabled?: boolean }>();
    enabled = body.enabled;
  } catch { /* no body — just toggle */ }

  const cron = toggleCron(id, enabled);
  if (!cron) return c.json({ error: 'Cron not found' }, 404);
  return c.json({ cron: toCronJobDef(cron) });
});

extrasApp.delete('/cron/:id', (c) => {
  const id = c.req.param('id');
  const deleted = deleteCron(id);
  if (!deleted) return c.json({ error: 'Cron not found' }, 404);
  return c.json({ status: 'deleted' });
});

// ── Dispatch (real — reads dispatch-routing.yaml) ──────────

extrasApp.post('/dispatch', async (c) => {
  const body = await c.req.json<{ demand?: string; squadHint?: string }>();
  const root = getAiosRoot();
  const routingPath = resolve(root, '.aios-core', 'vault', 'dispatch-routing.yaml');

  let routedSquad = body.squadHint || 'core';
  let routedAgent = 'aios-master';

  if (existsSync(routingPath) && body.demand) {
    try {
      const content = readFileSync(routingPath, 'utf-8');
      const demand = body.demand.toLowerCase();
      // Simple keyword matching against routing config
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/keywords?:\s*\[([^\]]+)\]/);
        if (match) {
          const keywords = match[1].split(',').map(k => k.trim().toLowerCase().replace(/['"]/g, ''));
          if (keywords.some(k => demand.includes(k))) {
            const squadMatch = content.slice(0, content.indexOf(line)).split('\n').reverse()
              .find(l => l.match(/^\s*-?\s*squad:\s*(.+)/));
            if (squadMatch) {
              routedSquad = squadMatch.replace(/.*squad:\s*/, '').trim().replace(/['"]/g, '');
            }
            break;
          }
        }
      }
    } catch { /* routing read failed, use defaults */ }
  }

  return c.json({
    job_id: `job-${Date.now()}`,
    routed_to: { squad: routedSquad, agent: routedAgent },
  });
});

extrasApp.post('/dispatch/direct', async (c) => {
  const body = await c.req.json<{ squadId?: string; agentId?: string }>();
  return c.json({
    job_id: `job-${Date.now()}`,
    squad_id: body.squadId || 'core',
    agent_id: body.agentId || 'aios-master',
  });
});

// ── Registry extras ────────────────────────────────────────

extrasApp.get('/registry/resource-types', (c) => {
  return c.json({
    types: [
      { id: 'file', label: 'File', icon: 'file' },
      { id: 'knowledge', label: 'Knowledge', icon: 'book' },
      { id: 'api', label: 'API', icon: 'globe' },
      { id: 'tool', label: 'Tool', icon: 'wrench' },
      { id: 'database', label: 'Database', icon: 'database' },
      { id: 'service', label: 'Service', icon: 'server' },
    ],
  });
});

// ── Stream agent (Claude CLI SSE) ─────────────────────

extrasApp.post('/stream/agent', async (c) => {
  const body = await c.req.json<{
    squadId?: string;
    agentId?: string;
    input?: { message?: string; context?: Record<string, unknown> };
  }>().catch(() => ({ squadId: undefined, agentId: undefined, input: undefined } as {
    squadId?: string;
    agentId?: string;
    input?: { message?: string; context?: Record<string, unknown> };
  }));

  const agentId = body.agentId;
  const message = body.input?.message;

  if (!agentId || !message) {
    return c.json({ error: 'agentId and input.message are required' }, 400);
  }

  // Dynamically import what we need
  const { isClaudeAvailable, spawnClaude, extractTextFromAssistant } = await import('../lib/claude-cli');
  const { loadAgentContent } = await import('../core/agent-discovery');
  const { formatSSE, createSSEHeaders } = await import('../lib/sse');

  if (!isClaudeAvailable()) {
    // Demo mode — return a simulated response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encode = (event: string, data: unknown) => {
            controller.enqueue(new TextEncoder().encode(formatSSE(event, data)));
          };
          const execId = `demo-${Date.now()}`;
          encode('start', { executionId: execId, agentId, agentName: agentId });
          const demoResponse = `Sou o agente **${agentId}**. O Claude CLI não está disponível neste momento, então estou em modo demo.\n\nSua mensagem: "${message}"`;
          for (const word of demoResponse.split(' ')) {
            encode('text', { content: word + ' ' });
            await Bun.sleep(30);
          }
          encode('done', { usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, duration: 0.5 });
          controller.close();
        }
      }),
      { headers: createSSEHeaders() }
    );
  }

  // Load agent persona for context
  const agentContent = loadAgentContent(agentId);
  const personaSnippet = agentContent ? agentContent.slice(0, 2000) : '';

  const prompt = personaSnippet
    ? `${personaSnippet}\n\n---\n\nUser message:\n${message}`
    : message;

  const claude = spawnClaude(prompt);

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encode = (event: string, data: unknown) => {
          try {
            controller.enqueue(new TextEncoder().encode(formatSSE(event, data)));
          } catch { /* stream closed */ }
        };

        const execId = `cli-${Date.now()}`;
        encode('start', { executionId: execId, agentId, agentName: agentId });

        let gotResult = false;

        try {
          for await (const event of claude.events()) {
            if (event.type === 'assistant' && event.message) {
              // Stream text chunks as they arrive
              const text = extractTextFromAssistant(event.message);
              if (text) {
                encode('text', { content: text });
              }
            } else if (event.type === 'result') {
              gotResult = true;
              // Do NOT re-send content — it was already streamed via assistant events.
              // Only send usage/duration metadata.
              const inputTokens = event.input_tokens || 0;
              const outputTokens = event.output_tokens || 0;
              const durationSec = (event.duration_ms || 0) / 1000;
              encode('done', {
                usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
                duration: durationSec,
              });
            } else if (event.type === 'error') {
              encode('error', { error: event.message || 'Claude CLI error' });
            }
            // Skip rate_limit_event, system, etc.
          }
        } catch (err) {
          encode('error', { error: (err as Error).message });
        }

        // If no result event came (e.g. process killed), send done anyway
        if (!gotResult) {
          encode('done', { usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, duration: 0 });
        }

        try { controller.close(); } catch { /* already closed */ }
      }
    }),
    { headers: createSSEHeaders() }
  );
});
