import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';

// Valid agent IDs that can have log files
const VALID_AGENTS = [
  'main', 'dev', 'qa', 'architect', 'pm', 'po', 'devops', 'sm', 'analyst', 'data-engineer',
];

// Max initial lines to send on connection
const INITIAL_LINES = 200;

// Poll interval for file changes (ms) — fast enough for real-time feel
const POLL_INTERVAL = 500;

// Heartbeat interval (ms)
const HEARTBEAT_INTERVAL = 30_000;

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

function getLogFilePath(agentId: string): string {
  return path.join(getLogsDir(), `${agentId}.log`);
}

// SSE event types matching what TerminalStream expects
type LogEventType = 'log:line' | 'log:init' | 'log:error' | 'heartbeat';

interface SSEEvent {
  type: LogEventType;
  data: unknown;
  timestamp: string;
}

function formatSSE(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

// Read last N lines from a file
async function readLastLines(filePath: string, maxLines: number): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.length > 0);
    return lines.slice(-maxLines);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agent');

  if (!agentId || !VALID_AGENTS.includes(agentId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing agent parameter', validAgents: VALID_AGENTS }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const logsDir = getLogsDir();
  const logFilePath = getLogFilePath(agentId);

  // Ensure logs directory exists
  await fs.mkdir(logsDir, { recursive: true });

  const encoder = new TextEncoder();
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let isStreamActive = true;
  let lastFileSize = 0;
  let fileExists = false;

  // Cleanup helper
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
      const sendEvent = (event: SSEEvent) => {
        if (!isStreamActive) return;
        try {
          controller.enqueue(encoder.encode(formatSSE(event)));
        } catch {
          isStreamActive = false;
        }
      };

      // --- 1. Send init event ---
      sendEvent({
        type: 'log:init',
        data: { agent: agentId },
        timestamp: new Date().toISOString(),
      });

      // --- 2. Send existing content (last N lines) ---
      if (existsSync(logFilePath)) {
        try {
          const stats = await fs.stat(logFilePath);
          lastFileSize = stats.size;
          fileExists = true;

          const lines = await readLastLines(logFilePath, INITIAL_LINES);
          for (const line of lines) {
            sendEvent({
              type: 'log:line',
              data: { line, initial: true },
              timestamp: new Date().toISOString(),
            });
          }
        } catch {
          // File may have been deleted between check and read
        }
      }

      // --- 3. Poll for new content (tail -f behavior) ---
      const pollForChanges = async () => {
        if (!isStreamActive) return;

        try {
          let stats;
          try {
            stats = await fs.stat(logFilePath);
          } catch {
            // File doesn't exist (yet) — check on next poll
            if (fileExists) {
              // File was deleted
              fileExists = false;
              lastFileSize = 0;
            }
            return;
          }

          const currentSize = stats.size;

          if (!fileExists) {
            // File was just created — send initial content
            fileExists = true;
            lastFileSize = currentSize;

            const lines = await readLastLines(logFilePath, INITIAL_LINES);
            for (const line of lines) {
              sendEvent({
                type: 'log:line',
                data: { line, initial: true },
                timestamp: new Date().toISOString(),
              });
            }
            return;
          }

          if (currentSize > lastFileSize) {
            // New content appended — read only the new bytes
            const bytesToRead = currentSize - lastFileSize;
            const fh = await fs.open(logFilePath, 'r');
            const buffer = Buffer.alloc(bytesToRead);
            await fh.read(buffer, 0, bytesToRead, lastFileSize);
            await fh.close();

            const newContent = buffer.toString('utf-8');
            const newLines = newContent.split('\n').filter(l => l.length > 0);

            for (const line of newLines) {
              sendEvent({
                type: 'log:line',
                data: { line, initial: false },
                timestamp: new Date().toISOString(),
              });
            }

            lastFileSize = currentSize;
          } else if (currentSize < lastFileSize) {
            // File was truncated/rotated — re-read from start
            lastFileSize = currentSize;

            sendEvent({
              type: 'log:init',
              data: { agent: agentId, reason: 'file-rotated' },
              timestamp: new Date().toISOString(),
            });

            const lines = await readLastLines(logFilePath, INITIAL_LINES);
            for (const line of lines) {
              sendEvent({
                type: 'log:line',
                data: { line, initial: true },
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          sendEvent({
            type: 'log:error',
            data: {
              message: `Failed to read log: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
            timestamp: new Date().toISOString(),
          });
        }
      };

      // Start polling for file changes
      pollInterval = setInterval(pollForChanges, POLL_INTERVAL);

      // --- 4. Heartbeat ---
      heartbeatInterval = setInterval(() => {
        sendEvent({
          type: 'heartbeat',
          data: { alive: true, agent: agentId },
          timestamp: new Date().toISOString(),
        });
      }, HEARTBEAT_INTERVAL);
    },

    cancel() {
      cleanup();
    },
  });

  // Handle client disconnect via AbortSignal
  request.signal.addEventListener('abort', cleanup);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
