#!/usr/bin/env node

/**
 * Dashboard Metrics — Continuous Quality Gate
 *
 * Measures:
 *   1. `:any` count in TypeScript files (type safety)
 *   2. Test count from vitest
 *   3. Build output size (.next/)
 *   4. `export *` barrel exports (tree-shaking risk)
 *
 * Usage:
 *   node scripts/metrics.mjs          # print metrics
 *   node scripts/metrics.mjs --ci     # print + enforce thresholds (exit 1 on regression)
 *   node scripts/metrics.mjs --save   # save current snapshot as baseline
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASELINE_PATH = join(ROOT, 'scripts', 'metrics-baseline.json');

const isCI = process.argv.includes('--ci');
const isSave = process.argv.includes('--save');

// ── Collectors ─────────────────────────────────────────

function countAnyTypes() {
  try {
    const output = execSync(
      `grep -r ": any" --include="*.ts" --include="*.tsx" src/ | grep -v node_modules | grep -v ".test." | grep -v __tests__ || true`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}

function countTests() {
  try {
    const output = execSync('npx vitest run --reporter=json 2>/dev/null', {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 60000,
    });
    // vitest json reporter outputs JSON to stdout
    const lines = output.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const data = JSON.parse(lines[i]);
        if (data.numTotalTests !== undefined) return data.numTotalTests;
      } catch { /* not JSON line */ }
    }
    return -1;
  } catch {
    // Fallback: run vitest and parse summary line
    try {
      const output = execSync('npx vitest run 2>&1', {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 60000,
      });
      const match = output.match(/(\d+)\s+passed/);
      return match ? parseInt(match[1], 10) : -1;
    } catch (e) {
      // Even on test failure vitest exits non-zero, parse stderr
      const out = e.stdout || e.stderr || '';
      const match = out.match(/(\d+)\s+passed/);
      return match ? parseInt(match[1], 10) : -1;
    }
  }
}

function countBarrelExports() {
  try {
    const output = execSync(
      `grep -r "export \\*" --include="index.ts" --include="index.tsx" src/ || true`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}

function getBuildSize() {
  try {
    const output = execSync('du -sk .next/ 2>/dev/null || echo "0"', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return parseInt(output.trim().split('\t')[0], 10); // KB
  } catch {
    return -1;
  }
}

// ── Main ───────────────────────────────────────────────

const metrics = {
  anyCount: countAnyTypes(),
  testCount: countTests(),
  barrelExports: countBarrelExports(),
  buildSizeKB: getBuildSize(),
  timestamp: new Date().toISOString(),
};

// Print report
console.log('\n┌─────────────────────────────────────┐');
console.log('│    Dashboard Quality Metrics        │');
console.log('├─────────────────────────────────────┤');
console.log(`│  :any count        │  ${String(metrics.anyCount).padStart(8)}    │`);
console.log(`│  Test count        │  ${String(metrics.testCount).padStart(8)}    │`);
console.log(`│  export * barrels  │  ${String(metrics.barrelExports).padStart(8)}    │`);
console.log(`│  Build size (KB)   │  ${String(metrics.buildSizeKB).padStart(8)}    │`);
console.log('└─────────────────────────────────────┘\n');

// Save baseline
if (isSave) {
  writeFileSync(BASELINE_PATH, JSON.stringify(metrics, null, 2) + '\n');
  console.log(`Baseline saved to ${BASELINE_PATH}`);
  process.exit(0);
}

// CI enforcement
if (isCI) {
  let failures = 0;

  if (existsSync(BASELINE_PATH)) {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));

    // :any count must not increase
    if (metrics.anyCount > baseline.anyCount) {
      console.error(`FAIL: :any count increased (${baseline.anyCount} → ${metrics.anyCount})`);
      failures++;
    }

    // Test count must not decrease
    if (metrics.testCount < baseline.testCount && metrics.testCount !== -1) {
      console.error(`FAIL: Test count decreased (${baseline.testCount} → ${metrics.testCount})`);
      failures++;
    }

    // export * must not increase
    if (metrics.barrelExports > baseline.barrelExports) {
      console.error(`FAIL: export * barrels increased (${baseline.barrelExports} → ${metrics.barrelExports})`);
      failures++;
    }

    if (failures === 0) {
      console.log('All metrics within bounds.');
    }
  } else {
    console.log('No baseline found. Run `node scripts/metrics.mjs --save` to create one.');
    console.log('Skipping threshold checks (first run).');
  }

  process.exit(failures > 0 ? 1 : 0);
}
