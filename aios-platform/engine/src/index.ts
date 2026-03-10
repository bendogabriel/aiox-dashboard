import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './lib/config';
import { log, setLogLevel } from './lib/logger';
import { initDb, closeDb } from './lib/db';
import { initPool, stopPool } from './core/process-pool';
import { initWorkflowEngine } from './core/workflow-engine';
import { initTeamBundles } from './core/team-bundle';
import { initCronScheduler, stopAllCrons } from './core/cron-scheduler';
import { checkTimeouts } from './core/job-queue';
import { handleWSOpen, handleWSClose, handleWSMessage, createWSData, initWSHeartbeat, stopWSHeartbeat } from './lib/ws';
import { system } from './routes/system';
import { jobs } from './routes/jobs';
import { execute } from './routes/execute';
import { createWebhookRoutes } from './routes/webhooks';
import { memory } from './routes/memory';
import { cron } from './routes/cron';
import { stream } from './routes/stream';
import { whatsapp } from './routes/whatsapp';

// ============================================================
// AIOS Agent Execution Engine — v0.4.0
// ============================================================

const config = loadConfig();
setLogLevel(config.logging.level);

log.info('Starting AIOS Agent Execution Engine', {
  version: '0.4.0',
  port: config.server.port,
  pool_max: config.pool.max_concurrent,
});

// Initialize database (runs migrations)
initDb();

// Initialize process pool (includes context-builder, workspace-manager, completion-handler, authority-enforcer)
initPool(config);

// Initialize workflow engine (loads workflow definitions from .aios-core)
initWorkflowEngine(config);

// Initialize team bundles
initTeamBundles(config);

// Initialize cron scheduler (restores persisted crons)
initCronScheduler(config);

// Start WebSocket heartbeat (30s ping/pong)
initWSHeartbeat();

// Periodic timeout checker
const timeoutChecker = setInterval(() => {
  const timedOut = checkTimeouts();
  if (timedOut > 0) {
    log.warn('Timed out jobs', { count: timedOut });
  }
}, config.queue.check_interval_ms);

// Build Hono app
const app = new Hono();

// CORS
app.use('/*', cors({
  origin: config.server.cors_origins,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount routes
app.route('/', system);
app.route('/jobs', jobs);
app.route('/execute', execute);
app.route('/stream', stream);
app.route('/webhook', createWebhookRoutes(config));
app.route('/memory', memory);
app.route('/cron', cron);
app.route('/whatsapp', whatsapp);

// Catch-all 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  log.error('Unhandled error', { path: c.req.path, error: err.message });
  return c.json({ error: 'Internal server error' }, 500);
});

// Start server with WebSocket support
const server = Bun.serve({
  port: config.server.port,
  hostname: config.server.host,
  idleTimeout: 255, // ~4 min — SSE streams need long-lived connections (Bun max is 255)
  fetch(req, server) {
    // WebSocket upgrade for /live
    const url = new URL(req.url);
    if (url.pathname === '/live') {
      const upgraded = server.upgrade(req, { data: createWSData() });
      if (upgraded) return; // Bun handles the response
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    // Delegate to Hono
    return app.fetch(req);
  },
  websocket: {
    open: handleWSOpen,
    close: handleWSClose,
    message: handleWSMessage,
  },
});

log.info(`Engine listening on http://${config.server.host}:${config.server.port}`);
log.info('Endpoints:', {
  system: '/health, /pool, /authority/*, /bundles',
  jobs: '/jobs',
  execute: '/execute/agent, /execute/orchestrate, /execute/workflows',
  stream: '/stream/agent (SSE)',
  webhook: '/webhook/:squadId, /webhook/orchestrator',
  whatsapp: '/whatsapp/webhook, /whatsapp/events (SSE), /whatsapp/send, /whatsapp/status',
  memory: '/memory/:scope, /memory/recall, /memory/store',
  cron: '/cron (CRUD)',
  ws: 'ws://*/live',
});

// Graceful shutdown
function shutdown(): void {
  log.info('Shutting down...');
  clearInterval(timeoutChecker);
  stopWSHeartbeat();
  stopAllCrons();
  stopPool();
  closeDb();
  server.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
