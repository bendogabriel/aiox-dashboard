// ── Integration Test: Engine Discovery ──
// Tests that the engine correctly discovers generated projects.
// Requires engine to be available at ../engine/

import { describe, test, expect, afterAll } from 'bun:test';
import { generate } from '../src/generator';
import { startEngine, fetchEndpoint } from '../src/runner';
import { getArchetype } from '../src/archetypes/index';
import { join } from 'path';
import { rm } from 'fs/promises';
import type { EngineProcess } from '../src/types';

const TEST_OUTPUT = join(import.meta.dir, '..', 'output', '__integration__');
const PORT = 4098;

async function testArchetype(name: string) {
  const spec = getArchetype(name)!;
  let engine: EngineProcess | null = null;

  try {
    const genResult = await generate(spec, TEST_OUTPUT);
    engine = await startEngine({
      projectPath: genResult.projectPath,
      port: PORT,
      timeout: 15_000,
    });

    // /health
    const health = await fetchEndpoint(engine.baseUrl, '/health');
    expect(health.status).toBe(200);

    // /squads
    const squads = await fetchEndpoint(engine.baseUrl, '/squads');
    expect(squads.status).toBe(200);
    const squadsBody = squads.body as { squads: unknown[] };
    expect(Array.isArray(squadsBody.squads)).toBe(true);

    // /agents
    const agents = await fetchEndpoint(engine.baseUrl, '/agents');
    expect(agents.status).toBe(200);
    const agentsBody = agents.body as { agents: unknown[] };
    expect(Array.isArray(agentsBody.agents)).toBe(true);

    // /agents/status
    const status = await fetchEndpoint(engine.baseUrl, '/agents/status');
    expect(status.status).toBe(200);

    return { squads: squadsBody, agents: agentsBody };
  } finally {
    engine?.kill();
  }
}

// These tests are slower — they spawn real engine processes
describe('Engine Discovery — greenfield-empty', () => {
  afterAll(async () => {
    await rm(join(TEST_OUTPUT, 'greenfield-empty'), { recursive: true, force: true });
  });

  test('engine starts with empty project', async () => {
    const result = await testArchetype('empty');
    expect(result.squads.squads.length).toBe(0);
  }, 30_000);
});

describe('Engine Discovery — greenfield-minimal', () => {
  afterAll(async () => {
    await rm(join(TEST_OUTPUT, 'greenfield-minimal'), { recursive: true, force: true });
  });

  test('discovers 1 squad and 1 agent', async () => {
    const result = await testArchetype('minimal');
    expect(result.squads.squads.length).toBeGreaterThanOrEqual(1);
    expect(result.agents.agents.length).toBeGreaterThanOrEqual(1);
  }, 30_000);
});

describe('Engine Discovery — greenfield-standard', () => {
  afterAll(async () => {
    await rm(join(TEST_OUTPUT, 'greenfield-standard'), { recursive: true, force: true });
  });

  test('discovers 3 squads and ~11 agents', async () => {
    const result = await testArchetype('standard');
    expect(result.squads.squads.length).toBe(3);
    expect(result.agents.agents.length).toBeGreaterThanOrEqual(9);
  }, 30_000);
});

describe('Engine Discovery — brownfield-legacy-node', () => {
  afterAll(async () => {
    await rm(join(TEST_OUTPUT, 'brownfield-legacy-node'), { recursive: true, force: true });
  });

  test('engine starts with zero squads/agents', async () => {
    const result = await testArchetype('legacy-node');
    expect(result.squads.squads.length).toBe(0);
    expect(result.agents.agents.length).toBe(0);
  }, 30_000);
});
