// ── Engine Runner ──
// Spawns an engine process pointing at a generated project.

import { resolve } from 'path';
import type { RunnerOptions, EngineProcess } from './types';

const DEFAULT_PORT = 4099;
const DEFAULT_TIMEOUT = 15_000;
const POLL_INTERVAL = 200;

export async function startEngine(options: RunnerOptions): Promise<EngineProcess> {
  const port = options.port || DEFAULT_PORT;
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const enginePath = options.enginePath || resolve(import.meta.dir, '..', '..', 'engine');
  const projectPath = resolve(options.projectPath);
  const baseUrl = `http://localhost:${port}`;

  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  env['AIOS_PROJECT_ROOT'] = projectPath;
  env['ENGINE_PORT'] = String(port);
  // Avoid recursive Claude Code detection
  delete env['CLAUDECODE'];

  const proc = Bun.spawn(['bun', 'run', 'src/index.ts'], {
    cwd: enginePath,
    env,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  // Poll /health until ready
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) {
        return {
          proc,
          port,
          baseUrl,
          kill: () => {
            try { proc.kill(); } catch { /* no-op */ }
          },
        };
      }
    } catch {
      // Not ready yet
    }
    await Bun.sleep(POLL_INTERVAL);
  }

  // Timeout — kill and throw
  try { proc.kill(); } catch { /* no-op */ }
  throw new Error(`Engine failed to start within ${timeout}ms on port ${port}`);
}

export async function fetchEndpoint(baseUrl: string, path: string): Promise<{ status: number; body: unknown; responseTime: number }> {
  const start = performance.now();
  const res = await fetch(`${baseUrl}${path}`);
  const responseTime = performance.now() - start;
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status, body, responseTime };
}
