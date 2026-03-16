import { Hono } from 'hono';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

// ============================================================
// Tools Routes — Story DASHBOARD-1.1 (Phase 2)
// Read-only MCP server listing from Claude CLI config files
// Enriched with tool counts from settings allowedTools/permissions
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

/**
 * Collect MCP tool names from permissions.allow and allowedTools entries
 * across global and project-level settings files.
 * Entries follow the format: mcp__{serverName}__{toolName}
 */
function collectMCPToolsFromSettings(): Map<string, string[]> {
  const toolsByServer = new Map<string, string[]>();

  const settingsFiles = [
    resolve(homedir(), '.claude', 'settings.json'),
    resolve(homedir(), 'Documents', 'mmos', '.claude', 'settings.local.json'),
  ];

  for (const filePath of settingsFiles) {
    try {
      if (!existsSync(filePath)) continue;
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));

      const entries: string[] = [
        ...(Array.isArray(data.allowedTools) ? data.allowedTools : []),
        ...(Array.isArray(data.permissions?.allow) ? data.permissions.allow : []),
      ];

      for (const entry of entries) {
        if (typeof entry !== 'string' || !entry.startsWith('mcp__')) continue;
        const parts = entry.split('__');
        if (parts.length < 3) continue;
        const serverName = parts[1];
        const toolName = parts.slice(2).join('__');
        if (!toolsByServer.has(serverName)) {
          toolsByServer.set(serverName, []);
        }
        const existing = toolsByServer.get(serverName)!;
        if (!existing.includes(toolName)) {
          existing.push(toolName);
        }
      }
    } catch {
      // Silently continue if file is unreadable or malformed
    }
  }

  return toolsByServer;
}

function getMCPServers() {
  const servers: ReturnType<typeof buildServerEntry>[] = [];
  const seen = new Set<string>();

  const toolsByServer = collectMCPToolsFromSettings();

  // 1. Read ~/.claude.json (primary source for server configs)
  try {
    const claudeJsonPath = resolve(homedir(), '.claude.json');
    if (existsSync(claudeJsonPath)) {
      const data = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));
      const mcpServers = data.mcpServers || {};
      for (const [name, config] of Object.entries(mcpServers)) {
        if (seen.has(name)) continue;
        seen.add(name);
        const entry = buildServerEntry(name, config as MCPServerConfig);
        const knownTools = toolsByServer.get(name) || [];
        entry.toolCount = knownTools.length;
        entry.tools = knownTools.map((t) => ({ name: t, calls: 0 }));
        servers.push(entry);
      }
    }
  } catch {
    // Silently continue if file is unreadable or malformed
  }

  // 2. Read project-level .claude/mcp.json (if exists)
  try {
    const projectMcpPath = resolve(homedir(), 'Documents', 'mmos', '.claude', 'mcp.json');
    if (existsSync(projectMcpPath)) {
      const data = JSON.parse(readFileSync(projectMcpPath, 'utf-8'));
      const mcpServers = data.mcpServers || {};
      for (const [name, config] of Object.entries(mcpServers)) {
        if (seen.has(name)) continue;
        seen.add(name);
        const entry = buildServerEntry(name, config as MCPServerConfig);
        const knownTools = toolsByServer.get(name) || [];
        entry.toolCount = knownTools.length;
        entry.tools = knownTools.map((t) => ({ name: t, calls: 0 }));
        servers.push(entry);
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
