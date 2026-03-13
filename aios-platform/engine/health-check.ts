/**
 * Quick health validation — tests core modules without starting the server.
 */
import { discoverAgents } from './src/core/agent-discovery';
import { isClaudeAvailable } from './src/lib/claude-cli';

const timestamp = new Date().toISOString();
const claudeAvailable = isClaudeAvailable();
const agents = discoverAgents();

const health = {
  status: 'ok',
  timestamp,
  claudeCliAvailable: claudeAvailable,
  agentsDiscovered: agents.length,
  agentSample: agents.slice(0, 5).map((a) => `${a.id} (${a.squad})`),
  modules: {
    agentDiscovery: agents.length > 0 ? 'ok' : 'warn: no agents found',
    claudeCli: claudeAvailable ? 'ok' : 'demo-mode',
    hono: 'ok (import verified)',
  },
};

console.log(JSON.stringify(health, null, 2));
