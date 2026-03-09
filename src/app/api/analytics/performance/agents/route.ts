import { NextResponse } from 'next/server';
import { listTasks } from '@/lib/task-store';
import { fetchPersistedTasks } from '@/lib/task-persistence';

/**
 * GET /api/analytics/performance/agents
 * Returns per-agent performance metrics from task history.
 */
export async function GET() {
  // Merge in-memory + Supabase
  const memoryTasks = listTasks(500);
  const memoryIds = new Set(memoryTasks.map(t => t.id));
  const dbTasks = await fetchPersistedTasks({ limit: 500, excludeIds: memoryIds });

  const allTasks = [
    ...memoryTasks.map(t => ({
      status: t.status, squads: t.squads,
      startedAt: t.startedAt, completedAt: t.completedAt,
    })),
    ...dbTasks.map(t => ({
      status: t.status, squads: t.squads,
      startedAt: t.startedAt, completedAt: t.completedAt,
    })),
  ];

  // Aggregate per agent
  const agentStats = new Map<string, {
    name: string; squadId: string;
    executions: number; successes: number; failures: number;
    totalDurationMs: number; durationsCount: number;
  }>();

  for (const task of allTasks) {
    const durationMs = task.startedAt && task.completedAt
      ? new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()
      : 0;

    for (const squad of (task.squads || [])) {
      for (const agent of (squad.agents || [])) {
        const existing = agentStats.get(agent.id) || {
          name: agent.name, squadId: squad.squadId,
          executions: 0, successes: 0, failures: 0,
          totalDurationMs: 0, durationsCount: 0,
        };
        existing.executions++;
        if (task.status === 'completed') existing.successes++;
        if (task.status === 'failed') existing.failures++;
        if (durationMs > 0) {
          existing.totalDurationMs += durationMs;
          existing.durationsCount++;
        }
        agentStats.set(agent.id, existing);
      }
    }
  }

  const agents = Array.from(agentStats.entries())
    .map(([agentId, s]) => ({
      agent_id: agentId,
      agent_name: s.name,
      squad_id: s.squadId,
      total_executions: s.executions,
      successful_executions: s.successes,
      failed_executions: s.failures,
      success_rate: s.executions > 0 ? Math.round((s.successes / s.executions) * 100) / 100 : 1.0,
      avg_duration_ms: s.durationsCount > 0 ? Math.round(s.totalDurationMs / s.durationsCount) : 0,
    }))
    .sort((a, b) => b.total_executions - a.total_executions);

  const totalExec = agents.reduce((s, a) => s + a.total_executions, 0);
  const totalSuccess = agents.reduce((s, a) => s + a.successful_executions, 0);
  const avgDurations = agents.filter(a => a.avg_duration_ms > 0);
  const avgDurationMs = avgDurations.length > 0
    ? Math.round(avgDurations.reduce((s, a) => s + a.avg_duration_ms, 0) / avgDurations.length)
    : 0;

  return NextResponse.json({
    agents,
    summary: {
      total_executions: totalExec,
      avg_duration_ms: avgDurationMs,
      success_rate: totalExec > 0 ? Math.round((totalSuccess / totalExec) * 100) / 100 : 1.0,
    },
  });
}
