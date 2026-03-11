import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ── Configuration ──────────────────────────────────────────

/** Poll interval for file changes (ms) */
const POLL_INTERVAL = 1000;

/** Heartbeat interval (ms) */
const HEARTBEAT_INTERVAL = 15_000;

/** Max initial lines to send per log file on connect */
const INITIAL_LINES_PER_FILE = 50;

// ── Helpers ────────────────────────────────────────────────

function getProjectRoot(): string {
  if (process.env.AIOS_PROJECT_ROOT) {
    return process.env.AIOS_PROJECT_ROOT;
  }
  return path.resolve(process.cwd(), '..');
}

function getLogsDir(): string {
  return path.join(getProjectRoot(), '.aios', 'logs');
}

// SSE event names matching what the client hook expects
type MonitorSSEEventType = 'monitor:event' | 'monitor:stats' | 'heartbeat' | 'monitor:init';

interface MonitorEventPayload {
  id: string;
  timestamp: string;
  type: 'tool_call' | 'message' | 'error' | 'system';
  agent: string;
  description: string;
  duration?: number;
  success?: boolean;
}

interface SSEPayload {
  type: MonitorSSEEventType;
  data: unknown;
  timestamp: string;
}

function formatSSE(event: SSEPayload): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

// ── Log Line Parsing ───────────────────────────────────────

let eventCounter = 0;

function generateEventId(): string {
  return `mon-${Date.now()}-${(eventCounter++).toString(36)}`;
}

/**
 * Extract agent name from a log line.
 * Patterns:
 *   [dev] ...  or  [AIOS] Agent @dev ...  or  Agent: @dev
 */
function extractAgent(line: string, filename: string): string {
  // From [agent] prefix
  const bracketMatch = line.match(/\]\s+\[(\w[\w-]*)\]/);
  if (bracketMatch) {
    const name = bracketMatch[1];
    if (name !== 'AIOS') return `@${name}`;
  }

  // From Agent: @name in session headers
  const agentColonMatch = line.match(/Agent:\s*@(\w[\w-]*)/);
  if (agentColonMatch) return `@${agentColonMatch[1]}`;

  // From AIOS Agent @name
  const aiosAgentMatch = line.match(/Agent\s+@(\w[\w-]*)/);
  if (aiosAgentMatch) return `@${aiosAgentMatch[1]}`;

  // Fallback to filename (dev.log -> @dev)
  const base = path.basename(filename, '.log');
  return `@${base}`;
}

/**
 * Extract timestamp from a log line.
 * Pattern: [2026-03-10T18:16:01-03:00]
 */
function extractTimestamp(line: string): string {
  const match = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.+-]+)\]/);
  if (match) {
    try {
      return new Date(match[1]).toISOString();
    } catch {
      // Fall through to default
    }
  }
  return new Date().toISOString();
}

/** Strip ANSI escape codes */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Parse a single log line into a MonitorEvent.
 * Classification rules (from task spec):
 *   - Lines starting with `$` -> tool_call
 *   - Lines with PASS/FAIL/error/Error -> error or system
 *   - Lines with [stderr] -> error
 *   - Session headers (===) -> system (job started)
 *   - Session footers (-- COMPLETED/FAILED) -> system (job ended)
 *   - Other lines -> message
 */
function parseLogLine(rawLine: string, filename: string): MonitorEventPayload | null {
  const line = stripAnsi(rawLine).trim();
  if (!line) return null;

  const agent = extractAgent(rawLine, filename);
  const timestamp = extractTimestamp(rawLine);

  // Strip the timestamp prefix for description
  const descriptionRaw = line.replace(/^\[\d{4}-\d{2}-\d{2}T[\d:.+-]+\]\s*/, '');
  // Strip the [agent] prefix too
  const description = descriptionRaw.replace(/^\[\w[\w-]*\]\s*/, '').trim();

  if (!description) return null;

  // Session header: ═══
  if (line.includes('═══')) {
    return {
      id: generateEventId(),
      timestamp,
      type: 'system',
      agent,
      description: `Session started`,
      success: true,
    };
  }

  // Session footer: ── COMPLETED or ── FAILED
  if (/──\s*(COMPLETED|FAILED)/i.test(line)) {
    const isCompleted = /COMPLETED/i.test(line);
    const durationMatch = line.match(/duration:\s*([\d.]+)s/);
    return {
      id: generateEventId(),
      timestamp,
      type: 'system',
      agent,
      description: isCompleted ? 'Job completed' : 'Job failed',
      duration: durationMatch ? parseFloat(durationMatch[1]) * 1000 : undefined,
      success: isCompleted,
    };
  }

  // Tool call: lines starting with $
  if (/^\$\s/.test(description) || /^\$\s/.test(descriptionRaw)) {
    const cmd = description.replace(/^\$\s*/, '');
    return {
      id: generateEventId(),
      timestamp,
      type: 'tool_call',
      agent,
      description: cmd,
      success: true,
    };
  }

  // stderr
  if (line.includes('[stderr]')) {
    return {
      id: generateEventId(),
      timestamp,
      type: 'error',
      agent,
      description: description.replace(/\[stderr\]\s*/, ''),
      success: false,
    };
  }

  // FAIL or error/Error keywords
  if (/\bFAIL\b/.test(line) || /\b[Ee]rror\b/.test(line)) {
    return {
      id: generateEventId(),
      timestamp,
      type: 'error',
      agent,
      description,
      success: false,
    };
  }

  // PASS lines -> system
  if (/\bPASS\b/.test(line) || /\bPASSED\b/.test(line)) {
    return {
      id: generateEventId(),
      timestamp,
      type: 'system',
      agent,
      description,
      success: true,
    };
  }

  // Everything else -> message
  return {
    id: generateEventId(),
    timestamp,
    type: 'message',
    agent,
    description,
  };
}

// ── Per-File Tracker ───────────────────────────────────────

interface FileTracker {
  path: string;
  lastSize: number;
  exists: boolean;
}

// ── Route Handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  const logsDir = getLogsDir();

  // Ensure logs directory exists
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch {
    // May already exist
  }

  const encoder = new TextEncoder();
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let isStreamActive = true;
  const fileTrackers: Map<string, FileTracker> = new Map();

  const cleanup = () => {
    isStreamActive = false;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEPayload) => {
        if (!isStreamActive) return;
        try {
          controller.enqueue(encoder.encode(formatSSE(event)));
        } catch {
          isStreamActive = false;
        }
      };

      // ── 1. Discover all .log files ──
      let logFiles: string[] = [];
      try {
        const entries = await fs.readdir(logsDir);
        logFiles = entries
          .filter((f) => f.endsWith('.log'))
          .map((f) => path.join(logsDir, f));
      } catch {
        // No log files yet — will pick them up on poll
      }

      // ── 2. Send init event ──
      sendEvent({
        type: 'monitor:init',
        data: {
          files: logFiles.map((f) => path.basename(f)),
          logsDir,
        },
        timestamp: new Date().toISOString(),
      });

      // ── 3. Read initial content from all log files ──
      const allInitialEvents: MonitorEventPayload[] = [];

      for (const filePath of logFiles) {
        try {
          const stats = await fs.stat(filePath);
          fileTrackers.set(filePath, {
            path: filePath,
            lastSize: stats.size,
            exists: true,
          });

          // Read last N lines
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').filter((l) => l.length > 0);
          const lastLines = lines.slice(-INITIAL_LINES_PER_FILE);

          for (const line of lastLines) {
            const event = parseLogLine(line, filePath);
            if (event) allInitialEvents.push(event);
          }
        } catch {
          // File may have been deleted
        }
      }

      // Sort initial events by timestamp and send
      allInitialEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (const event of allInitialEvents) {
        sendEvent({
          type: 'monitor:event',
          data: event,
          timestamp: event.timestamp,
        });
      }

      // ── 4. Send initial stats summary ──
      const totalEvents = allInitialEvents.length;
      const errorCount = allInitialEvents.filter((e) => e.type === 'error').length;
      const toolCalls = allInitialEvents.filter((e) => e.type === 'tool_call');
      const successfulTools = toolCalls.filter((e) => e.success);
      const activeAgents = new Set(allInitialEvents.map((e) => e.agent));

      sendEvent({
        type: 'monitor:stats',
        data: {
          total: totalEvents,
          errorCount,
          successRate:
            toolCalls.length > 0
              ? Math.round((successfulTools.length / toolCalls.length) * 100)
              : 100,
          activeSessions: activeAgents.size,
        },
        timestamp: new Date().toISOString(),
      });

      // ── 5. Poll all log files for new content ──
      const pollForChanges = async () => {
        if (!isStreamActive) return;

        try {
          // Discover new log files that may have been created
          let currentFiles: string[] = [];
          try {
            const entries = await fs.readdir(logsDir);
            currentFiles = entries
              .filter((f) => f.endsWith('.log'))
              .map((f) => path.join(logsDir, f));
          } catch {
            return;
          }

          // Check for new files
          for (const filePath of currentFiles) {
            if (!fileTrackers.has(filePath)) {
              // New file discovered
              try {
                const stats = await fs.stat(filePath);
                fileTrackers.set(filePath, {
                  path: filePath,
                  lastSize: stats.size,
                  exists: true,
                });

                // Send existing content
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n').filter((l) => l.length > 0);
                const lastLines = lines.slice(-INITIAL_LINES_PER_FILE);

                for (const line of lastLines) {
                  const event = parseLogLine(line, filePath);
                  if (event) {
                    sendEvent({
                      type: 'monitor:event',
                      data: event,
                      timestamp: event.timestamp,
                    });
                  }
                }
              } catch {
                // Ignore new file read errors
              }
            }
          }

          // Check each tracked file for new content
          for (const [filePath, tracker] of fileTrackers) {
            try {
              let stats;
              try {
                stats = await fs.stat(filePath);
              } catch {
                if (tracker.exists) {
                  tracker.exists = false;
                  tracker.lastSize = 0;
                }
                continue;
              }

              if (!tracker.exists) {
                // File recreated
                tracker.exists = true;
                tracker.lastSize = stats.size;

                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n').filter((l) => l.length > 0);
                const lastLines = lines.slice(-INITIAL_LINES_PER_FILE);

                for (const line of lastLines) {
                  const event = parseLogLine(line, filePath);
                  if (event) {
                    sendEvent({
                      type: 'monitor:event',
                      data: event,
                      timestamp: event.timestamp,
                    });
                  }
                }
                continue;
              }

              const currentSize = stats.size;

              if (currentSize > tracker.lastSize) {
                // New content appended — read only new bytes
                const bytesToRead = currentSize - tracker.lastSize;
                const fh = await fs.open(filePath, 'r');
                const buffer = Buffer.alloc(bytesToRead);
                await fh.read(buffer, 0, bytesToRead, tracker.lastSize);
                await fh.close();

                const newContent = buffer.toString('utf-8');
                const newLines = newContent.split('\n').filter((l) => l.length > 0);

                for (const line of newLines) {
                  const event = parseLogLine(line, filePath);
                  if (event) {
                    sendEvent({
                      type: 'monitor:event',
                      data: event,
                      timestamp: event.timestamp,
                    });
                  }
                }

                tracker.lastSize = currentSize;
              } else if (currentSize < tracker.lastSize) {
                // File truncated/rotated — reset
                tracker.lastSize = currentSize;
              }
            } catch {
              // Skip this file on error, continue with others
            }
          }
        } catch {
          // Non-critical polling error
        }
      };

      pollInterval = setInterval(pollForChanges, POLL_INTERVAL);

      // ── 6. Heartbeat ──
      heartbeatInterval = setInterval(() => {
        sendEvent({
          type: 'heartbeat',
          data: {
            alive: true,
            trackedFiles: fileTrackers.size,
          },
          timestamp: new Date().toISOString(),
        });
      }, HEARTBEAT_INTERVAL);
    },

    cancel() {
      cleanup();
    },
  });

  // Handle client disconnect
  request.signal.addEventListener('abort', cleanup);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
