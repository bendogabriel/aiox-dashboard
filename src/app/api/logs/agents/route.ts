import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Agent is considered "active" if its log was modified within this window
const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Get the project root path
function getProjectRoot(): string {
  if (process.env.AIOS_PROJECT_ROOT) {
    return process.env.AIOS_PROJECT_ROOT;
  }
  return path.resolve(process.cwd(), '..');
}

function getLogsDir(): string {
  return path.join(getProjectRoot(), '.aios', 'logs');
}

interface AgentLogInfo {
  agentId: string;
  fileName: string;
  size: number;
  lastModified: string;
  active: boolean;
}

export async function GET() {
  const logsDir = getLogsDir();
  const now = Date.now();

  try {
    await fs.mkdir(logsDir, { recursive: true });

    const files = await fs.readdir(logsDir);
    const logFiles = files.filter(f => f.endsWith('.log'));

    const agents: AgentLogInfo[] = [];

    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      try {
        const stats = await fs.stat(filePath);
        const mtime = stats.mtime.getTime();
        agents.push({
          agentId: file.replace('.log', ''),
          fileName: file,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          active: (now - mtime) < ACTIVE_THRESHOLD_MS && stats.size > 0,
        });
      } catch {
        // Skip files we can't stat
      }
    }

    // Sort: active first, then by last modified (most recent first)
    agents.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    return NextResponse.json({
      logsDir,
      agents,
      activeCount: agents.filter(a => a.active).length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to list agent logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
