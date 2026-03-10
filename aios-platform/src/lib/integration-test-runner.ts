/**
 * Integration Test Runner — P12 Integration Test Suite
 *
 * Runs all 8 integration probes sequentially, measuring latency
 * per probe and computing an overall summary.
 */

import { probeIntegration } from '../hooks/useHealthCheck';
import type { IntegrationId } from '../stores/integrationStore';

// ── Types ─────────────────────────────────────────────────

export interface IntegrationTestResult {
  id: IntegrationId;
  ok: boolean;
  message: string;
  latencyMs: number;
  timestamp: number;
}

export interface TestSuiteResult {
  results: IntegrationTestResult[];
  summary: {
    passed: number;
    failed: number;
    total: number;
    totalDurationMs: number;
    avgLatencyMs: number;
  };
  startedAt: string;
  completedAt: string;
}

// ── All integration IDs in probe order ────────────────────

export const ALL_INTEGRATION_IDS: IntegrationId[] = [
  'engine',
  'supabase',
  'api-keys',
  'whatsapp',
  'telegram',
  'voice',
  'google-drive',
  'google-calendar',
];

// ── Runner ────────────────────────────────────────────────

export type OnProgress = (index: number, id: IntegrationId) => void;

/**
 * Run all integration probes sequentially.
 *
 * @param onProgress — optional callback fired before each probe starts
 * @returns A TestSuiteResult with per-integration latency and overall summary
 */
export async function runIntegrationTests(
  onProgress?: OnProgress,
): Promise<TestSuiteResult> {
  const startedAt = new Date().toISOString();
  const suiteStart = performance.now();
  const results: IntegrationTestResult[] = [];

  for (let i = 0; i < ALL_INTEGRATION_IDS.length; i++) {
    const id = ALL_INTEGRATION_IDS[i];
    onProgress?.(i, id);

    const probeStart = performance.now();
    let ok = false;
    let message = 'Unknown error';

    try {
      const result = await probeIntegration(id);
      ok = result.ok;
      message = result.msg;
    } catch (err: unknown) {
      ok = false;
      message = err instanceof Error ? err.message : 'Probe threw an exception';
    }

    const latencyMs = Math.round(performance.now() - probeStart);

    results.push({
      id,
      ok,
      message,
      latencyMs,
      timestamp: Date.now(),
    });
  }

  const totalDurationMs = Math.round(performance.now() - suiteStart);
  const completedAt = new Date().toISOString();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const total = results.length;
  const sumLatency = results.reduce((sum, r) => sum + r.latencyMs, 0);
  const avgLatencyMs = total > 0 ? Math.round(sumLatency / total) : 0;

  return {
    results,
    summary: {
      passed,
      failed,
      total,
      totalDurationMs,
      avgLatencyMs,
    },
    startedAt,
    completedAt,
  };
}
