// Agent discovery from filesystem.
//
// Sources:
// 1. .claude/agents/{name}.md — parse YAML frontmatter
// 2. .aios-core/squads/{squad}/config.yaml — parse squad configs
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

export interface DiscoveredAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  squad: string;
}

interface CacheEntry {
  agents: DiscoveredAgent[];
  timestamp: number;
}

const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

function getAiosRoot(): string {
  if (process.env.AIOS_ROOT) {
    return resolve(process.env.AIOS_ROOT);
  }
  // engine lives at dashboard/aios-platform/engine/
  // from src/core/ → 5 levels up to project root
  return resolve(import.meta.dir, '..', '..', '..', '..', '..');
}

/**
 * Parse YAML frontmatter from a markdown file.
 * Handles simple key: value pairs (not nested YAML).
 */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  let currentKey = '';
  let multiline = false;

  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === '|' || val === '>') {
        multiline = true;
        result[currentKey] = '';
      } else {
        multiline = false;
        result[currentKey] = val.replace(/^["']|["']$/g, '');
      }
    } else if (multiline && currentKey && line.startsWith('  ')) {
      result[currentKey] += (result[currentKey] ? ' ' : '') + line.trim();
    }
  }
  return result;
}

/**
 * Parse simple YAML values from a config file.
 */
function parseSimpleYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^(\w[\w_-]*)\s*:\s*"?([^"#\n]+)"?\s*$/);
    if (match) {
      result[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

function discoverCoreAgents(root: string): DiscoveredAgent[] {
  const agentsDir = resolve(root, '.claude', 'agents');
  if (!existsSync(agentsDir)) return [];

  const agents: DiscoveredAgent[] = [];
  const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    try {
      const content = readFileSync(resolve(agentsDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      const id = basename(file, '.md');

      agents.push({
        id,
        name: fm.name || id,
        description: fm.description || '',
        model: fm.model || 'sonnet',
        squad: 'core',
      });
    } catch {
      // Skip unreadable files
    }
  }

  return agents;
}

function discoverSquadAgents(root: string): DiscoveredAgent[] {
  const squadsDir = resolve(root, '.aios-core', 'squads');
  if (!existsSync(squadsDir)) return [];

  const agents: DiscoveredAgent[] = [];
  const squads = readdirSync(squadsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const squadName of squads) {
    const configPath = resolve(squadsDir, squadName, 'config.yaml');
    if (!existsSync(configPath)) continue;

    try {
      const content = readFileSync(configPath, 'utf-8');
      const config = parseSimpleYaml(content);

      if (config.entry_agent) {
        agents.push({
          id: config.entry_agent,
          name: config.name || squadName,
          description: config.description || '',
          model: 'sonnet',
          squad: squadName,
        });
      }
    } catch {
      // Skip unreadable configs
    }
  }

  return agents;
}

export function discoverAgents(): DiscoveredAgent[] {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.agents;
  }

  const root = getAiosRoot();
  const coreAgents = discoverCoreAgents(root);
  const squadAgents = discoverSquadAgents(root);

  // Deduplicate by id, preferring core agents
  const seen = new Set<string>();
  const all: DiscoveredAgent[] = [];

  for (const agent of coreAgents) {
    if (!seen.has(agent.id)) {
      seen.add(agent.id);
      all.push(agent);
    }
  }
  for (const agent of squadAgents) {
    if (!seen.has(agent.id)) {
      seen.add(agent.id);
      all.push(agent);
    }
  }

  cache = { agents: all, timestamp: now };
  return all;
}

export function getAgent(id: string): DiscoveredAgent | null {
  return discoverAgents().find((a) => a.id === id) || null;
}

export function getAgentsBySquad(squad: string): DiscoveredAgent[] {
  return discoverAgents().filter((a) => a.squad === squad);
}

/**
 * Load the full markdown content of an agent file (for persona injection).
 */
export function loadAgentContent(agentId: string): string | null {
  const root = getAiosRoot();

  // Check core agents first
  const corePath = resolve(root, '.claude', 'agents', `${agentId}.md`);
  if (existsSync(corePath)) {
    return readFileSync(corePath, 'utf-8');
  }

  // Check squad agents
  const squadsDir = resolve(root, '.aios-core', 'squads');
  if (!existsSync(squadsDir)) return null;

  const squads = readdirSync(squadsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const squad of squads) {
    const agentPath = resolve(squadsDir, squad, 'agents', `${agentId}.md`);
    if (existsSync(agentPath)) {
      return readFileSync(agentPath, 'utf-8');
    }
  }

  return null;
}
