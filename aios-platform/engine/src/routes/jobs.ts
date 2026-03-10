import { Hono } from 'hono';
import * as queue from '../core/job-queue';
import type { JobStatus } from '../types';

const jobs = new Hono();

// GET /jobs
jobs.get('/', (c) => {
  const status = c.req.query('status') as JobStatus | undefined;
  const squad_id = c.req.query('squad_id');
  const agent_id = c.req.query('agent_id');
  const limit = parseInt(c.req.query('limit') ?? '50', 10);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);

  const result = queue.listJobs({ status, squad_id, agent_id, limit, offset });
  return c.json(result);
});

// GET /jobs/queue
jobs.get('/queue', (c) => {
  return c.json({
    pending: queue.getQueueDepth(),
    running: queue.getRunningCount(),
  });
});

// GET /jobs/:id/logs
jobs.get('/:id/logs', (c) => {
  const job = queue.getJob(c.req.param('id'));
  if (!job) return c.json({ error: 'Job not found' }, 404);

  const tail = parseInt(c.req.query('tail') ?? '100', 10);
  const logs: string[] = [];

  // Add job lifecycle events as log lines
  logs.push(`[${job.created_at}] Job created: ${job.squad_id}/${job.agent_id}`);
  if (job.started_at) logs.push(`[${job.started_at}] Job started (PID: ${job.pid ?? 'N/A'})`);
  if (job.output_result) {
    // Split output into lines
    const outputLines = job.output_result.split('\n').filter(Boolean);
    logs.push(...outputLines.map((l: string) => `[output] ${l}`));
  }
  if (job.error_message) logs.push(`[error] ${job.error_message}`);
  if (job.completed_at) logs.push(`[${job.completed_at}] Job ${job.status}`);

  const sliced = logs.slice(-tail);
  return c.json({ logs: sliced, total: logs.length, hasMore: logs.length > tail });
});

// GET /jobs/:id
jobs.get('/:id', (c) => {
  const job = queue.getJob(c.req.param('id'));
  if (!job) return c.json({ error: 'Job not found' }, 404);
  return c.json(job);
});

// POST /jobs/:id/retry
jobs.post('/:id/retry', (c) => {
  try {
    const job = queue.retryJob(c.req.param('id'));
    return c.json(job);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 400);
  }
});

// DELETE /jobs/:id
jobs.delete('/:id', (c) => {
  try {
    queue.cancelJob(c.req.param('id'));
    return c.json({ status: 'cancelled' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 400);
  }
});

export { jobs };
