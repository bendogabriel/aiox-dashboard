import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/squad-api-utils';

interface AgentInfo {
  agentId: string;
  agentName: string;
  squadId: string;
  knowledgePath: string;
  files: number;
  lastUpdated: string;
}

// ── In-memory cache ──
let cachedResult: {
  data: { agents: AgentInfo[]; total: number };
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Count files recursively in a directory (non-hidden, max depth 3).
 */
async function countFiles(dir: string, depth = 0): Promise<{ count: number; lastModified: string }> {
  let count = 0;
  let lastModified = new Date(0).toISOString();

  if (depth > 3) return { count, lastModified };

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return { count, lastModified };
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile()) {
      count++;
      try {
        const stat = await fs.stat(fullPath);
        const mtime = stat.mtime.toISOString();
        if (mtime > lastModified) lastModified = mtime;
      } catch { /* skip */ }
    } else if (entry.isDirectory()) {
      const sub = await countFiles(fullPath, depth + 1);
      count += sub.count;
      if (sub.lastModified > lastModified) lastModified = sub.lastModified;
    }
  }

  return { count, lastModified };
}

/**
 * Format agent name from filename/dirname (e.g., "data-engineer" → "Data Engineer")
 */
function formatAgentName(raw: string): string {
  return raw
    .replace(/\.(md|yaml|yml)$/i, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Parse agent name from a markdown file if it has a frontmatter or heading.
 */
async function parseAgentNameFromFile(filePath: string, fallback: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 20);

    // Try YAML frontmatter: name: "..."
    for (const line of lines) {
      const nameMatch = line.match(/^name:\s*["']?(.+?)["']?\s*$/);
      if (nameMatch) return nameMatch[1];
    }

    // Try first markdown heading
    for (const line of lines) {
      const headingMatch = line.match(/^#\s+(.+)/);
      if (headingMatch) {
        // Clean up: "Agent: Dex (Developer)" → "Dex"
        const heading = headingMatch[1].trim();
        const agentMatch = heading.match(/Agent:\s*(\w+)/i);
        if (agentMatch) return agentMatch[1];
        return heading;
      }
    }
  } catch {
    // Fall through
  }
  return fallback;
}

/**
 * GET /api/knowledge/agents
 * Returns knowledge information per agent from:
 *   1. .aios-core/development/agents/ (core agent definitions)
 *   2. squads/*/agents/ (squad-specific agents)
 */
export async function GET() {
  // Return cached result if fresh
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult.data);
  }

  const projectRoot = getProjectRoot();
  const agents: AgentInfo[] = [];
  const seenAgentIds = new Set<string>();

  // ── Source 1: .aios-core/development/agents/ ──
  const aiosCoreAgentsDir = path.join(projectRoot, '.aios-core', 'development', 'agents');
  try {
    const entries = await fs.readdir(aiosCoreAgentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

      const agentId = entry.name.replace(/\.(md|yaml|yml)$/i, '');
      if (seenAgentIds.has(agentId)) continue;
      seenAgentIds.add(agentId);

      const fullPath = path.join(aiosCoreAgentsDir, entry.name);
      const knowledgePath = `.aios-core/development/agents/${entry.name}`;

      if (entry.isFile() && /\.(md|yaml|yml)$/i.test(entry.name)) {
        const agentName = await parseAgentNameFromFile(fullPath, formatAgentName(agentId));
        let lastUpdated: string;
        try {
          const stat = await fs.stat(fullPath);
          lastUpdated = stat.mtime.toISOString();
        } catch {
          lastUpdated = new Date(0).toISOString();
        }

        // Check if there's also a directory with extra files
        const dirPath = path.join(aiosCoreAgentsDir, agentId);
        let files = 1;
        try {
          const dirStat = await fs.stat(dirPath);
          if (dirStat.isDirectory()) {
            const sub = await countFiles(dirPath);
            files += sub.count;
            if (sub.lastModified > lastUpdated) lastUpdated = sub.lastModified;
          }
        } catch {
          // No companion directory
        }

        agents.push({
          agentId,
          agentName,
          squadId: 'core',
          knowledgePath,
          files,
          lastUpdated,
        });
      } else if (entry.isDirectory()) {
        const dirPath = path.join(aiosCoreAgentsDir, entry.name);
        const { count, lastModified } = await countFiles(dirPath);

        // Try to find a .md file in the directory for name parsing
        const mdFile = path.join(dirPath, `${entry.name}.md`);
        let agentName: string;
        try {
          await fs.access(mdFile);
          agentName = await parseAgentNameFromFile(mdFile, formatAgentName(agentId));
        } catch {
          // Try index.md or README.md
          for (const candidate of ['index.md', 'README.md']) {
            const candidatePath = path.join(dirPath, candidate);
            try {
              await fs.access(candidatePath);
              agentName = await parseAgentNameFromFile(candidatePath, formatAgentName(agentId));
              break;
            } catch {
              // continue
            }
          }
          agentName ??= formatAgentName(agentId);
        }

        agents.push({
          agentId,
          agentName,
          squadId: 'core',
          knowledgePath,
          files: count,
          lastUpdated: lastModified,
        });
      }
    }
  } catch {
    // .aios-core/development/agents/ doesn't exist
  }

  // ── Source 2: squads/*/agents/ ──
  const squadsDir = path.join(projectRoot, 'squads');
  try {
    const squadDirs = await fs.readdir(squadsDir, { withFileTypes: true });

    for (const squadEntry of squadDirs) {
      if (!squadEntry.isDirectory() || squadEntry.name.startsWith('.')) continue;
      const squadId = squadEntry.name;
      const agentsDir = path.join(squadsDir, squadId, 'agents');

      let agentFiles;
      try {
        agentFiles = await fs.readdir(agentsDir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const agentEntry of agentFiles) {
        if (agentEntry.name.startsWith('.') || agentEntry.name.startsWith('_')) continue;

        const agentId = agentEntry.name.replace(/\.(md|yaml|yml)$/i, '');
        if (seenAgentIds.has(`${squadId}/${agentId}`)) continue;
        seenAgentIds.add(`${squadId}/${agentId}`);

        const agentFullPath = path.join(agentsDir, agentEntry.name);
        const knowledgePath = `squads/${squadId}/agents/${agentEntry.name}`;

        if (agentEntry.isFile() && /\.(md|yaml|yml)$/i.test(agentEntry.name)) {
          const agentName = await parseAgentNameFromFile(agentFullPath, formatAgentName(agentId));
          let lastUpdated: string;
          try {
            const stat = await fs.stat(agentFullPath);
            lastUpdated = stat.mtime.toISOString();
          } catch {
            lastUpdated = new Date(0).toISOString();
          }

          agents.push({
            agentId,
            agentName,
            squadId,
            knowledgePath,
            files: 1,
            lastUpdated,
          });
        } else if (agentEntry.isDirectory()) {
          const { count, lastModified } = await countFiles(agentFullPath);
          const mdFile = path.join(agentFullPath, `${agentEntry.name}.md`);
          let agentName: string;
          try {
            await fs.access(mdFile);
            agentName = await parseAgentNameFromFile(mdFile, formatAgentName(agentId));
          } catch {
            agentName = formatAgentName(agentId);
          }

          agents.push({
            agentId,
            agentName,
            squadId,
            knowledgePath,
            files: count,
            lastUpdated: lastModified,
          });
        }
      }
    }
  } catch {
    // squads dir doesn't exist
  }

  // Sort agents by lastUpdated (most recent first)
  agents.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const result = { agents, total: agents.length };

  // Cache the result
  cachedResult = { data: result, timestamp: Date.now() };

  return NextResponse.json(result);
}
