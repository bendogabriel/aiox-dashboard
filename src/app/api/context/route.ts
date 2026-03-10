import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getProjectRoot } from '@/lib/squad-api-utils';

const execAsync = promisify(exec);

interface RuleEntry {
  name: string;
  type: 'mandatory' | 'optional';
  path: string;
}

interface AgentEntry {
  name: string;
  role: string;
  model: string;
  icon: string;
}

interface ConfigEntry {
  path: string;
  modified: string;
}

interface MCPServerEntry {
  name: string;
  status: 'success' | 'error' | 'offline';
  tools: number;
}

interface RecentFileEntry {
  path: string;
  time: string;
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Extract agent name and role from a markdown agent definition file.
 * Files typically start with `# agent-id` and contain a YAML block with persona info.
 */
async function parseAgentFile(filePath: string, fileName: string): Promise<AgentEntry | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const baseName = fileName.replace(/\.md$/i, '');

    // Try to extract the agent name from the YAML block
    let displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    let role = 'Agent';
    let model = 'sonnet';

    // Look for name: in YAML block
    const nameMatch = content.match(/\bname:\s*["']?([^"'\n]+)/i);
    if (nameMatch) {
      displayName = nameMatch[1].trim();
    }

    // Look for title/role
    const roleMatch = content.match(/\b(?:title|role|description):\s*["']?([^"'\n]+)/i);
    if (roleMatch) {
      role = roleMatch[1].trim();
    }

    // Look for model
    const modelMatch = content.match(/\bmodel:\s*["']?([^"'\n]+)/i);
    if (modelMatch) {
      model = modelMatch[1].trim().toLowerCase();
      if (model.includes('opus')) model = 'opus';
      else if (model.includes('haiku')) model = 'haiku';
      else model = 'sonnet';
    }

    return {
      name: displayName,
      role,
      model,
      icon: baseName,
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/context
 * Returns real system context: rules, agents, configs, MCP servers, recent files.
 */
export async function GET() {
  const projectRoot = getProjectRoot();
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/root';

  // --- 1. Active Rules ---
  const rules: RuleEntry[] = [];
  const rulesDir = path.join(projectRoot, '.claude', 'rules');
  try {
    const ruleFiles = await fs.readdir(rulesDir);
    for (const file of ruleFiles) {
      if (!file.endsWith('.md') || file.startsWith('.')) continue;
      const name = file.replace(/\.md$/i, '');
      // All files in .claude/rules/ are mandatory by default
      rules.push({
        name,
        type: 'mandatory',
        path: `.claude/rules/${file}`,
      });
    }
  } catch {
    // rules dir doesn't exist
  }

  // --- 2. Agent Definitions ---
  const agents: AgentEntry[] = [];
  const agentsDir = path.join(projectRoot, '.aios-core', 'development', 'agents');
  try {
    const agentEntries = await fs.readdir(agentsDir, { withFileTypes: true });
    for (const entry of agentEntries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

      if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'MEMORY.md') {
        const parsed = await parseAgentFile(
          path.join(agentsDir, entry.name),
          entry.name,
        );
        if (parsed) agents.push(parsed);
      }
    }
  } catch {
    // agents dir doesn't exist
  }

  // --- 3. Config Files ---
  const configs: ConfigEntry[] = [];
  const configPaths = [
    '.aios-core/core-config.yaml',
    '.aios-core/framework-config.yaml',
    '.aios-core/constitution.md',
    '.claude/CLAUDE.md',
    'package.json',
    'tsconfig.json',
  ];
  // Also check dashboard-level configs
  const dashboardConfigPaths = [
    'dashboard/aios-platform/vite.config.ts',
    'dashboard/aios-platform/tsconfig.json',
    'dashboard/aios-platform/package.json',
  ];

  for (const relPath of [...configPaths, ...dashboardConfigPaths]) {
    const fullPath = path.join(projectRoot, relPath);
    try {
      const stat = await fs.stat(fullPath);
      configs.push({
        path: relPath,
        modified: formatTimeAgo(stat.mtime),
      });
    } catch {
      // file doesn't exist
    }
  }

  // --- 4. MCP Servers ---
  const mcpServers: MCPServerEntry[] = [];

  // Read from ~/.claude.json
  try {
    const claudeConfigPath = path.join(homeDir, '.claude.json');
    const claudeRaw = await fs.readFile(claudeConfigPath, 'utf-8');
    const claudeConfig = JSON.parse(claudeRaw);
    const mcpSection = (claudeConfig.mcpServers || {}) as Record<string, Record<string, unknown>>;

    for (const [name, config] of Object.entries(mcpSection)) {
      // Count tools from the config if available, otherwise estimate
      let toolCount = 0;

      // Try to parse tool count from args or known configurations
      const args = config.args as string[] | undefined;
      if (Array.isArray(args)) {
        // Some MCP servers list their tools in args
        toolCount = args.length;
      }

      // Known tool counts for common MCP servers
      const knownToolCounts: Record<string, number> = {
        MCP_DOCKER: 150,
        'fal-ai': 12,
        'fal-nano-banana': 3,
        'google-drive': 80,
        qdrant: 2,
        'mcp-supermemory-ai': 5,
      };

      if (knownToolCounts[name]) {
        toolCount = knownToolCounts[name];
      }

      mcpServers.push({
        name,
        status: 'success',
        tools: toolCount || 0,
      });
    }
  } catch {
    // No Claude config
  }

  // Also check project-level .mcp.json
  try {
    const projectMcpPath = path.join(projectRoot, '.mcp.json');
    const raw = await fs.readFile(projectMcpPath, 'utf-8');
    const mcpConfig = JSON.parse(raw);
    const mcpSection = (mcpConfig.mcpServers || {}) as Record<string, unknown>;

    for (const name of Object.keys(mcpSection)) {
      if (!mcpServers.find((s) => s.name === name)) {
        mcpServers.push({
          name,
          status: 'success',
          tools: 0,
        });
      }
    }
  } catch {
    // No project MCP config
  }

  // --- 5. Recent Files ---
  const recentFiles: RecentFileEntry[] = [];
  try {
    const { stdout } = await execAsync(
      'git log --diff-filter=M --name-only --pretty=format:"__COMMIT__%ai" -20',
      { cwd: projectRoot, timeout: 5000 },
    );

    const lines = stdout.split('\n');
    let currentTime = '';
    const seen = new Set<string>();

    for (const line of lines) {
      if (line.startsWith('__COMMIT__')) {
        currentTime = line.replace('__COMMIT__', '').trim();
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);

      const time = currentTime
        ? formatTimeAgo(new Date(currentTime))
        : 'recently';

      recentFiles.push({ path: trimmed, time });

      if (recentFiles.length >= 15) break;
    }
  } catch {
    // git not available or not a repo - try stat-based approach
    try {
      const { stdout } = await execAsync(
        'find . -name "*.ts" -o -name "*.tsx" -o -name "*.yaml" -o -name "*.json" | head -20 | xargs ls -lt 2>/dev/null | head -15',
        { cwd: projectRoot, timeout: 5000 },
      );
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 9) {
          const filePath = parts.slice(8).join(' ');
          recentFiles.push({ path: filePath, time: 'recently' });
        }
      }
    } catch {
      // fallback failed
    }
  }

  return NextResponse.json({
    rules,
    agents,
    configs,
    mcpServers,
    recentFiles,
  });
}
