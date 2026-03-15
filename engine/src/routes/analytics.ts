import { Hono } from 'hono';
import { getDb } from '../lib/db';

// ============================================================
// Analytics Routes — Story DASHBOARD-1.1 (Phase 2)
// Read-only aggregation endpoints for Dashboard consumption
// ============================================================

type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

// Blended cost estimate: ~$6/MTok (Claude Sonnet 3.5 average)
const BLENDED_COST_PER_TOKEN = 6.0 / 1_000_000;

const startedAt = Date.now();

function getPeriodStart(period: TimePeriod): string {
  const now = new Date();
  switch (period) {
    case 'hour':    return new Date(now.getTime() - 3_600_000).toISOString();
    case 'day':     return new Date(now.getTime() - 86_400_000).toISOString();
    case 'week':    return new Date(now.getTime() - 604_800_000).toISOString();
    case 'month':   return new Date(now.getTime() - 2_592_000_000).toISOString();
    case 'quarter': return new Date(now.getTime() - 7_776_000_000).toISOString();
    case 'year':    return new Date(now.getTime() - 31_536_000_000).toISOString();
    default:        return new Date(now.getTime() - 86_400_000).toISOString();
  }
}

function estimateCost(totalTokens: number): number {
  return Math.round(totalTokens * BLENDED_COST_PER_TOKEN * 1_000_000) / 1_000_000;
}

function computeTrend(current: number, previous: number): { direction: 'up' | 'down' | 'stable'; change: number } {
  if (previous === 0 && current === 0) return { direction: 'stable', change: 0 };
  if (previous === 0) return { direction: 'up', change: 100 };
  const change = Math.round(((current - previous) / previous) * 1000) / 10;
  if (change > 1) return { direction: 'up', change };
  if (change < -1) return { direction: 'down', change };
  return { direction: 'stable', change: 0 };
}

const analytics = new Hono();

// GET /analytics/overview
analytics.get('/overview', (c) => {
  const period = (c.req.query('period') || 'day') as TimePeriod;
  const validPeriods: TimePeriod[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];
  if (!validPeriods.includes(period)) {
    return c.json({ error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` }, 400);
  }

  const db = getDb();
  const periodStart = getPeriodStart(period);
  const now = new Date().toISOString();

  // Core aggregation for current period
  const coreStats = db.query<{
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
    average_duration: number;
    total_tokens: number;
  }, [string]>(`
    SELECT
      COUNT(*) as total_executions,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions,
      ROUND(AVG(success) * 100, 1) as success_rate,
      ROUND(AVG(duration_ms), 0) as average_duration,
      COALESCE(SUM(tokens_used), 0) as total_tokens
    FROM executions
    WHERE created_at >= ?
  `).get(periodStart);

  // Previous period for trend comparison
  const periodMs = new Date().getTime() - new Date(periodStart).getTime();
  const prevPeriodStart = new Date(new Date(periodStart).getTime() - periodMs).toISOString();
  const prevStats = db.query<{
    total_executions: number;
    total_tokens: number;
    failed_executions: number;
  }, [string, string]>(`
    SELECT
      COUNT(*) as total_executions,
      COALESCE(SUM(tokens_used), 0) as total_tokens,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions
    FROM executions
    WHERE created_at >= ? AND created_at < ?
  `).get(prevPeriodStart, periodStart);

  // P95 latency approximation (ordered subquery)
  const p95Row = db.query<{ p95: number }, [string, string]>(`
    SELECT duration_ms as p95
    FROM executions
    WHERE created_at >= ? AND duration_ms IS NOT NULL
    ORDER BY duration_ms ASC
    LIMIT 1 OFFSET (
      SELECT CAST(COUNT(*) * 0.95 AS INTEGER)
      FROM executions
      WHERE created_at >= ? AND duration_ms IS NOT NULL
    )
  `).get(periodStart, periodStart);

  // Top agents (limit 5)
  const topAgents = db.query<{
    agent_id: string;
    executions: number;
    success_rate: number;
  }, [string]>(`
    SELECT
      agent_id,
      COUNT(*) as executions,
      ROUND(AVG(success) * 100, 1) as success_rate
    FROM executions
    WHERE created_at >= ?
    GROUP BY agent_id
    ORDER BY executions DESC
    LIMIT 5
  `).all(periodStart);

  // Top squads (limit 5)
  const topSquads = db.query<{
    squad_id: string;
    executions: number;
    total_tokens: number;
  }, [string]>(`
    SELECT
      squad_id,
      COUNT(*) as executions,
      COALESCE(SUM(tokens_used), 0) as total_tokens
    FROM executions
    WHERE created_at >= ?
    GROUP BY squad_id
    ORDER BY executions DESC
    LIMIT 5
  `).all(periodStart);

  // Active/pending jobs
  const jobStats = db.query<{
    active_jobs: number;
    scheduled_tasks: number;
  }, []>(`
    SELECT
      SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as active_jobs,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as scheduled_tasks
    FROM jobs
  `).get();

  // Scheduled cron tasks
  const cronStats = db.query<{ active_crons: number }, []>(`
    SELECT COUNT(*) as active_crons FROM cron_jobs WHERE enabled = 1
  `).get();

  const totalExec = coreStats?.total_executions ?? 0;
  const successfulExec = coreStats?.successful_executions ?? 0;
  const failedExec = coreStats?.failed_executions ?? 0;
  const successRate = coreStats?.success_rate ?? 0;
  const avgDuration = coreStats?.average_duration ?? 0;
  const totalTokens = coreStats?.total_tokens ?? 0;
  const totalCost = estimateCost(totalTokens);
  const activeJobs = jobStats?.active_jobs ?? 0;
  const scheduledTasks = (jobStats?.scheduled_tasks ?? 0) + (cronStats?.active_crons ?? 0);

  // Memory usage from Bun runtime
  const mem = process.memoryUsage();

  // Health status determination
  const errorRate = totalExec > 0 ? Math.round((failedExec / totalExec) * 1000) / 10 : 0;
  let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (errorRate > 50) healthStatus = 'unhealthy';
  else if (errorRate > 20) healthStatus = 'degraded';

  const response = {
    period,
    periodStart,
    periodEnd: now,
    generatedAt: now,
    summary: {
      totalExecutions: totalExec,
      successfulExecutions: successfulExec,
      failedExecutions: failedExec,
      successRate,
      averageDuration: avgDuration,
      totalRequests: totalExec,
      errorRate,
      avgLatency: avgDuration,
      p95Latency: p95Row?.p95 ?? 0,
      totalCost,
      totalTokens,
      avgCostPerExecution: totalExec > 0 ? Math.round((totalCost / totalExec) * 1_000_000) / 1_000_000 : 0,
      activeJobs,
      scheduledTasks,
      activeTasks: activeJobs,
    },
    trends: {
      executions: computeTrend(totalExec, prevStats?.total_executions ?? 0),
      costs: computeTrend(estimateCost(totalTokens), estimateCost(prevStats?.total_tokens ?? 0)),
      errors: computeTrend(failedExec, prevStats?.failed_executions ?? 0),
    },
    topAgents: topAgents.map(a => ({
      agentId: a.agent_id,
      name: a.agent_id,
      executions: a.executions,
      successRate: a.success_rate,
    })),
    topSquads: topSquads.map(s => ({
      squadId: s.squad_id,
      name: s.squad_id,
      executions: s.executions,
      cost: estimateCost(s.total_tokens),
    })),
    health: {
      status: healthStatus,
      uptime: Math.round((Date.now() - startedAt) / 1000),
      memoryUsage: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
        arrayBuffers: mem.arrayBuffers,
      },
    },
  };

  return c.json(response);
});

// GET /analytics/performance/agents
analytics.get('/performance/agents', (c) => {
  const period = (c.req.query('period') || 'week') as TimePeriod;
  const squadId = c.req.query('squadId') || null;
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '20', 10), 1), 100);

  const validPeriods: TimePeriod[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];
  if (!validPeriods.includes(period)) {
    return c.json({ error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` }, 400);
  }

  const db = getDb();
  const periodStart = getPeriodStart(period);

  // Build query with optional squad filter
  const conditions = ['e.created_at >= ?'];
  const params: (string | number)[] = [periodStart];

  if (squadId) {
    conditions.push('e.squad_id = ?');
    params.push(squadId);
  }

  params.push(limit);

  const agents = db.query<{
    agent_id: string;
    squad_id: string;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
    avg_duration: number;
    avg_tokens: number;
    total_tokens: number;
    last_active: string;
  }, (string | number)[]>(`
    SELECT
      e.agent_id,
      e.squad_id,
      COUNT(*) as total_executions,
      SUM(CASE WHEN e.success = 1 THEN 1 ELSE 0 END) as successful_executions,
      SUM(CASE WHEN e.success = 0 THEN 1 ELSE 0 END) as failed_executions,
      ROUND(AVG(e.success) * 100, 1) as success_rate,
      ROUND(AVG(e.duration_ms), 0) as avg_duration,
      ROUND(AVG(COALESCE(e.tokens_used, 0)), 0) as avg_tokens,
      COALESCE(SUM(e.tokens_used), 0) as total_tokens,
      MAX(e.created_at) as last_active
    FROM executions e
    WHERE ${conditions.join(' AND ')}
    GROUP BY e.agent_id, e.squad_id
    ORDER BY total_executions DESC
    LIMIT ?
  `).all(...params);

  return c.json({
    agents: agents.map(a => ({
      agentId: a.agent_id,
      agentName: a.agent_id,
      squad: a.squad_id,
      totalExecutions: a.total_executions,
      successfulExecutions: a.successful_executions,
      failedExecutions: a.failed_executions,
      successRate: a.success_rate,
      avgDuration: a.avg_duration ?? 0,
      avgTokens: a.avg_tokens ?? 0,
      totalCost: estimateCost(a.total_tokens),
      lastActive: a.last_active,
    })),
  });
});

export { analytics };
