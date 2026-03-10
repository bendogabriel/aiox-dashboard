import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Agent is considered "active" if its log was modified within this window */
const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/** Agent is considered "working" (not just recently active) within this tighter window */
const WORKING_THRESHOLD_MS = 60 * 1000; // 1 minute

/** Well-known AIOS agents (fallback when log files don't carry metadata) */
const KNOWN_AGENTS: Record<string, { name: string; model: string }> = {
  'aios-master': { name: 'Orion', model: 'opus' },
  dev: { name: 'Dex', model: 'sonnet' },
  qa: { name: 'Quinn', model: 'sonnet' },
  architect: { name: 'Aria', model: 'opus' },
  pm: { name: 'Morgan', model: 'sonnet' },
  po: { name: 'Pax', model: 'sonnet' },
  sm: { name: 'River', model: 'haiku' },
  analyst: { name: 'Ada', model: 'haiku' },
  devops: { name: 'Gage', model: 'sonnet' },
  'data-engineer': { name: 'Dara', model: 'sonnet' },
  'ux-design-expert': { name: 'Pixel', model: 'sonnet' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProjectRoot(): string {
  if (process.env.AIOS_PROJECT_ROOT) {
    return process.env.AIOS_PROJECT_ROOT;
  }
  return path.resolve(process.cwd(), '..');
}

function getLogsDir(): string {
  return path.join(getProjectRoot(), '.aios', 'logs');
}

/** Strip ANSI escape codes from a string */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Parse the last N meaningful lines of a log file to extract:
 * - The current phase / action being performed
 * - Whether the agent seems to be working or idle
 * - The story reference if any (e.g. "Story 3.2" or "STORY-3.2")
 */
function parseLogTail(lines: string[]): {
  phase: string;
  story: string;
  lastAction: string;
  lastTimestamp: string | null;
  linesCount: number;
  recentActions: Array<{ action: string; status: 'success' | 'error'; timestamp: string; duration: number }>;
} {
  let phase = '';
  let story = '';
  let lastAction = '';
  let lastTimestamp: string | null = null;
  const recentActions: Array<{ action: string; status: 'success' | 'error'; timestamp: string; duration: number }> = [];

  // Process lines in reverse (newest first) to find current state
  const reversed = [...lines].reverse();

  for (const rawLine of reversed) {
    const line = stripAnsi(rawLine).trim();
    if (!line) continue;

    // Extract timestamp from log format: [2026-03-10T18:16:01-03:00]
    const tsMatch = line.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.-]+(?:[+-]\d{2}:\d{2}|Z)?)\]/);
    if (tsMatch && !lastTimestamp) {
      lastTimestamp = tsMatch[1];
    }

    // Extract story reference
    if (!story) {
      const storyMatch = line.match(/(?:story|STORY)[\s-]*(\d+\.\d+)/i);
      if (storyMatch) {
        story = `STORY-${storyMatch[1]}`;
      }
      const epicMatch = line.match(/(?:epic|EPIC)[\s-]*(\d+)/i);
      if (epicMatch && !story) {
        story = `EPIC-${epicMatch[1]}`;
      }
    }

    // Detect current phase from common patterns
    if (!phase) {
      if (/running\s+tests?/i.test(line)) phase = 'Running tests';
      else if (/lint\s+check/i.test(line)) phase = 'Linting';
      else if (/type\s+check/i.test(line)) phase = 'Type checking';
      else if (/editing\s+/i.test(line)) phase = 'Editing files';
      else if (/commit/i.test(line)) phase = 'Committing';
      else if (/analyzing/i.test(line)) phase = 'Analyzing';
      else if (/reading\s+story/i.test(line)) phase = 'Reading story';
      else if (/building/i.test(line)) phase = 'Building';
      else if (/deploy/i.test(line)) phase = 'Deploying';
      else if (/review/i.test(line)) phase = 'Reviewing';
      else if (/creating/i.test(line)) phase = 'Creating';
      else if (/waiting/i.test(line)) phase = 'Waiting';
      else if (/completed/i.test(line)) phase = 'Completed';
    }

    // Extract meaningful action lines
    if (!lastAction) {
      // Skip separator lines and empty brackets
      if (!/^[─═]+$/.test(line) && !/^\[.*\]\s*$/.test(line) && line.length > 5) {
        // Remove the timestamp prefix for cleaner display
        lastAction = line.replace(/^\[.*?\]\s*(\[.*?\]\s*)?/, '').trim();
      }
    }

    // Build recent actions list (up to 5)
    if (recentActions.length < 5 && tsMatch) {
      const actionText = line.replace(/^\[.*?\]\s*(\[.*?\]\s*)?/, '').trim();
      if (actionText.length > 5 && !/^[─═]+$/.test(actionText)) {
        const isError = /fail|error|✗|✘/i.test(actionText);
        recentActions.push({
          action: actionText,
          status: isError ? 'error' : 'success',
          timestamp: tsMatch[1],
          duration: 0, // We can't reliably calculate duration from logs
        });
      }
    }
  }

  return {
    phase,
    story,
    lastAction,
    lastTimestamp,
    linesCount: lines.length,
    recentActions,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentStatusInfo {
  id: string;
  name: string;
  status: 'working' | 'waiting' | 'idle' | 'error';
  phase: string;
  progress: number;
  story: string;
  lastActivity: string;
  model: string;
  squad: string;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  logSize: number;
  logLines: number;
}

interface AgentStatusActivity {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  duration: number;
}

interface AgentStatusResponse {
  agents: AgentStatusInfo[];
  activity: AgentStatusActivity[];
  activeCount: number;
  totalCount: number;
  updatedAt: string;
  source: 'live';
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const logsDir = getLogsDir();
  const projectRoot = getProjectRoot();
  const now = Date.now();

  try {
    // Ensure logs dir exists
    await fs.mkdir(logsDir, { recursive: true });

    const files = await fs.readdir(logsDir);
    const logFiles = files.filter((f) => f.endsWith('.log'));

    const agents: AgentStatusInfo[] = [];
    const allActivity: AgentStatusActivity[] = [];
    let activityCounter = 0;

    for (const file of logFiles) {
      const agentId = file.replace('.log', '');
      const filePath = path.join(logsDir, file);

      try {
        const stats = await fs.stat(filePath);
        const mtime = stats.mtime.getTime();
        const timeSinceModified = now - mtime;
        const fileSize = stats.size;

        // Read last 50 lines for analysis
        let lines: string[] = [];
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          lines = content.split('\n').filter((l) => l.length > 0);
        } catch {
          // Skip unreadable files
        }

        const parsed = parseLogTail(lines.slice(-50));

        // Determine status based on file modification time and content
        let status: AgentStatusInfo['status'] = 'idle';
        if (timeSinceModified < WORKING_THRESHOLD_MS && fileSize > 0) {
          status = 'working';
        } else if (timeSinceModified < ACTIVE_THRESHOLD_MS && fileSize > 0) {
          // Recently active but not currently working
          status = parsed.phase === 'Waiting' ? 'waiting' : 'idle';
        }

        // Check for error indicators in recent lines
        if (status === 'working' || status === 'waiting') {
          const recentLines = lines.slice(-5).map((l) => stripAnsi(l));
          const hasError = recentLines.some((l) => /fail|error|✗|✘|FAILED/i.test(l));
          if (hasError) {
            status = 'error';
          }
        }

        // Estimate progress from log content (heuristic)
        let progress = 0;
        if (status === 'working' || status === 'error') {
          const completedSteps = lines.filter((l) => {
            const clean = stripAnsi(l);
            return /✓|PASSED|passed|completed|commit/i.test(clean);
          }).length;
          const totalSteps = Math.max(completedSteps + 3, 10); // Estimate
          progress = Math.min(Math.round((completedSteps / totalSteps) * 100), 95);
        }

        // Look up known agent metadata
        const known = KNOWN_AGENTS[agentId];

        agents.push({
          id: agentId,
          name: known?.name || agentId.charAt(0).toUpperCase() + agentId.slice(1),
          status,
          phase: status !== 'idle' ? parsed.phase : '',
          progress,
          story: parsed.story,
          lastActivity: stats.mtime.toISOString(),
          model: known?.model || 'sonnet',
          squad: 'aios-core',
          totalExecutions: parsed.linesCount,
          successRate: parsed.recentActions.length > 0
            ? Math.round(
                (parsed.recentActions.filter((a) => a.status === 'success').length /
                  parsed.recentActions.length) *
                  100
              )
            : 100,
          avgResponseTime: 0,
          logSize: fileSize,
          logLines: lines.length,
        });

        // Add recent actions as activity entries
        for (const act of parsed.recentActions) {
          activityCounter++;
          allActivity.push({
            id: `live-${agentId}-${activityCounter}`,
            agentId,
            timestamp: act.timestamp,
            action: act.action,
            status: act.status,
            duration: act.duration,
          });
        }
      } catch {
        // Skip files we can't process
      }
    }

    // Also try to read the status.json for active agent context
    try {
      const statusPath = path.join(projectRoot, '.aios', 'dashboard', 'status.json');
      const statusContent = await fs.readFile(statusPath, 'utf-8');
      const statusData = JSON.parse(statusContent);

      if (statusData.activeAgent?.id) {
        const activeId = statusData.activeAgent.id;
        const found = agents.find((a) => a.id === activeId);
        if (found && found.status === 'idle') {
          // The status.json says this agent is active, upgrade its status
          found.status = 'working';
          if (statusData.activeAgent.currentStory) {
            found.story = statusData.activeAgent.currentStory;
          }
        }
      }
    } catch {
      // status.json not available, that's fine
    }

    // Sort: working > error > waiting > idle, then by lastActivity
    const statusOrder: Record<string, number> = { working: 0, error: 1, waiting: 2, idle: 3 };
    agents.sort((a, b) => {
      const orderDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      if (orderDiff !== 0) return orderDiff;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    // Sort activity by timestamp descending
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const response: AgentStatusResponse = {
      agents,
      activity: allActivity.slice(0, 20),
      activeCount: agents.filter((a) => a.status !== 'idle').length,
      totalCount: agents.length,
      updatedAt: new Date().toISOString(),
      source: 'live',
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        agents: [],
        activity: [],
        activeCount: 0,
        totalCount: 0,
        updatedAt: new Date().toISOString(),
        source: 'live',
        error: 'Failed to read agent status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Return 200 so client can fall back gracefully
    );
  }
}
