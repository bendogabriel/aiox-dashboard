import { Hono } from 'hono';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

// ============================================================
// Tools Routes — Story DASHBOARD-1.1 (Phase 2)
// Read-only MCP server listing from Claude CLI config files
// ============================================================

interface MCPServerConfig {
  command?: string;
  args?: string[];
  type?: string;
  url?: string;
  env?: Record<string, string>;
  [key: string]: unknown;
}

function inferTransportType(config: MCPServerConfig): string {
  if (config.url) return 'http';
  if (config.type) return config.type;
  if (config.command?.includes('docker')) return 'docker';
  if (config.command?.includes('npx') || config.command?.includes('node')) return 'stdio';
  if (config.command) return 'stdio';
  return 'unknown';
}

function buildServerEntry(name: string, config: MCPServerConfig) {
  return {
    name,
    status: 'connected' as const,
    type: inferTransportType(config),
    tools: [] as Array<{ name: string; description?: string; calls: number }>,
    toolCount: 0,
    resources: [] as Array<{ uri: string; name: string; accessCount?: number }>,
    lastPing: new Date().toISOString(),
  };
}

function getMCPServers() {
  const servers: ReturnType<typeof buildServerEntry>[] = [];
  const seen = new Set<string>();

  // 1. Read ~/.claude.json (primary source)
  try {
    const claudeJsonPath = resolve(homedir(), '.claude.json');
    if (existsSync(claudeJsonPath)) {
      const data = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));
      const mcpServers = data.mcpServers || {};
      for (const [name, config] of Object.entries(mcpServers)) {
        if (seen.has(name)) continue;
        seen.add(name);
        servers.push(buildServerEntry(name, config as MCPServerConfig));
      }
    }
  } catch {
    // Silently continue if file is unreadable or malformed
  }

  // 2. Read project-level .claude/mcp.json (if exists relative to engine)
  try {
    const projectMcpPath = resolve(homedir(), 'Documents', 'mmos', '.claude', 'mcp.json');
    if (existsSync(projectMcpPath)) {
      const data = JSON.parse(readFileSync(projectMcpPath, 'utf-8'));
      const mcpServers = data.mcpServers || {};
      for (const [name, config] of Object.entries(mcpServers)) {
        if (seen.has(name)) continue;
        seen.add(name);
        servers.push(buildServerEntry(name, config as MCPServerConfig));
      }
    }
  } catch {
    // Silently continue
  }

  return servers;
}

const tools = new Hono();

// GET /tools/mcp
tools.get('/mcp', (c) => {
  const servers = getMCPServers();
  return c.json({ servers });
});

export { tools };
