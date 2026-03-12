/**
 * Decision Journal (Experiment Ledger) — Story 8.4
 *
 * Structured, queryable experiment log persisted as JSONL.
 * Append-only, survives git resets (stored in .aios/ which is git-ignored).
 *
 * Inspired by autoresearch experiment tracking + karpathy's "Decision Journal" concept.
 */

import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { log } from '../lib/logger';

export interface ExperimentEntry {
  event: 'experiment';
  iteration: number;
  timestamp: string;
  hypothesis: string;
  commitSha: string | null;
  metricBefore: number | null;
  metricAfter: number | null;
  delta: number | null;
  deltaPct: number | null;
  status: 'keep' | 'discard' | 'error' | 'skipped';
  filesModified: string[];
  durationMs: number;
  tokensUsed: number;
  errorMessage?: string;
  pipelineStep?: string;
}

export interface PatternAnalysis {
  /** Strategy categories and their success rates */
  strategies: Array<{
    category: string;
    total: number;
    keeps: number;
    successRate: number;
    avgDelta: number;
  }>;
  /** Files most frequently modified */
  topFiles: Array<{ file: string; total: number; keeps: number }>;
  /** Overall stats */
  totalExperiments: number;
  keepCount: number;
  discardCount: number;
  errorCount: number;
  keepRate: number;
}

export class DecisionJournal {
  private filePath: string;
  private cache: ExperimentEntry[] | null = null;

  constructor(programName: string, baseDir: string = '.aios/overnight') {
    this.filePath = `${baseDir}/${programName}/ledger.jsonl`;
    this.ensureDir();
  }

  /** Append an experiment entry to the journal */
  append(entry: ExperimentEntry): void {
    const line = JSON.stringify(entry) + '\n';
    appendFileSync(this.filePath, line, 'utf-8');
    // Invalidate cache
    this.cache = null;
    log.info('Decision journal: entry appended', {
      iteration: entry.iteration,
      status: entry.status,
      delta: entry.delta,
    });
  }

  /** Get all entries */
  getAll(): ExperimentEntry[] {
    if (this.cache) return this.cache;
    this.cache = this.readEntries();
    return this.cache;
  }

  /** Get last N entries */
  getLast(n: number): ExperimentEntry[] {
    return this.getAll().slice(-n);
  }

  /** Filter entries by status */
  getByStatus(status: ExperimentEntry['status']): ExperimentEntry[] {
    return this.getAll().filter((e) => e.status === status);
  }

  /** Get the entry with the best metric */
  getBest(): ExperimentEntry | null {
    const keeps = this.getByStatus('keep');
    if (keeps.length === 0) return null;

    return keeps.reduce((best, entry) => {
      if (entry.metricAfter === null) return best;
      if (best.metricAfter === null) return entry;
      // We don't know direction here, so return the one with largest |delta|
      return Math.abs(entry.delta ?? 0) > Math.abs(best.delta ?? 0) ? entry : best;
    });
  }

  /** Get experiments that almost improved (within threshold) */
  getNearMisses(thresholdPct: number = 1.0): ExperimentEntry[] {
    return this.getAll().filter((e) => {
      if (e.status !== 'discard' || e.deltaPct === null) return false;
      return Math.abs(e.deltaPct) <= thresholdPct;
    });
  }

  /** Analyze patterns in experiment history */
  getPatterns(): PatternAnalysis {
    const entries = this.getAll();
    const total = entries.length;
    const keeps = entries.filter((e) => e.status === 'keep');
    const discards = entries.filter((e) => e.status === 'discard');
    const errors = entries.filter((e) => e.status === 'error');

    // Strategy analysis (group by first word of hypothesis)
    const strategyMap = new Map<string, { total: number; keeps: number; deltas: number[] }>();
    for (const entry of entries) {
      if (!entry.hypothesis) continue;
      const category = extractStrategyCategory(entry.hypothesis);
      const existing = strategyMap.get(category) ?? { total: 0, keeps: 0, deltas: [] };
      existing.total++;
      if (entry.status === 'keep') existing.keeps++;
      if (entry.delta !== null) existing.deltas.push(entry.delta);
      strategyMap.set(category, existing);
    }

    const strategies = Array.from(strategyMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        keeps: data.keeps,
        successRate: data.total > 0 ? data.keeps / data.total : 0,
        avgDelta: data.deltas.length > 0
          ? data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length
          : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate);

    // File frequency analysis
    const fileMap = new Map<string, { total: number; keeps: number }>();
    for (const entry of entries) {
      for (const file of entry.filesModified) {
        const existing = fileMap.get(file) ?? { total: 0, keeps: 0 };
        existing.total++;
        if (entry.status === 'keep') existing.keeps++;
        fileMap.set(file, existing);
      }
    }

    const topFiles = Array.from(fileMap.entries())
      .map(([file, data]) => ({ file, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      strategies,
      topFiles,
      totalExperiments: total,
      keepCount: keeps.length,
      discardCount: discards.length,
      errorCount: errors.length,
      keepRate: total > 0 ? keeps.length / total : 0,
    };
  }

  /**
   * Generate concise summary for agent context injection.
   * Kept under ~500 tokens to avoid inflating context window.
   */
  summary(bestMetric: number | null, baselineMetric: number | null): string {
    const entries = this.getAll();
    if (entries.length === 0) {
      return '## Experiment Journal\nNo experiments yet. This is the first iteration.';
    }

    const patterns = this.getPatterns();
    const nearMisses = this.getNearMisses(1.0);
    const lastEntries = this.getLast(3);
    const best = this.getBest();

    const lines: string[] = ['## Experiment Journal'];

    // Overview
    const improvement = baselineMetric && bestMetric
      ? `${((bestMetric - baselineMetric) / Math.abs(baselineMetric) * 100).toFixed(1)}%`
      : 'N/A';
    lines.push(`Iterations: ${entries.length} | Keep rate: ${patterns.keepCount}/${entries.length} (${(patterns.keepRate * 100).toFixed(1)}%)`);
    lines.push(`Baseline: ${baselineMetric ?? 'N/A'} | Best: ${bestMetric ?? 'N/A'} | Improvement: ${improvement}`);

    if (best) {
      lines.push(`Best result: iteration ${best.iteration} — "${best.hypothesis.slice(0, 60)}"`);
    }

    // Top strategies
    if (patterns.strategies.length > 0) {
      const topStrategies = patterns.strategies.slice(0, 3)
        .map((s) => `${s.category} (${s.keeps}/${s.total})`)
        .join(', ');
      lines.push(`Top strategies: ${topStrategies}`);
    }

    // Near misses
    if (nearMisses.length > 0) {
      const nearMissStr = nearMisses.slice(0, 2)
        .map((e) => `"${e.hypothesis.slice(0, 40)}" (${e.deltaPct?.toFixed(2)}%)`)
        .join(', ');
      lines.push(`Near-misses worth exploring: ${nearMissStr}`);
    }

    // Recent attempts (to avoid repeats)
    if (lastEntries.length > 0) {
      lines.push('Recent attempts:');
      for (const entry of lastEntries) {
        const icon = entry.status === 'keep' ? 'KEEP' : entry.status === 'error' ? 'ERROR' : 'DISCARD';
        lines.push(`  [${icon}] #${entry.iteration}: "${entry.hypothesis.slice(0, 50)}"`);
      }
    }

    // Avoid repeats
    const discardedHypotheses = entries
      .filter((e) => e.status === 'discard')
      .map((e) => e.hypothesis.slice(0, 40));
    if (discardedHypotheses.length > 0) {
      lines.push(`Avoid (already tried, no improvement): ${discardedHypotheses.slice(-5).join('; ')}`);
    }

    return lines.join('\n');
  }

  /** Mirror entry to SQLite experiments table */
  mirrorToSQLite(db: { run: (sql: string, ...params: unknown[]) => void }, programId: string, entry: ExperimentEntry): void {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.run(
      `INSERT INTO experiments (id, program_id, iteration, hypothesis, commit_sha, metric_before, metric_after, delta, delta_pct, status, files_modified, duration_ms, tokens_used, error_message, pipeline_step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      programId,
      entry.iteration,
      entry.hypothesis,
      entry.commitSha,
      entry.metricBefore,
      entry.metricAfter,
      entry.delta,
      entry.deltaPct,
      entry.status,
      JSON.stringify(entry.filesModified),
      entry.durationMs,
      entry.tokensUsed,
      entry.errorMessage ?? null,
      entry.pipelineStep ?? null,
    );
  }

  // ── Private ──

  private ensureDir(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private readEntries(): ExperimentEntry[] {
    if (!existsSync(this.filePath)) return [];
    try {
      const content = readFileSync(this.filePath, 'utf-8');
      return content
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ExperimentEntry);
    } catch (err) {
      log.warn('Decision journal: failed to read', { error: (err as Error).message });
      return [];
    }
  }
}

// ── Helpers ──

/** Extract strategy category from hypothesis text */
function extractStrategyCategory(hypothesis: string): string {
  const lower = hypothesis.toLowerCase();
  const categories = [
    'lazy-load', 'tree-shake', 'code-split', 'remove-unused', 'inline',
    'memoize', 'cache', 'debounce', 'virtualize', 'compress',
    'refactor', 'simplify', 'extract', 'merge', 'deduplicate',
    'fix', 'test', 'type', 'lint', 'security',
  ];
  for (const cat of categories) {
    if (lower.includes(cat)) return cat;
  }
  // Fallback: first 2 words
  return hypothesis.split(/\s+/).slice(0, 2).join('-').toLowerCase();
}
