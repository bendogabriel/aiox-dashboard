import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runIntegrationTests,
  ALL_INTEGRATION_IDS,
  type TestSuiteResult,
} from '../integration-test-runner';

// ── Mock probeIntegration ─────────────────────────────────

vi.mock('../../hooks/useHealthCheck', () => ({
  probeIntegration: vi.fn(),
}));

// Also mock the integration store since probeIntegration accesses it
vi.mock('../../stores/integrationStore', () => {
  const defaultEntry = { id: 'engine', status: 'disconnected', config: {} };
  const integrations: Record<string, typeof defaultEntry> = {};
  ALL_INTEGRATION_IDS_FOR_MOCK.forEach((id: string) => {
    integrations[id] = { id, status: 'disconnected', config: {} };
  });

  return {
    useIntegrationStore: Object.assign(
      () => ({ integrations }),
      {
        getState: () => ({
          integrations,
          setStatus: vi.fn(),
        }),
      },
    ),
  };
});

// We need the IDs before the mock runs, so inline them
const ALL_INTEGRATION_IDS_FOR_MOCK = [
  'engine',
  'supabase',
  'api-keys',
  'whatsapp',
  'telegram',
  'voice',
  'google-drive',
  'google-calendar',
];

import { probeIntegration } from '../../hooks/useHealthCheck';

const mockedProbe = vi.mocked(probeIntegration);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: all probes succeed quickly
  mockedProbe.mockImplementation(async (id) => ({
    id,
    ok: true,
    msg: 'Connected',
    previousStatus: 'disconnected',
    newStatus: 'connected',
  }));
});

// ── Tests ─────────────────────────────────────────────────

describe('integration-test-runner', () => {
  it('should probe all 8 integrations', async () => {
    const result = await runIntegrationTests();

    expect(result.results).toHaveLength(8);
    expect(mockedProbe).toHaveBeenCalledTimes(8);

    // Verify every integration ID was probed
    const probedIds = result.results.map((r) => r.id);
    for (const id of ALL_INTEGRATION_IDS) {
      expect(probedIds).toContain(id);
    }
  });

  it('should include latency >= 0 for each result', async () => {
    const result = await runIntegrationTests();

    for (const r of result.results) {
      expect(r.latencyMs).toBeGreaterThanOrEqual(0);
      expect(typeof r.latencyMs).toBe('number');
    }
  });

  it('should correctly compute passed/failed counts', async () => {
    // Make 3 integrations fail
    const failIds = new Set(['engine', 'whatsapp', 'telegram']);
    mockedProbe.mockImplementation(async (id) => ({
      id,
      ok: !failIds.has(id),
      msg: failIds.has(id) ? 'Unreachable' : 'Connected',
      previousStatus: 'disconnected',
      newStatus: failIds.has(id) ? 'disconnected' : 'connected',
    }));

    const result = await runIntegrationTests();

    expect(result.summary.passed).toBe(5);
    expect(result.summary.failed).toBe(3);
    expect(result.summary.total).toBe(8);
  });

  it('should produce results in sequential order matching ALL_INTEGRATION_IDS', async () => {
    const callOrder: string[] = [];
    mockedProbe.mockImplementation(async (id) => {
      callOrder.push(id);
      return { id, ok: true, msg: 'ok', previousStatus: 'disconnected', newStatus: 'connected' };
    });

    const result = await runIntegrationTests();

    // Verify probes were called in declared order
    expect(callOrder).toEqual(ALL_INTEGRATION_IDS);
    // Verify results are in the same order
    expect(result.results.map((r) => r.id)).toEqual(ALL_INTEGRATION_IDS);
  });

  it('should compute totalDurationMs and avgLatencyMs in summary', async () => {
    const result = await runIntegrationTests();

    expect(result.summary.totalDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.summary.avgLatencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.summary.totalDurationMs).toBe('number');
    expect(typeof result.summary.avgLatencyMs).toBe('number');
  });

  it('should include valid ISO timestamps for startedAt and completedAt', async () => {
    const result = await runIntegrationTests();

    expect(() => new Date(result.startedAt)).not.toThrow();
    expect(() => new Date(result.completedAt)).not.toThrow();

    const start = new Date(result.startedAt).getTime();
    const end = new Date(result.completedAt).getTime();
    expect(end).toBeGreaterThanOrEqual(start);
  });

  it('should fire onProgress callback for each probe', async () => {
    const progressCalls: Array<{ index: number; id: string }> = [];

    await runIntegrationTests((index, id) => {
      progressCalls.push({ index, id });
    });

    expect(progressCalls).toHaveLength(8);
    expect(progressCalls[0]).toEqual({ index: 0, id: ALL_INTEGRATION_IDS[0] });
    expect(progressCalls[7]).toEqual({ index: 7, id: ALL_INTEGRATION_IDS[7] });
  });

  it('should handle probe errors gracefully', async () => {
    mockedProbe.mockImplementation(async (id) => {
      if (id === 'engine') {
        throw new Error('Network timeout');
      }
      return { id, ok: true, msg: 'ok', previousStatus: 'disconnected', newStatus: 'connected' };
    });

    const result = await runIntegrationTests();

    // Should still have 8 results
    expect(result.results).toHaveLength(8);

    // Engine should have failed with the error message
    const engineResult = result.results.find((r) => r.id === 'engine');
    expect(engineResult).toBeDefined();
    expect(engineResult!.ok).toBe(false);
    expect(engineResult!.message).toBe('Network timeout');

    // Other probes should still succeed
    expect(result.summary.passed).toBe(7);
    expect(result.summary.failed).toBe(1);
  });

  it('should report all passed when all probes succeed', async () => {
    const result: TestSuiteResult = await runIntegrationTests();

    expect(result.summary.passed).toBe(8);
    expect(result.summary.failed).toBe(0);
  });

  it('should include a timestamp per result', async () => {
    const before = Date.now();
    const result = await runIntegrationTests();
    const after = Date.now();

    for (const r of result.results) {
      expect(r.timestamp).toBeGreaterThanOrEqual(before);
      expect(r.timestamp).toBeLessThanOrEqual(after);
    }
  });
});
