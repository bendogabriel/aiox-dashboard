import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createTask, listTasks, getTask } from '@/lib/task-store';
import { startTaskExecution } from '@/lib/task-executor';
import { persistTask, isPersistenceAvailable, fetchPersistedTasks } from '@/lib/task-persistence';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const status = url.searchParams.get('status') || undefined;

  // Get live tasks from in-memory store
  let memoryTasks = listTasks(limit);
  if (status) {
    memoryTasks = memoryTasks.filter((t) => t.status === status);
  }

  // Hydrate with historical tasks from Supabase
  const memoryIds = new Set(memoryTasks.map(t => t.id));
  const dbTasks = await fetchPersistedTasks({
    limit,
    status,
    excludeIds: memoryIds,
  });

  // Merge: in-memory tasks first (more complete), then DB historical
  const allTasks = [
    ...memoryTasks.map(t => ({
      id: t.id,
      demand: t.demand,
      status: t.status,
      squads: t.squads,
      outputs: t.outputs,
      createdAt: t.createdAt,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      error: t.error,
    })),
    ...dbTasks.map(t => ({
      id: t.id,
      demand: t.demand,
      status: t.status,
      squads: t.squads,
      outputs: t.outputs,
      createdAt: t.createdAt,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      error: t.error,
      source: 'database' as const,
    })),
  ];

  // Sort by creation date, most recent first, then trim to limit
  allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const limited = allTasks.slice(0, limit);

  return NextResponse.json({
    tasks: limited,
    total: allTasks.length,
    limit,
    offset: 0,
    dbPersistence: isPersistenceAvailable(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const demand = body.demand as string;

    if (!demand?.trim()) {
      return NextResponse.json({ error: 'demand is required' }, { status: 400 });
    }

    const taskId = randomUUID();
    createTask(taskId, demand.trim());

    // Persist initial state to Supabase (fire-and-forget)
    const task = getTask(taskId);
    if (task) persistTask(task);

    // Fire-and-forget — execution runs in the background
    startTaskExecution(taskId);

    return NextResponse.json({
      taskId,
      status: 'created',
      message: `Task created. Connect to /api/tasks/${taskId}/stream for real-time updates.`,
      dbPersistence: isPersistenceAvailable(),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
