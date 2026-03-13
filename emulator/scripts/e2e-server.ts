#!/usr/bin/env bun
// ── E2E Server ──
// Generates a standard project and starts the engine for Playwright tests.

import { generate } from '../src/generator';
import { getArchetype } from '../src/archetypes/index';
import { resolve } from 'path';
import { join } from 'path';

const archetype = process.env.EMULATE_ARCHETYPE || 'standard';
const port = Number(process.env.ENGINE_PORT) || 4095;
const outputDir = join(import.meta.dir, '..', 'output', '__e2e__');
const enginePath = resolve(import.meta.dir, '..', '..', 'engine');

const spec = getArchetype(archetype);
if (!spec) {
  console.error(`Unknown archetype: ${archetype}`);
  process.exit(1);
}

// Generate project
const result = await generate(spec, outputDir);
console.log(`Generated ${spec.archetype} at ${result.projectPath}`);

// Start engine (foreground — Playwright's webServer will manage the lifecycle)
const env: Record<string, string> = {};
for (const [k, v] of Object.entries(process.env)) {
  if (v !== undefined) env[k] = v;
}
env['AIOS_PROJECT_ROOT'] = result.projectPath;
env['ENGINE_PORT'] = String(port);
delete env['CLAUDECODE'];

const proc = Bun.spawn(['bun', 'run', 'src/index.ts'], {
  cwd: enginePath,
  env,
  stdout: 'inherit',
  stderr: 'inherit',
});

// Forward SIGINT/SIGTERM to child
process.on('SIGINT', () => { proc.kill(); process.exit(0); });
process.on('SIGTERM', () => { proc.kill(); process.exit(0); });

await proc.exited;
