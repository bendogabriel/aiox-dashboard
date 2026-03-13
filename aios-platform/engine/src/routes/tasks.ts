/**
 * Task orchestration routes.
 *
 * POST /tasks          — Create a new task
 * GET  /tasks/:id      — Get task state (catch-up polling)
 * GET  /tasks/:id/stream — SSE stream (main lifecycle endpoint)
 * POST /tasks/:id/approve — Approve execution plan
 * POST /tasks/:id/revise  — Revise plan with feedback
 */
import { Hono } from 'hono';
import { formatSSE, createSSEHeaders } from '../lib/sse';
import * as taskStore from '../core/task-store';
import { discoverAgents, getAgent } from '../core/agent-discovery';
import { generatePlan, replanWithFeedback, buildFallbackPlan } from '../core/planner';
import { executeStep, type StepResult } from '../core/executor';
import type { ExecutionPlan, PlanStep } from '../core/planner';

export const tasksApp = new Hono();

// ─── POST /tasks ───────────────────────────────────────────

tasksApp.post('/', async (c) => {
  const body = await c.req.json<{ demand?: string }>();

  if (!body.demand || typeof body.demand !== 'string' || !body.demand.trim()) {
    return c.json({ error: 'demand is required' }, 400);
  }

  const taskId = taskStore.createTask(body.demand.trim());
  return c.json({ taskId, status: 'pending' });
});

// ─── GET /tasks/:id ────────────────────────────────────────

tasksApp.get('/:id', (c) => {
  const task = taskStore.getTask(c.req.param('id'));
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const squads = task.squads ? JSON.parse(task.squads) : [];
  const outputs = task.outputs ? JSON.parse(task.outputs) : [];
  const plan = task.plan ? JSON.parse(task.plan) : null;

  return c.json({
    id: task.id,
    demand: task.demand,
    status: task.status,
    squads,
    workflow: plan
      ? { id: `wf-${task.id.slice(0, 8)}`, name: 'Orchestration', stepCount: plan.steps?.length || 0 }
      : null,
    outputs,
    createdAt: task.created_at,
    startedAt: task.started_at,
    completedAt: task.completed_at,
    totalTokens: outputs.reduce(
      (sum: number, o: { output?: { llmMetadata?: { inputTokens?: number; outputTokens?: number } } }) => {
        const meta = o.output?.llmMetadata;
        return sum + (meta?.inputTokens || 0) + (meta?.outputTokens || 0);
      },
      0
    ),
    totalDuration:
      task.started_at && task.completed_at
        ? new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()
        : undefined,
    stepCount: plan?.steps?.length,
    completedSteps: outputs.length,
    error: task.error,
    plan,
  });
});

// ─── POST /tasks/:id/approve ───────────────────────────────

tasksApp.post('/:id/approve', (c) => {
  const task = taskStore.getTask(c.req.param('id'));
  if (!task) return c.json({ error: 'Task not found' }, 404);

  taskStore.updateTask(task.id, { status: 'executing' });
  return c.json({ ok: true });
});

// ─── POST /tasks/:id/revise ────────────────────────────────

tasksApp.post('/:id/revise', async (c) => {
  const task = taskStore.getTask(c.req.param('id'));
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const body = await c.req.json<{ feedback?: string }>();
  if (!body.feedback || typeof body.feedback !== 'string') {
    return c.json({ error: 'feedback is required' }, 400);
  }

  taskStore.updateTask(task.id, {
    status: 'planning',
    feedback: body.feedback,
  });

  return c.json({ ok: true });
});

// ─── GET /tasks/:id/stream (SSE) ──────────────────────────

tasksApp.get('/:id/stream', async (c) => {
  const taskId = c.req.param('id');
  const demandParam = c.req.query('demand') || '';
  let task = taskStore.getTask(taskId);

  // If task doesn't exist but demand is provided, create it
  if (!task && demandParam) {
    taskStore.createTask(demandParam);
    // Re-read with the generated ID — but we used the URL's taskId
    // Actually the task was already created by POST /tasks, so just get it
    task = taskStore.getTask(taskId);
  }

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const demand = task.demand || decodeURIComponent(demandParam);

  return new Response(
    new ReadableStream({
      async start(controller) {
        const emit = (event: string, data: unknown) => {
          try {
            controller.enqueue(new TextEncoder().encode(formatSSE(event, data)));
          } catch {
            // Stream closed
          }
        };

        try {
          await runTaskLifecycle(taskId, demand, emit);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[SSE] Task ${taskId} error:`, errorMsg);
          emit('task:failed', { error: errorMsg });
          taskStore.updateTask(taskId, {
            status: 'failed',
            error: errorMsg,
          });
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
    }),
    { headers: createSSEHeaders() }
  );
});

// ─── Task Lifecycle ────────────────────────────────────────

type EmitFn = (event: string, data: unknown) => void;

async function runTaskLifecycle(
  taskId: string,
  demand: string,
  emit: EmitFn
): Promise<void> {
  const startTime = Date.now();

  // Phase 1: Emit current state
  emit('task:state', { status: 'analyzing' });

  // Phase 2: Analysis — discover agents
  emit('task:analyzing', {});
  taskStore.updateTask(taskId, {
    status: 'analyzing',
    started_at: new Date().toISOString(),
  });

  const agents = discoverAgents();
  console.log(`[SSE] Discovered ${agents.length} agents`);

  // Build squad selections from unique squads
  const squadMap = new Map<
    string,
    { squadId: string; chief: string; agentCount: number; agents: Array<{ id: string; name: string }> }
  >();
  for (const agent of agents) {
    const existing = squadMap.get(agent.squad);
    if (existing) {
      existing.agentCount++;
      existing.agents.push({ id: agent.id, name: agent.name });
    } else {
      squadMap.set(agent.squad, {
        squadId: agent.squad,
        chief: agent.id,
        agentCount: 1,
        agents: [{ id: agent.id, name: agent.name }],
      });
    }
  }

  const squadSelections = Array.from(squadMap.values());
  emit('task:squads-selected', { squads: squadSelections });
  taskStore.updateTask(taskId, {
    squads: JSON.stringify(squadSelections),
  });

  // Phase 3: Planning
  await planAndAwaitApproval(taskId, demand, agents, emit, null);

  // Phase 4: Execution
  const task = taskStore.getTask(taskId)!;
  const plan: ExecutionPlan = JSON.parse(task.plan!);

  emit('task:executing', {});
  taskStore.updateTask(taskId, { status: 'executing' });

  const outputs: StepResult[] = [];
  const stepOutputs: Array<{
    stepId: string;
    stepName: string;
    output: {
      response: string;
      agent: { id: string; name: string; squad: string };
      role: string;
      processingTimeMs: number;
      llmMetadata?: { provider: string; model: string; inputTokens?: number; outputTokens?: number };
    };
  }> = [];

  for (const step of plan.steps) {
    const agentRef = {
      id: step.agentId,
      name: step.agentName,
      squad: step.squadId,
    };

    emit('step:started', { stepId: step.id });
    emit('step:streaming:start', {
      stepId: step.id,
      stepName: step.task.slice(0, 80),
      agent: agentRef,
      role: 'specialist',
    });

    const result = await executeStep(step, demand, outputs, (accumulated) => {
      emit('step:streaming:chunk', { stepId: step.id, accumulated });
    });

    const stepOutput = {
      response: result.response,
      agent: agentRef,
      role: 'specialist',
      processingTimeMs: result.processingTimeMs,
      llmMetadata: result.llmMetadata,
    };

    emit('step:streaming:end', {
      stepId: step.id,
      stepName: step.task.slice(0, 80),
      agent: agentRef,
      response: result.response,
      llmMetadata: result.llmMetadata,
    });

    emit('step:completed', {
      stepId: step.id,
      output: { ...stepOutput, stepName: step.task.slice(0, 80) },
    });

    outputs.push(result);
    stepOutputs.push({
      stepId: step.id,
      stepName: step.task.slice(0, 80),
      output: stepOutput,
    });

    // Persist outputs incrementally
    taskStore.updateTask(taskId, {
      outputs: JSON.stringify(stepOutputs),
    });
  }

  // Phase 5: Completion
  const totalDuration = Date.now() - startTime;
  const totalTokens = outputs.reduce((sum, o) => {
    return (
      sum + (o.llmMetadata?.inputTokens || 0) + (o.llmMetadata?.outputTokens || 0)
    );
  }, 0);

  emit('task:completed', {
    outputs: stepOutputs,
    totalDuration,
    totalTokens,
  });

  taskStore.updateTask(taskId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  console.log(
    `[SSE] Task ${taskId} completed in ${totalDuration}ms, ${outputs.length} steps`
  );
}

async function planAndAwaitApproval(
  taskId: string,
  demand: string,
  agents: ReturnType<typeof discoverAgents>,
  emit: EmitFn,
  previousPlan: ExecutionPlan | null
): Promise<void> {
  emit('task:planning', {});
  taskStore.updateTask(taskId, { status: 'planning' });

  // Generate plan
  const task = taskStore.getTask(taskId)!;
  let plan: ExecutionPlan;

  if (previousPlan && task.feedback) {
    plan = await replanWithFeedback(demand, previousPlan, task.feedback, agents);
  } else {
    plan = await generatePlan(demand, agents);
  }

  // Check if approval came in while we were generating the plan (race condition)
  const currentAfterPlan = taskStore.getTask(taskId);
  if (currentAfterPlan?.status === 'executing') {
    // User already approved — save plan and return immediately
    taskStore.updateTask(taskId, { plan: JSON.stringify(plan) });
    emit('task:plan-ready', { plan });
    console.log(`[SSE] Plan saved (early approval detected) for task ${taskId}`);
    return;
  }

  // Save plan and emit
  taskStore.updateTask(taskId, {
    plan: JSON.stringify(plan),
    status: 'awaiting_approval',
    feedback: null,
  });

  emit('task:plan-ready', { plan });

  console.log(
    `[SSE] Plan ready for task ${taskId}: ${plan.steps.length} steps, awaiting approval`
  );

  // Poll for approval (check every 500ms, timeout 10 min)
  const POLL_INTERVAL = 500;
  const TIMEOUT = 10 * 60 * 1000;
  const startWait = Date.now();

  while (true) {
    await Bun.sleep(POLL_INTERVAL);

    const current = taskStore.getTask(taskId);
    if (!current) throw new Error('Task disappeared');

    if (current.status === 'executing') {
      // User approved — break out to continue execution
      return;
    }

    if (current.status === 'planning') {
      // User requested revision — replan
      return planAndAwaitApproval(taskId, demand, agents, emit, plan);
    }

    if (current.status === 'failed' || current.status === 'completed') {
      throw new Error(`Task was externally set to ${current.status}`);
    }

    if (Date.now() - startWait > TIMEOUT) {
      throw new Error('Plan approval timeout (10 minutes)');
    }
  }
}
