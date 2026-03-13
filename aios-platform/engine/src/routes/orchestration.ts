/**
 * Orchestration Router — Task creation, SSE streaming, task details.
 *
 * Extracted from stubs.ts to avoid route-priority conflicts with jobs.ts.
 * Mounted at /orchestration in index.ts — frontend calls /api/orchestration/tasks/*.
 * Also provides /tasks/* aliases for backward compat.
 *
 * Types: imports from shared/api-contract.ts (SSOT).
 */

import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { log } from '../lib/logger';
import { parseArtifacts } from '../lib/artifact-parser';
import {
  ENGINE_TO_FRONTEND_STATUS,
  encodeDemand,
  decodeDemand,
  type TaskResponse,
  type TaskStepOutput,
  type TaskAgentRef,
  type CreateTaskResponse,
} from '../../../shared/api-contract';

// Re-use agent discovery from stubs (imported lazily to avoid circular)
let _discoverAllAgents: ((squadFilter?: string) => Array<{ id: string; name: string; squad: string; tier: number; title: string; description: string; role: string }>) | null = null;
let _formatName: ((slug: string) => string) | null = null;

export function setAgentDiscovery(
  discover: typeof _discoverAllAgents,
  format: typeof _formatName,
) {
  _discoverAllAgents = discover;
  _formatName = format;
}

function discoverAllAgents(squadFilter?: string) {
  if (!_discoverAllAgents) throw new Error('Agent discovery not initialized');
  return _discoverAllAgents(squadFilter);
}

function formatName(slug: string) {
  if (_formatName) return _formatName(slug);
  return slug.replace(/\.(md|yaml|yml|json)$/i, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Output Persistence ─────────────────────────────────
async function persistTaskOutputs(
  taskId: string, demand: string,
  outputs: Array<{ stepId: string; stepName: string; agent: TaskAgentRef & { title: string }; role: string; accumulated: string; artifacts: unknown[] }>,
) {
  // 1. Save to SQLite
  try {
    const db = getDb();
    const serialized = JSON.stringify(outputs.map(o => ({
      stepId: o.stepId, stepName: o.stepName,
      output: { response: o.accumulated, artifacts: o.artifacts, agent: o.agent, role: o.role },
    })));
    db.run("UPDATE jobs SET status = 'done', completed_at = ?, output_result = ? WHERE id = ?",
      [new Date().toISOString(), serialized, taskId]);
  } catch (e) { log.error('Failed to save outputs to DB:', { error: String(e) }); }

  // 2. Save as markdown file
  try {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const outputDir = `${process.cwd()}/docs/orchestration-outputs`;
    await mkdir(outputDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const slug = demand.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/-+$/, '');
    let md = `# Orchestration Output\n\n`;
    md += `**Demanda:** ${demand}\n`;
    md += `**Task ID:** \`${taskId}\`\n`;
    md += `**Data:** ${new Date().toISOString()}\n\n---\n\n`;
    for (const o of outputs) {
      md += `## ${o.stepName} (${o.agent.name})\n\n`;
      md += `**Role:** ${o.role} | **Squad:** ${o.agent.squad}\n\n`;
      md += o.accumulated + '\n\n---\n\n';
    }
    await writeFile(`${outputDir}/${ts}_${slug || 'task'}.md`, md, 'utf-8');
    log.info(`Task outputs saved to docs/orchestration-outputs/${ts}_${slug || 'task'}.md`);
  } catch (e) { log.error('Failed to save outputs to file:', { error: String(e) }); }
}

const orchestration = new Hono();

// ─── GET /tasks — List orchestration tasks ───────────────

orchestration.get('/tasks', (c) => {
  try {
    const db = getDb();
    const rows = db.query<{
      id: string; agent_id: string; input_payload: string; status: string;
      created_at: string; completed_at: string | null;
    }, []>(
      "SELECT id, agent_id, input_payload, status, created_at, completed_at FROM jobs WHERE squad_id = 'orchestrator' ORDER BY created_at DESC LIMIT 100",
    ).all();
    const tasks = rows.map(r => ({
      id: r.id,
      agentId: r.agent_id,
      demand: decodeDemand(r.input_payload),
      status: ENGINE_TO_FRONTEND_STATUS[r.status] || r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
    }));
    return c.json({ tasks, total: tasks.length });
  } catch {
    return c.json({ tasks: [], total: 0 });
  }
});

// ─── POST /tasks — Create orchestration task ─────────────

orchestration.post('/tasks', async (c) => {
  try {
    const body = await c.req.json<{ demand?: string }>();
    const taskId = crypto.randomUUID();
    const demand = body.demand ?? '';
    const db = getDb();
    db.run(
      'INSERT INTO jobs (id, squad_id, agent_id, input_payload, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, 'orchestrator', 'bob', encodeDemand(demand), 'pending', new Date().toISOString()],
    );
    return c.json({ taskId, status: 'created' } satisfies CreateTaskResponse, 201);
  } catch (err) {
    log.error('Failed to create orchestration task:', { error: String(err) });
    return c.json({ taskId: crypto.randomUUID(), status: 'created' } satisfies CreateTaskResponse, 201);
  }
});

// ─── GET /tasks/:id — Fetch task details (catch-up polling) ──

orchestration.get('/tasks/:id', (c) => {
  const taskId = c.req.param('id');
  try {
    const db = getDb();
    const row = db.query<{
      id: string; status: string; input_payload: string; agent_id: string; squad_id: string;
      created_at: string; started_at: string | null; completed_at: string | null;
      error_message: string | null; output_result: string | null;
    }, [string]>(
      'SELECT id, status, input_payload, agent_id, squad_id, created_at, started_at, completed_at, error_message, output_result FROM jobs WHERE id = ?',
    ).get(taskId);

    if (!row) return c.json({ error: 'Task not found' }, 404);

    let outputs: TaskStepOutput[] = [];
    if (row.output_result) {
      try {
        const parsed = JSON.parse(row.output_result);
        outputs = Array.isArray(parsed) ? parsed : [];
      } catch { /* ignore */ }
    }

    const response: TaskResponse = {
      id: row.id,
      status: ENGINE_TO_FRONTEND_STATUS[row.status] || row.status,
      demand: decodeDemand(row.input_payload),
      squads: [],
      workflow: null,
      outputs,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      error: row.error_message,
    };

    return c.json(response);
  } catch {
    return c.json({ error: 'Task not found' }, 404);
  }
});

// ─── GET /tasks/:id/stream — SSE orchestration stream ────

orchestration.get('/tasks/:id/stream', (c) => {
  const taskId = c.req.param('id');

  // Check if real execution is possible
  const hasLLMKey = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
  let hasClaudeCLI = false;
  if (!hasLLMKey) {
    try {
      const check = Bun.spawnSync(['claude', '--version'], { stdout: 'pipe', stderr: 'pipe' });
      hasClaudeCLI = check.exitCode === 0;
    } catch { /* not installed */ }
  }
  const useRealExecution = hasLLMKey || hasClaudeCLI;

  // Retrieve demand from query param (primary) or DB (fallback)
  let demand = c.req.query('demand') ?? '';
  if (!demand) {
    try {
      const db = getDb();
      const row = db.query<{ input_payload: string }, [string]>(
        'SELECT input_payload FROM jobs WHERE id = ?',
      ).get(taskId);
      if (row?.input_payload) {
        demand = decodeDemand(row.input_payload);
      }
    } catch { /* ignore */ }
  }

  // Discover agents
  const allAgents = discoverAllAgents();
  const findAgent = (id: string): TaskAgentRef & { title: string } => {
    const a = allAgents.find(ag => ag.id === id);
    return a
      ? { id: a.id, name: a.name, squad: a.squad, title: a.title }
      : { id, name: formatName(id), squad: 'core', title: formatName(id) };
  };

  const architectAgent = findAgent('architect');
  const devAgent = findAgent('dev');

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* controller closed */ }
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
        const executeStep = async (
          stepId: string, stepName: string,
          agent: TaskAgentRef & { title: string }, role: string, prompt: string,
        ) => {
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
          let inputTokens = 0;
          let outputTokens = 0;
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
                  // Use ONLY content_block_delta for streaming, with result as final fallback.
                  // NEVER accumulate from assistant — it always duplicates delta/result text.
                  let text = '';
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    text = parsed.delta.text;
                    gotDeltas = true;
                  } else if (parsed.type === 'result') {
                    // Extract token usage from result event
                    if (parsed.usage) {
                      inputTokens = parsed.usage.input_tokens || parsed.usage.inputTokens || 0;
                      outputTokens = parsed.usage.output_tokens || parsed.usage.outputTokens || 0;
                    }
                    if (parsed.result && !gotDeltas) {
                      text = String(parsed.result);
                    }
                  }
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

          // Process remaining buffer
          if (buffer.trim()) {
            try {
              const parsedBuf = JSON.parse(buffer);
              if (parsedBuf.type === 'content_block_delta' && parsedBuf.delta?.text) {
                accumulated += parsedBuf.delta.text;
                gotDeltas = true;
              } else if (parsedBuf.type === 'result') {
                if (parsedBuf.usage) {
                  inputTokens = parsedBuf.usage.input_tokens || parsedBuf.usage.inputTokens || 0;
                  outputTokens = parsedBuf.usage.output_tokens || parsedBuf.usage.outputTokens || 0;
                }
                if (parsedBuf.result && !gotDeltas) {
                  accumulated += String(parsedBuf.result);
                }
              }
            } catch {
              accumulated += buffer;
            }
            send('step:streaming:chunk', { taskId, stepId, accumulated });
          }

          const exitCode = await proc.exited;
          const durationMs = Date.now() - startTime;

          // Simulate streaming if full text received at once (no content_block_delta in -p mode)
          if (!gotDeltas && accumulated.length > 0) {
            const fullText = accumulated;
            accumulated = '';
            const chunkSize = 60;
            for (let i = 0; i < fullText.length; i += chunkSize) {
              accumulated = fullText.slice(0, i + chunkSize);
              send('step:streaming:chunk', { taskId, stepId, accumulated });
              await delay(15 + Math.random() * 30);
            }
            accumulated = fullText;
          }

          accumulated = accumulated.trim();
          const artifacts = parseArtifacts(accumulated);

          send('step:streaming:end', {
            taskId, stepId, stepName, agent, role,
            response: accumulated,
            artifacts,
            llmMetadata: { provider: 'anthropic', model: 'claude-cli', inputTokens, outputTokens },
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
        const step2 = await executeStep('step-2', 'Developer Implementation', devAgent, 'Developer', step2Prompt);

        // Persist outputs to SQLite + filesystem
        persistTaskOutputs(taskId, demand, [
          { stepId: 'step-1', stepName: 'Architect Analysis', agent: architectAgent, role: 'Architect', accumulated: step1.accumulated, artifacts: step1.artifacts },
          { stepId: 'step-2', stepName: 'Developer Implementation', agent: devAgent, role: 'Developer', accumulated: step2.accumulated, artifacts: step2.artifacts },
        ]).catch(() => {});

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

        // Persist demo outputs to SQLite + filesystem
        persistTaskOutputs(taskId, demand, [
          { stepId: 'step-1', stepName: 'Architect Analysis', agent: architectAgent, role: 'Architect', accumulated: acc1, artifacts: parseArtifacts(acc1) },
          { stepId: 'step-2', stepName: 'Developer Implementation', agent: devAgent, role: 'Developer', accumulated: acc2, artifacts: parseArtifacts(acc2) },
        ]).catch(() => {});

        send('task:completed', { taskId, status: 'completed' });
      }

      try { controller.close(); } catch { /* already closed */ }
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

// ─── POST /tasks/:id/approve — Approve execution plan ────

orchestration.post('/tasks/:id/approve', async (c) => {
  const taskId = c.req.param('id');
  try {
    const db = getDb();
    db.run("UPDATE jobs SET status = 'running' WHERE id = ?", [taskId]);
    return c.json({ taskId, status: 'approved' });
  } catch {
    return c.json({ error: 'Failed to approve' }, 400);
  }
});

// ─── POST /tasks/:id/revise — Revise execution plan ──────

orchestration.post('/tasks/:id/revise', async (c) => {
  const taskId = c.req.param('id');
  try {
    const body = await c.req.json<{ feedback?: string }>();
    const db = getDb();
    db.run("UPDATE jobs SET status = 'pending' WHERE id = ?", [taskId]);
    return c.json({ taskId, status: 'revised', feedback: body.feedback });
  } catch {
    return c.json({ error: 'Failed to revise' }, 400);
  }
});

export { orchestration };
