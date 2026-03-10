import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/squad-api-utils';

type ActivityType = 'execution' | 'tool_call' | 'message' | 'error' | 'system';

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'pending';
  agent?: string;
}

interface SessionBlock {
  agent: string;
  job: string;
  squad: string;
  dir: string;
  started: string;
  status: 'completed' | 'failed' | 'running';
  duration?: string;
  lines: string[];
}

/**
 * Parse session header blocks from log content.
 *
 * Session headers look like:
 * ═══════════════════════════════════════════════
 *   Agent: @dev | Job: job-123
 *   Squad: development | Dir: ~/project
 *   Started: 2026-03-10T22:00:00Z
 * ═══════════════════════════════════════════════
 * ...
 * ── COMPLETED ── duration: 42.3s ── job: job-123 ──
 */
function parseSessionBlocks(content: string): SessionBlock[] {
  const blocks: SessionBlock[] = [];
  const lines = content.split('\n');

  let inBlock = false;
  let currentBlock: Partial<SessionBlock> = {};
  let blockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect session header start (line of ═ characters)
    if (/^[═]{10,}/.test(line.trim())) {
      if (inBlock) {
        // End of header — content follows
        inBlock = false;
        continue;
      }
      // Start of new session header
      inBlock = true;
      currentBlock = {};
      blockLines = [];
      continue;
    }

    if (inBlock) {
      // Parse header lines
      const agentJobMatch = line.match(/Agent:\s*(@?\w[\w-]*)\s*\|\s*Job:\s*([\w-]+)/i);
      if (agentJobMatch) {
        currentBlock.agent = agentJobMatch[1].startsWith('@') ? agentJobMatch[1] : `@${agentJobMatch[1]}`;
        currentBlock.job = agentJobMatch[2];
      }

      const squadDirMatch = line.match(/Squad:\s*([\w-]+)\s*\|\s*Dir:\s*(.+)/i);
      if (squadDirMatch) {
        currentBlock.squad = squadDirMatch[1];
        currentBlock.dir = squadDirMatch[2].trim();
      }

      const startedMatch = line.match(/Started:\s*(.+)/i);
      if (startedMatch) {
        currentBlock.started = startedMatch[1].trim();
      }
      continue;
    }

    // Look for COMPLETED or FAILED markers
    const completedMatch = line.match(/──\s*COMPLETED\s*──\s*duration:\s*([\d.]+)s\s*──\s*job:\s*([\w-]+)\s*──/i);
    if (completedMatch) {
      if (currentBlock.agent) {
        blocks.push({
          agent: currentBlock.agent || 'unknown',
          job: currentBlock.job || completedMatch[2],
          squad: currentBlock.squad || 'unknown',
          dir: currentBlock.dir || '',
          started: currentBlock.started || new Date().toISOString(),
          status: 'completed',
          duration: completedMatch[1],
          lines: blockLines,
        });
      }
      currentBlock = {};
      blockLines = [];
      continue;
    }

    const failedMatch = line.match(/──\s*FAILED\s*──\s*(?:duration:\s*([\d.]+)s\s*──\s*)?job:\s*([\w-]+)\s*──/i);
    if (failedMatch) {
      if (currentBlock.agent) {
        blocks.push({
          agent: currentBlock.agent || 'unknown',
          job: currentBlock.job || failedMatch[2],
          squad: currentBlock.squad || 'unknown',
          dir: currentBlock.dir || '',
          started: currentBlock.started || new Date().toISOString(),
          status: 'failed',
          duration: failedMatch[1],
          lines: blockLines,
        });
      }
      currentBlock = {};
      blockLines = [];
      continue;
    }

    // Collect block content lines
    if (currentBlock.agent) {
      blockLines.push(line);
    }
  }

  // If there's an unfinished block, mark it as running
  if (currentBlock.agent && currentBlock.started) {
    blocks.push({
      agent: currentBlock.agent || 'unknown',
      job: currentBlock.job || 'unknown',
      squad: currentBlock.squad || 'unknown',
      dir: currentBlock.dir || '',
      started: currentBlock.started,
      status: 'running',
      lines: blockLines,
    });
  }

  return blocks;
}

/**
 * Parse timestamped log lines into events.
 * Lines like: [2026-03-10T18:16:01-03:00] [dev] Running lint check... PASSED
 */
function parseLogLines(content: string, fileName: string): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const lines = content.split('\n');
  const agentFromFile = fileName.replace(/\.log$/i, '');

  for (const line of lines) {
    const tsMatch = line.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.+-]+)\]\s*(?:\[(\w+)\])?\s*(.+)/);
    if (!tsMatch) continue;

    const timestamp = tsMatch[1];
    const agent = tsMatch[2] ? `@${tsMatch[2]}` : `@${agentFromFile}`;
    const message = tsMatch[3].trim();

    // Skip separator lines
    if (/^[─═]+$/.test(message)) continue;

    // Determine event type and status
    let type: ActivityType = 'system';
    let status: ActivityEvent['status'] = undefined;

    if (/error|fail|❌/i.test(message)) {
      type = 'error';
      status = 'error';
    } else if (/PASSED|✓|passed|success|complete/i.test(message)) {
      type = 'execution';
      status = 'success';
    } else if (/running|editing|reading|checking|analyzing/i.test(message)) {
      type = 'tool_call';
      status = 'success';
    } else if (/commit|git|npm/i.test(message)) {
      type = 'tool_call';
      status = 'success';
    } else if (/⚠|warning|skipped/i.test(message)) {
      type = 'message';
      status = 'pending';
    } else if (/starting|agent|model|working/i.test(message)) {
      type = 'system';
    }

    // Clean ANSI escape codes from message
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (!cleanMessage) continue;

    events.push({
      id: `log-${agentFromFile}-${timestamp}-${events.length}`,
      timestamp: new Date(timestamp).toISOString(),
      type,
      title: cleanMessage,
      agent,
      status,
    });
  }

  return events;
}

/**
 * Convert session blocks to timeline events.
 */
function sessionBlocksToEvents(blocks: SessionBlock[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const block of blocks) {
    // Session start event
    events.push({
      id: `session-start-${block.job}`,
      timestamp: new Date(block.started).toISOString(),
      type: 'system',
      title: `Session started — ${block.agent} (${block.squad})`,
      agent: block.agent,
      status: 'success',
    });

    // Parse individual lines within the block for tool calls / errors
    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i].trim();
      if (!line || /^[─═$]+$/.test(line.charAt(0)) === false) {
        // Skip empty lines but process content
      }

      // Command lines ($ prefix)
      const cmdMatch = line.match(/^\$\s+(.+)/);
      if (cmdMatch) {
        events.push({
          id: `session-cmd-${block.job}-${i}`,
          timestamp: new Date(new Date(block.started).getTime() + i * 1000).toISOString(),
          type: 'tool_call',
          title: cmdMatch[1],
          agent: block.agent,
          status: 'success',
        });
        continue;
      }

      // Test results
      if (/tests?:\s*\d+\s*passed/i.test(line)) {
        events.push({
          id: `session-test-${block.job}-${i}`,
          timestamp: new Date(new Date(block.started).getTime() + i * 1000).toISOString(),
          type: 'execution',
          title: line.replace(/\x1b\[[0-9;]*m/g, ''),
          agent: block.agent,
          status: /fail/i.test(line) ? 'error' : 'success',
        });
        continue;
      }

      // Errors
      if (/error|fail|stderr/i.test(line)) {
        events.push({
          id: `session-err-${block.job}-${i}`,
          timestamp: new Date(new Date(block.started).getTime() + i * 1000).toISOString(),
          type: 'error',
          title: line.replace(/\x1b\[[0-9;]*m/g, ''),
          agent: block.agent,
          status: 'error',
        });
        continue;
      }

      // Success markers
      if (/^✓/.test(line) || /PASS /i.test(line)) {
        events.push({
          id: `session-ok-${block.job}-${i}`,
          timestamp: new Date(new Date(block.started).getTime() + i * 1000).toISOString(),
          type: 'execution',
          title: line.replace(/\x1b\[[0-9;]*m/g, ''),
          agent: block.agent,
          status: 'success',
        });
      }
    }

    // Session end event
    if (block.status !== 'running') {
      const endTime = block.duration
        ? new Date(new Date(block.started).getTime() + parseFloat(block.duration) * 1000)
        : new Date(new Date(block.started).getTime() + block.lines.length * 1000);

      events.push({
        id: `session-end-${block.job}`,
        timestamp: endTime.toISOString(),
        type: block.status === 'completed' ? 'execution' : 'error',
        title: block.status === 'completed'
          ? `Session completed — ${block.duration ? `${block.duration}s` : 'done'}`
          : `Session failed — ${block.job}`,
        agent: block.agent,
        status: block.status === 'completed' ? 'success' : 'error',
      });
    }
  }

  return events;
}

/**
 * GET /api/activity?limit=50
 * Returns recent activity events parsed from .aios/logs/*.log files.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const projectRoot = getProjectRoot();
  const logsDir = path.join(projectRoot, '.aios', 'logs');

  const allEvents: ActivityEvent[] = [];

  try {
    const logFiles = await fs.readdir(logsDir);

    for (const file of logFiles) {
      if (!file.endsWith('.log') || file.startsWith('.')) continue;

      const filePath = path.join(logsDir, file);
      try {
        const stat = await fs.stat(filePath);
        // Only process log files modified in the last 7 days
        if (Date.now() - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) continue;

        const content = await fs.readFile(filePath, 'utf-8');

        // Parse session blocks (structured headers)
        const blocks = parseSessionBlocks(content);
        if (blocks.length > 0) {
          allEvents.push(...sessionBlocksToEvents(blocks));
        }

        // Parse individual timestamped log lines
        const lineEvents = parseLogLines(content, file);
        allEvents.push(...lineEvents);
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Logs directory doesn't exist
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allEvents.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Sort by timestamp descending (most recent first)
  unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const limited = unique.slice(0, limit);

  return NextResponse.json({
    events: limited,
    total: unique.length,
    source: 'aios-logs',
  });
}
