import { NextResponse } from 'next/server';
import { listTasks } from '@/lib/task-store';
import { fetchPersistedTasks } from '@/lib/task-persistence';

/**
 * GET /api/workflows/executions?limit=20
 * Returns workflow executions derived from task history.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Merge in-memory + Supabase
  const memoryTasks = listTasks(limit);
  const memoryIds = new Set(memoryTasks.map(t => t.id));
  const dbTasks = await fetchPersistedTasks({ limit, excludeIds: memoryIds });

  const allTasks = [
    ...memoryTasks.map(t => ({
      id: t.id, demand: t.demand, status: t.status, squads: t.squads,
      outputs: t.outputs, plan: t.plan, createdAt: t.createdAt,
      startedAt: t.startedAt, completedAt: t.completedAt, error: t.error,
    })),
    ...dbTasks.map(t => ({
      id: t.id, demand: t.demand, status: t.status, squads: t.squads,
      outputs: t.outputs, plan: undefined as undefined, createdAt: t.createdAt,
      startedAt: t.startedAt, completedAt: t.completedAt, error: t.error,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, limit);

  const executions = allTasks.map(t => {
    const durationMs = t.startedAt && t.completedAt
      ? new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime()
      : 0;
    return {
      id: t.id,
      workflowId: t.id,
      workflowName: t.demand.slice(0, 60),
      status: t.status,
      startedAt: t.startedAt || t.createdAt,
      completedAt: t.completedAt,
      durationMs,
      stepsCompleted: t.outputs?.length || 0,
      stepsTotal: t.plan?.steps?.length || t.outputs?.length || 1,
      squads: t.squads?.map(s => s.squadId) || [],
      error: t.error,
    };
  });

  return NextResponse.json({ total: executions.length, executions });
}
