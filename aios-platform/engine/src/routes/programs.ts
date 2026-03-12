/**
 * Programs API Routes — Story 8.1 + 8.10 + 8.11
 *
 * REST endpoints for managing overnight programs.
 *
 * POST   /programs/start                Start a program
 * GET    /programs                      List all programs
 * GET    /programs/:id                  Get program detail
 * POST   /programs/:id/pause            Pause running program
 * POST   /programs/:id/resume           Resume paused program
 * POST   /programs/:id/cancel           Cancel program
 * GET    /programs/:id/experiments       List experiments for program
 * GET    /programs/:id/journal           Get decision journal summary
 * GET    /programs/:id/analytics         Aggregated analytics
 * GET    /programs/:id/alerts            Get alerts for program
 * GET    /programs/schedules             List scheduled programs
 * POST   /programs/schedules/:id/run     Manual "Run Now"
 * PUT    /programs/schedules/:id         Update schedule
 * POST   /programs/schedules/:id/toggle  Enable/disable schedule
 * GET    /programs/alerts                List all alerts
 */

import { Hono } from 'hono';
import { ProgramRunner } from '../core/program-runner';
import { DecisionJournal } from '../core/decision-journal';
import { AlertDispatcher } from '../core/alert-dispatcher';
import { ProgramScheduler } from '../core/program-scheduler';
import { log } from '../lib/logger';
import type { EngineConfig } from '../types';

export function programRoutes(
  runner: ProgramRunner,
  db: ReturnType<typeof import('../lib/db').initDb>,
  _cfg: EngineConfig,
  alertDispatcher?: AlertDispatcher,
  scheduler?: ProgramScheduler,
) {
  const app = new Hono();

  // ── POST /programs/start — Start a program ──
  app.post('/start', async (c) => {
    const body = await c.req.json<{
      definitionPath: string;
      triggerType?: 'manual' | 'scheduled';
    }>();

    if (!body.definitionPath) {
      return c.json({ error: 'definitionPath is required' }, 400);
    }

    try {
      const state = await runner.start(body.definitionPath, body.triggerType ?? 'manual');
      return c.json(state, 201);
    } catch (err) {
      log.error('Failed to start program', { error: (err as Error).message });
      return c.json({ error: (err as Error).message }, 500);
    }
  });

  // ── GET /programs — List all programs ──
  app.get('/', (c) => {
    const programs = db.query(`
      SELECT id, name, definition_path, status, current_iteration, max_iterations,
             baseline_metric, best_metric, best_iteration, branch_name,
             convergence_reason, tokens_used, estimated_cost, wall_clock_ms,
             trigger_type, started_at, completed_at, created_at
      FROM programs ORDER BY created_at DESC
    `).all();

    return c.json(programs);
  });

  // ── GET /programs/:id — Get program detail ──
  app.get('/:id', (c) => {
    const { id } = c.req.param();
    const program = db.query(`SELECT * FROM programs WHERE id = ?`).get(id);

    if (!program) {
      return c.json({ error: 'Program not found' }, 404);
    }

    return c.json(program);
  });

  // ── POST /programs/:id/pause — Pause running program ──
  app.post('/:id/pause', (c) => {
    const { id } = c.req.param();
    const success = runner.pause(id);

    if (!success) {
      return c.json({ error: 'Program not found or not running' }, 404);
    }

    db.run('UPDATE programs SET status = ? WHERE id = ?', 'paused', id);
    return c.json({ status: 'paused' });
  });

  // ── POST /programs/:id/resume — Resume paused program ──
  app.post('/:id/resume', (c) => {
    const { id } = c.req.param();
    const success = runner.resume(id);

    if (!success) {
      return c.json({ error: 'Program not found or not paused' }, 404);
    }

    db.run('UPDATE programs SET status = ? WHERE id = ?', 'running', id);
    return c.json({ status: 'running' });
  });

  // ── POST /programs/:id/cancel — Cancel program ──
  app.post('/:id/cancel', (c) => {
    const { id } = c.req.param();
    const success = runner.cancel(id);

    if (!success) {
      return c.json({ error: 'Program not found or not active' }, 404);
    }

    db.run('UPDATE programs SET status = ?, completed_at = datetime(?) WHERE id = ?',
      'failed', new Date().toISOString(), id);
    return c.json({ status: 'cancelled' });
  });

  // ── GET /programs/:id/experiments — List experiments ──
  app.get('/:id/experiments', (c) => {
    const { id } = c.req.param();
    const limit = parseInt(c.req.query('limit') ?? '100');
    const offset = parseInt(c.req.query('offset') ?? '0');

    const experiments = db.query(`
      SELECT * FROM experiments
      WHERE program_id = ?
      ORDER BY iteration ASC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    const total = db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM experiments WHERE program_id = ?'
    ).get(id);

    return c.json({
      experiments,
      total: total?.count ?? 0,
      limit,
      offset,
    });
  });

  // ── GET /programs/:id/journal — Get decision journal summary ──
  app.get('/:id/journal', (c) => {
    const { id } = c.req.param();
    const program = db.query<{ name: string; baseline_metric: number; best_metric: number }>(
      'SELECT name, baseline_metric, best_metric FROM programs WHERE id = ?'
    ).get(id);

    if (!program) {
      return c.json({ error: 'Program not found' }, 404);
    }

    const journalName = program.name.replace(/\s+/g, '-').toLowerCase();
    const journal = new DecisionJournal(journalName);

    return c.json({
      summary: journal.summary(program.best_metric, program.baseline_metric),
      patterns: journal.getPatterns(),
      nearMisses: journal.getNearMisses(),
      total: journal.getAll().length,
    });
  });

  // ── GET /programs/:id/analytics — Aggregated analytics ──
  app.get('/:id/analytics', (c) => {
    const { id } = c.req.param();

    const program = db.query<{
      name: string; baseline_metric: number; best_metric: number;
      current_iteration: number; tokens_used: number; estimated_cost: number;
      wall_clock_ms: number;
    }>('SELECT * FROM programs WHERE id = ?').get(id);

    if (!program) {
      return c.json({ error: 'Program not found' }, 404);
    }

    const stats = db.query<{
      total: number;
      keeps: number;
      discards: number;
      errors: number;
      avg_duration: number;
      total_tokens: number;
    }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'keep' THEN 1 ELSE 0 END) as keeps,
        SUM(CASE WHEN status = 'discard' THEN 1 ELSE 0 END) as discards,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
        AVG(duration_ms) as avg_duration,
        SUM(tokens_used) as total_tokens
      FROM experiments WHERE program_id = ?
    `).get(id);

    const metricHistory = db.query<{ iteration: number; metric_after: number; status: string }>(`
      SELECT iteration, metric_after, status
      FROM experiments WHERE program_id = ? AND metric_after IS NOT NULL
      ORDER BY iteration ASC
    `).all(id);

    return c.json({
      program,
      stats,
      metricHistory,
      improvement: program.baseline_metric && program.best_metric
        ? ((program.best_metric - program.baseline_metric) / Math.abs(program.baseline_metric) * 100).toFixed(2) + '%'
        : null,
    });
  });

  // ── GET /programs/:id/alerts — Get alerts for a program ──
  app.get('/:id/alerts', (c) => {
    const { id } = c.req.param();
    const limit = parseInt(c.req.query('limit') ?? '50');

    if (!alertDispatcher) {
      return c.json([]);
    }

    const alerts = alertDispatcher.getAlerts(id, limit);
    return c.json(alerts);
  });

  // ── GET /programs/schedules — List scheduled programs ──
  app.get('/schedules', (c) => {
    if (!scheduler) {
      return c.json([]);
    }

    const schedules = scheduler.listScheduled().map((s) => ({
      ...s,
      scheduleHuman: ProgramScheduler.formatSchedule(s.schedule),
    }));

    return c.json(schedules);
  });

  // ── POST /programs/schedules/:id/run — Manual "Run Now" ──
  app.post('/schedules/:id/run', async (c) => {
    const { id } = c.req.param();

    if (!scheduler) {
      return c.json({ error: 'Scheduler not available' }, 503);
    }

    try {
      const state = await scheduler.runNow(id);
      if (!state) {
        return c.json({ error: 'Schedule not found or program already running' }, 409);
      }
      return c.json(state, 201);
    } catch (err) {
      log.error('Failed to run scheduled program', { error: (err as Error).message });
      return c.json({ error: (err as Error).message }, 500);
    }
  });

  // ── PUT /programs/schedules/:id — Update schedule ──
  app.put('/schedules/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<{ schedule: string }>();

    if (!scheduler) {
      return c.json({ error: 'Scheduler not available' }, 503);
    }

    if (!body.schedule) {
      return c.json({ error: 'schedule is required' }, 400);
    }

    const success = scheduler.updateSchedule(id, body.schedule);
    if (!success) {
      return c.json({ error: 'Invalid schedule or program not found' }, 400);
    }

    const updated = scheduler.getScheduled(id);
    return c.json({
      ...updated,
      scheduleHuman: ProgramScheduler.formatSchedule(body.schedule),
    });
  });

  // ── POST /programs/schedules/:id/toggle — Enable/disable schedule ──
  app.post('/schedules/:id/toggle', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<{ enabled: boolean }>();

    if (!scheduler) {
      return c.json({ error: 'Scheduler not available' }, 503);
    }

    const success = scheduler.toggleSchedule(id, body.enabled);
    if (!success) {
      return c.json({ error: 'Schedule not found' }, 404);
    }

    return c.json({ id, enabled: body.enabled });
  });

  // ── GET /programs/alerts — List all alerts ──
  app.get('/alerts', (c) => {
    const limit = parseInt(c.req.query('limit') ?? '50');

    if (!alertDispatcher) {
      return c.json([]);
    }

    return c.json(alertDispatcher.getAlerts(undefined, limit));
  });

  return app;
}
