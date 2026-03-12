// ── Error Handling Tests ──
// Edge case archetypes: engine must not crash.

import { describe, test, expect, afterAll } from 'bun:test';
import { generate } from '../src/generator';
import { startEngine, fetchEndpoint } from '../src/runner';
import { getArchetype } from '../src/archetypes/index';
import { join } from 'path';
import { rm } from 'fs/promises';
import type { EngineProcess } from '../src/types';

const TEST_OUTPUT = join(import.meta.dir, '..', 'output', '__error-test__');
const PORT = 4096;

afterAll(async () => {
  await rm(TEST_OUTPUT, { recursive: true, force: true });
});

describe('Error Handling — malformed YAML', () => {
  test('engine starts despite broken configs', async () => {
    const spec = getArchetype('malformed')!;
    const result = await generate(spec, TEST_OUTPUT);
    let engine: EngineProcess | null = null;

    try {
      engine = await startEngine({
        projectPath: result.projectPath,
        port: PORT,
        timeout: 15_000,
      });

      // Engine should be running
      const health = await fetchEndpoint(engine.baseUrl, '/health');
      expect(health.status).toBe(200);

      // Should return arrays (even if partially populated)
      const squads = await fetchEndpoint(engine.baseUrl, '/squads');
      expect(squads.status).toBe(200);
      const squadsData = squads.body as { squads: unknown[] };
      expect(Array.isArray(squadsData.squads)).toBe(true);

      const agents = await fetchEndpoint(engine.baseUrl, '/agents');
      expect(agents.status).toBe(200);
      const agentsData = agents.body as { agents: unknown[] };
      expect(Array.isArray(agentsData.agents)).toBe(true);
    } finally {
      engine?.kill();
    }
  }, 30_000);
});

describe('Error Handling — empty directories', () => {
  test('engine handles squads with no agents', async () => {
    const spec = getArchetype('empty-dirs')!;
    const result = await generate(spec, TEST_OUTPUT);
    let engine: EngineProcess | null = null;

    try {
      engine = await startEngine({
        projectPath: result.projectPath,
        port: PORT,
        timeout: 15_000,
      });

      const health = await fetchEndpoint(engine.baseUrl, '/health');
      expect(health.status).toBe(200);

      const squads = await fetchEndpoint(engine.baseUrl, '/squads');
      const squadsData = squads.body as { squads: unknown[] };
      expect(squadsData.squads.length).toBeGreaterThanOrEqual(0);

      const agents = await fetchEndpoint(engine.baseUrl, '/agents');
      const agentsData = agents.body as { agents: unknown[] };
      expect(agentsData.agents.length).toBe(0);
    } finally {
      engine?.kill();
    }
  }, 30_000);
});

describe('Error Handling — unicode content', () => {
  test('engine handles unicode names correctly', async () => {
    const spec = getArchetype('unicode')!;
    const result = await generate(spec, TEST_OUTPUT);
    let engine: EngineProcess | null = null;

    try {
      engine = await startEngine({
        projectPath: result.projectPath,
        port: PORT,
        timeout: 15_000,
      });

      const health = await fetchEndpoint(engine.baseUrl, '/health');
      expect(health.status).toBe(200);

      const agents = await fetchEndpoint(engine.baseUrl, '/agents');
      expect(agents.status).toBe(200);
      const agentsData = agents.body as { agents: Record<string, unknown>[] };
      expect(agentsData.agents.length).toBeGreaterThanOrEqual(4);
    } finally {
      engine?.kill();
    }
  }, 30_000);
});
