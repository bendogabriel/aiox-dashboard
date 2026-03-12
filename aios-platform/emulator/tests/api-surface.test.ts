// ── Integration Test: API Surface ──
// Tests all dashboard-facing endpoints against a standard project.

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { generate } from '../src/generator';
import { startEngine, fetchEndpoint } from '../src/runner';
import { getArchetype } from '../src/archetypes/index';
import { join } from 'path';
import { rm } from 'fs/promises';
import type { EngineProcess } from '../src/types';

const TEST_OUTPUT = join(import.meta.dir, '..', 'output', '__api-test__');
const PORT = 4097;
let engine: EngineProcess;

beforeAll(async () => {
  const spec = getArchetype('standard')!;
  const result = await generate(spec, TEST_OUTPUT);
  engine = await startEngine({
    projectPath: result.projectPath,
    port: PORT,
    timeout: 15_000,
  });
}, 30_000);

afterAll(async () => {
  engine?.kill();
  await rm(TEST_OUTPUT, { recursive: true, force: true });
});

describe('API Surface — /health', () => {
  test('returns 200 with status', async () => {
    const { status, body } = await fetchEndpoint(engine.baseUrl, '/health');
    expect(status).toBe(200);
    const data = body as Record<string, unknown>;
    expect(data.status).toBeTruthy();
  });
});

describe('API Surface — /squads', () => {
  test('returns array of squads', async () => {
    const { status, body } = await fetchEndpoint(engine.baseUrl, '/squads');
    expect(status).toBe(200);
    const data = body as { squads: unknown[]; total: number };
    expect(Array.isArray(data.squads)).toBe(true);
    expect(data.squads.length).toBeGreaterThan(0);
  });

  test('each squad has required fields', async () => {
    const { body } = await fetchEndpoint(engine.baseUrl, '/squads');
    const data = body as { squads: Record<string, unknown>[] };
    for (const squad of data.squads) {
      expect(squad.id).toBeTruthy();
      expect(squad.name).toBeTruthy();
    }
  });
});

describe('API Surface — /agents', () => {
  test('returns array of agents', async () => {
    const { status, body } = await fetchEndpoint(engine.baseUrl, '/agents');
    expect(status).toBe(200);
    const data = body as { agents: unknown[]; total: number };
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agents.length).toBeGreaterThan(0);
  });

  test('each agent has id, name, squad', async () => {
    const { body } = await fetchEndpoint(engine.baseUrl, '/agents');
    const data = body as { agents: Record<string, unknown>[] };
    for (const agent of data.agents) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.squad).toBeTruthy();
    }
  });
});

describe('API Surface — /agents/status', () => {
  test('returns status array and counts', async () => {
    const { status, body } = await fetchEndpoint(engine.baseUrl, '/agents/status');
    expect(status).toBe(200);
    const data = body as { agents: unknown[]; totalCount: number };
    expect(Array.isArray(data.agents)).toBe(true);
    expect(typeof data.totalCount).toBe('number');
  });
});

describe('API Surface — /agents/squad/:squadId', () => {
  test('returns agents for specific squad', async () => {
    const { status, body } = await fetchEndpoint(engine.baseUrl, '/agents/squad/engineering');
    expect(status).toBe(200);
    const data = body as { agents: unknown[] };
    expect(Array.isArray(data.agents)).toBe(true);
  });
});

describe('API Surface — /execute/workflows', () => {
  test('returns workflows array', async () => {
    const { status, body } = await fetchEndpoint(engine.baseUrl, '/execute/workflows');
    expect(status).toBe(200);
    const data = body as { workflows: unknown[] };
    expect(Array.isArray(data.workflows)).toBe(true);
  });
});
