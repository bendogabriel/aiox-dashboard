/**
 * AIOS Engine — Bun/Hono server for orchestration.
 * Receives requests from the dashboard frontend (proxied via Vite :5173 → :4002).
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { tasksApp } from './routes/tasks';
import { vaultApp } from './routes/vault';
import { marketingApp } from './routes/marketing';
import { discoverAgents } from './core/agent-discovery';
import { isClaudeAvailable } from './lib/claude-cli';

const app = new Hono();

// CORS for direct access (not through Vite proxy)
app.use('*', cors());

// Health endpoint
app.get('/health', (c) => {
  const agents = discoverAgents();
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    claudeCliAvailable: isClaudeAvailable(),
    agentsDiscovered: agents.length,
  });
});

// Task routes
app.route('/tasks', tasksApp);

// Vault routes
app.route('/vault', vaultApp);

// Marketing Hub routes
app.route('/marketing', marketingApp);

// 404 catch-all
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('[Engine] Unhandled error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

const port = Number(process.env.PORT) || 4002;

console.log(`Engine running on :${port}`);
console.log(`  Claude CLI: ${isClaudeAvailable() ? 'available' : 'demo mode'}`);
console.log(`  Agents discovered: ${discoverAgents().length}`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 255, // Max idle timeout for SSE connections (seconds)
};
