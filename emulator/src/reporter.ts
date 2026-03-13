// ── Test Reporter ──
// Collects and formats test metrics.

import type { TestResult, EndpointResult, TimingMetrics } from './types';

export function formatTestResult(result: TestResult): string {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  const lines: string[] = [
    `\n${status}  ${result.archetype}`,
    `  Engine startup: ${result.timing.engineStartup.toFixed(0)}ms`,
    `  Endpoints avg: ${result.timing.endpointAvg.toFixed(0)}ms, max: ${result.timing.endpointMax.toFixed(0)}ms`,
  ];

  for (const ep of result.endpoints) {
    const epStatus = ep.passed ? '  ✓' : '  ✗';
    lines.push(`${epStatus} ${ep.path} (${ep.responseTime.toFixed(0)}ms) → ${ep.status}`);
    if (!ep.passed) {
      lines.push(`    expected: ${JSON.stringify(ep.expected)}`);
      lines.push(`    actual:   ${JSON.stringify(ep.actual)}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push('  Errors:');
    for (const err of result.errors) {
      lines.push(`    - ${err}`);
    }
  }

  lines.push(`  Total: ${result.timing.totalTestTime.toFixed(0)}ms`);
  return lines.join('\n');
}

export function computeTimingMetrics(
  engineStartup: number,
  endpoints: EndpointResult[],
  totalTestTime: number
): TimingMetrics {
  const times = endpoints.map(e => e.responseTime);
  return {
    engineStartup,
    totalTestTime,
    endpointAvg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    endpointMax: times.length ? Math.max(...times) : 0,
  };
}

export function formatSummary(results: TestResult[]): string {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  const lines: string[] = [
    '\n═══════════════════════════════════',
    `  EMULATOR TEST SUMMARY`,
    `  ${passed}/${total} passed, ${failed} failed`,
    '═══════════════════════════════════',
  ];

  if (failed > 0) {
    lines.push('\n  Failed archetypes:');
    for (const r of results.filter(r => !r.passed)) {
      lines.push(`    - ${r.archetype}: ${r.errors.join(', ')}`);
    }
  }

  return lines.join('\n');
}
