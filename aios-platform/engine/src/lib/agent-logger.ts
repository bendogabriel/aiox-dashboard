import { mkdirSync, existsSync, appendFileSync, statSync, renameSync, unlinkSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { projectPath } from './project-resolver';
import { log } from './logger';

// ============================================================
// Agent Logger — Writes agent CLI output to .aios/logs/{agentId}.log
// Enables real-time terminal streaming via the SSE log-tailing API.
// Includes automatic log rotation when files exceed MAX_LOG_SIZE.
// ============================================================

// -- Configuration --

/** Maximum size per log file before rotation (5 MB) */
const MAX_LOG_SIZE = 5 * 1024 * 1024;

/** Number of rotated files to keep per agent */
const MAX_ROTATED_FILES = 3;

/** How often to check file size (every N writes) */
const ROTATION_CHECK_INTERVAL = 50;

// -- State --

let logsDir: string | null = null;

/** Write counter per agent for throttled rotation checks */
const writeCounts = new Map<string, number>();

/**
 * Ensure the .aios/logs/ directory exists. Call once at engine startup.
 */
export function initAgentLogs(): void {
  logsDir = projectPath('.aios', 'logs');

  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
    log.info('Created agent logs directory', { path: logsDir });
  }
}

function getLogsDir(): string {
  if (!logsDir) {
    initAgentLogs();
  }
  return logsDir!;
}

function getLogPath(agentId: string): string {
  // Sanitize agentId to prevent path traversal
  const safe = agentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return resolve(getLogsDir(), `${safe}.log`);
}

// -- Log Rotation --

/**
 * Rotate log file if it exceeds MAX_LOG_SIZE.
 * Rotation scheme: agent.log → agent.1.log → agent.2.log → agent.3.log (deleted)
 */
function rotateIfNeeded(agentId: string, logPath: string): void {
  try {
    if (!existsSync(logPath)) return;

    const stats = statSync(logPath);
    if (stats.size < MAX_LOG_SIZE) return;

    const dir = getLogsDir();
    const safe = agentId.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Delete oldest rotated file
    const oldestPath = resolve(dir, `${safe}.${MAX_ROTATED_FILES}.log`);
    if (existsSync(oldestPath)) {
      unlinkSync(oldestPath);
    }

    // Shift existing rotated files: N-1 → N, N-2 → N-1, ...
    for (let i = MAX_ROTATED_FILES - 1; i >= 1; i--) {
      const from = resolve(dir, `${safe}.${i}.log`);
      const to = resolve(dir, `${safe}.${i + 1}.log`);
      if (existsSync(from)) {
        renameSync(from, to);
      }
    }

    // Rotate current file → .1.log
    renameSync(logPath, resolve(dir, `${safe}.1.log`));

    log.info('Rotated agent log', { agentId, previousSize: stats.size });
  } catch (err) {
    log.warn('Log rotation failed', {
      agentId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Append a text chunk to an agent's log file.
 * Automatically rotates the file if it exceeds MAX_LOG_SIZE.
 */
export function writeAgentLog(agentId: string, text: string): void {
  try {
    const logPath = getLogPath(agentId);

    // Throttled rotation check — only every N writes
    const count = (writeCounts.get(agentId) ?? 0) + 1;
    writeCounts.set(agentId, count);

    if (count % ROTATION_CHECK_INTERVAL === 0) {
      rotateIfNeeded(agentId, logPath);
    }

    appendFileSync(logPath, text);
  } catch (err) {
    log.warn('Failed to write agent log', {
      agentId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Write a timestamped line to an agent's log file.
 */
export function writeAgentLogLine(agentId: string, line: string): void {
  const ts = new Date().toISOString().slice(11, 19); // HH:MM:SS
  writeAgentLog(agentId, `[${ts}] ${line}\n`);
}

/**
 * Write a session header when an agent job starts.
 */
export function writeAgentSessionStart(agentId: string, meta: {
  jobId: string;
  squadId: string;
  cwd: string;
}): void {
  const separator = '═'.repeat(60);
  const ts = new Date().toISOString();
  const header = [
    '',
    separator,
    `  Agent: @${agentId} | Job: ${meta.jobId}`,
    `  Squad: ${meta.squadId} | Dir: ${meta.cwd}`,
    `  Started: ${ts}`,
    separator,
    '',
  ].join('\n');
  writeAgentLog(agentId, header);
}

/**
 * Write a session footer when an agent job ends.
 */
export function writeAgentSessionEnd(agentId: string, meta: {
  jobId: string;
  exitCode: number;
  durationMs: number;
}): void {
  const durationSec = (meta.durationMs / 1000).toFixed(1);
  const status = meta.exitCode === 0 ? 'COMPLETED' : `FAILED (exit ${meta.exitCode})`;
  const footer = [
    '',
    `── ${status} ── duration: ${durationSec}s ── job: ${meta.jobId} ──`,
    '',
  ].join('\n');
  writeAgentLog(agentId, footer);
}

/**
 * Create a transform that tees ReadableStream chunks to the agent log.
 * Returns a TransformStream that passes data through unchanged while
 * writing a copy to the log file.
 */
export function createAgentLogTee(agentId: string): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();

  return new TransformStream({
    transform(chunk, controller) {
      // Pass through unchanged
      controller.enqueue(chunk);

      // Write copy to log file
      const text = decoder.decode(chunk, { stream: true });
      writeAgentLog(agentId, text);
    },
  });
}

/**
 * Clean up old rotated log files across all agents.
 * Call periodically or at engine startup.
 */
export function cleanupOldLogs(): void {
  try {
    const dir = getLogsDir();
    const files = readdirSync(dir);

    // Find rotated files beyond MAX_ROTATED_FILES
    const rotatedPattern = /^(.+)\.(\d+)\.log$/;
    let cleaned = 0;

    for (const file of files) {
      const match = file.match(rotatedPattern);
      if (match) {
        const index = parseInt(match[2], 10);
        if (index > MAX_ROTATED_FILES) {
          unlinkSync(resolve(dir, file));
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      log.info('Cleaned up old log files', { cleaned });
    }
  } catch {
    // Non-critical — ignore cleanup errors
  }
}
