/**
 * Convergence Engine + Budget Controller — Story 8.5
 *
 * Intelligent stop conditions and budget enforcement.
 * Prevents programs from wasting resources on diminishing returns.
 *
 * 5 stop conditions:
 * 1. max_iterations reached
 * 2. stale_iterations (N consecutive without improvement)
 * 3. target_value achieved
 * 4. max_total_hours exceeded
 * 5. max_cost_usd exceeded
 */

import { log } from '../lib/logger';
import type { ExperimentEntry } from './decision-journal';

// ── Types ──

export interface ConvergenceConfig {
  maxIterations: number;
  staleIterations: number;      // stop after N iterations without improvement
  minDeltaPercent: number;      // minimum % improvement to count as "better"
  targetValue: number | null;   // optional absolute target
}

export interface BudgetConfig {
  maxTotalHours: number;
  maxTokens: number;
  maxCostUsd: number;
  // Token pricing (per 1K tokens)
  inputPricePer1K: number;      // default: $0.003 (Sonnet)
  outputPricePer1K: number;     // default: $0.015 (Sonnet)
}

export interface ConvergenceResult {
  shouldStop: boolean;
  reason: ConvergenceReason | null;
  details: string;
}

export type ConvergenceReason =
  | 'max_iterations'
  | 'stale_iterations'
  | 'target_reached'
  | 'time_exceeded'
  | 'cost_exceeded'
  | 'token_exceeded'
  | 'consecutive_errors';

export interface BudgetUsage {
  tokensUsed: number;
  estimatedCost: number;
  wallClockMs: number;
  wallClockHours: number;
  tokenBudgetPct: number;
  costBudgetPct: number;
  timeBudgetPct: number;
}

export interface BudgetWarning {
  metric: 'tokens' | 'cost' | 'time';
  currentPct: number;
  threshold: number;
}

// ── Convergence Engine ──

export class ConvergenceEngine {
  private config: ConvergenceConfig;

  constructor(config: ConvergenceConfig) {
    this.config = config;
  }

  /**
   * Check all convergence conditions.
   * Returns shouldStop=true if any condition is met.
   */
  check(
    currentIteration: number,
    experiments: ExperimentEntry[],
    bestMetric: number | null,
    metricDirection: 'minimize' | 'maximize',
  ): ConvergenceResult {
    // 1. Max iterations
    if (currentIteration >= this.config.maxIterations) {
      return {
        shouldStop: true,
        reason: 'max_iterations',
        details: `Reached maximum iterations (${this.config.maxIterations})`,
      };
    }

    // 2. Stale iterations (consecutive non-improving)
    if (this.isStale(experiments)) {
      return {
        shouldStop: true,
        reason: 'stale_iterations',
        details: `No improvement in last ${this.config.staleIterations} iterations`,
      };
    }

    // 3. Target value reached
    if (this.config.targetValue !== null && bestMetric !== null) {
      const targetReached = metricDirection === 'minimize'
        ? bestMetric <= this.config.targetValue
        : bestMetric >= this.config.targetValue;

      if (targetReached) {
        return {
          shouldStop: true,
          reason: 'target_reached',
          details: `Target metric ${this.config.targetValue} reached (current: ${bestMetric})`,
        };
      }
    }

    // 4. Consecutive errors (circuit breaker)
    const consecutiveErrors = this.getConsecutiveErrors(experiments);
    if (consecutiveErrors >= 5) {
      return {
        shouldStop: true,
        reason: 'consecutive_errors',
        details: `${consecutiveErrors} consecutive errors — circuit breaker triggered`,
      };
    }

    return { shouldStop: false, reason: null, details: '' };
  }

  /** Check if last N iterations had no improvement */
  private isStale(experiments: ExperimentEntry[]): boolean {
    if (experiments.length < this.config.staleIterations) return false;

    const recent = experiments.slice(-this.config.staleIterations);
    return recent.every((e) => {
      if (e.status === 'error' || e.status === 'skipped') return true;
      if (e.status === 'discard') return true;
      // Even if "keep", check if delta was meaningful
      if (e.deltaPct !== null && Math.abs(e.deltaPct) < this.config.minDeltaPercent) return true;
      return false;
    });
  }

  /** Count consecutive errors from the end */
  private getConsecutiveErrors(experiments: ExperimentEntry[]): number {
    let count = 0;
    for (let i = experiments.length - 1; i >= 0; i--) {
      if (experiments[i].status === 'error') count++;
      else break;
    }
    return count;
  }
}

// ── Budget Controller ──

export class BudgetController {
  private config: BudgetConfig;
  private usage: Map<string, { tokens: number; costUsd: number; startTime: number }> = new Map();
  private warningEmitted: Map<string, Set<string>> = new Map();

  constructor(config: BudgetConfig) {
    this.config = config;
  }

  /** Initialize tracking for a program */
  init(programId: string): void {
    this.usage.set(programId, { tokens: 0, costUsd: 0, startTime: Date.now() });
    this.warningEmitted.set(programId, new Set());
  }

  /** Track token usage for an iteration */
  track(programId: string, tokensUsed: number): void {
    const usage = this.usage.get(programId);
    if (!usage) return;

    // Estimate cost (assume 50/50 input/output split for simplicity)
    const inputTokens = tokensUsed * 0.5;
    const outputTokens = tokensUsed * 0.5;
    const cost = (inputTokens / 1000) * this.config.inputPricePer1K
               + (outputTokens / 1000) * this.config.outputPricePer1K;

    usage.tokens += tokensUsed;
    usage.costUsd += cost;
  }

  /** Check if budget allows another iteration */
  canAffordIteration(programId: string, estimatedTokensPerIteration: number): ConvergenceResult {
    const usage = this.usage.get(programId);
    if (!usage) return { shouldStop: false, reason: null, details: '' };

    // Token budget
    if (usage.tokens + estimatedTokensPerIteration > this.config.maxTokens) {
      return {
        shouldStop: true,
        reason: 'token_exceeded',
        details: `Token budget exhausted (${usage.tokens}/${this.config.maxTokens})`,
      };
    }

    // Cost budget
    const estimatedCost = (estimatedTokensPerIteration / 1000) * (this.config.inputPricePer1K + this.config.outputPricePer1K) / 2;
    if (usage.costUsd + estimatedCost > this.config.maxCostUsd) {
      return {
        shouldStop: true,
        reason: 'cost_exceeded',
        details: `Cost budget exhausted ($${usage.costUsd.toFixed(2)}/$${this.config.maxCostUsd})`,
      };
    }

    // Time budget
    const elapsedHours = (Date.now() - usage.startTime) / (1000 * 60 * 60);
    if (elapsedHours >= this.config.maxTotalHours) {
      return {
        shouldStop: true,
        reason: 'time_exceeded',
        details: `Time budget exceeded (${elapsedHours.toFixed(1)}h/${this.config.maxTotalHours}h)`,
      };
    }

    return { shouldStop: false, reason: null, details: '' };
  }

  /** Get current usage summary */
  getUsage(programId: string): BudgetUsage {
    const usage = this.usage.get(programId);
    if (!usage) {
      return {
        tokensUsed: 0, estimatedCost: 0, wallClockMs: 0, wallClockHours: 0,
        tokenBudgetPct: 0, costBudgetPct: 0, timeBudgetPct: 0,
      };
    }

    const wallClockMs = Date.now() - usage.startTime;
    const wallClockHours = wallClockMs / (1000 * 60 * 60);

    return {
      tokensUsed: usage.tokens,
      estimatedCost: usage.costUsd,
      wallClockMs,
      wallClockHours,
      tokenBudgetPct: this.config.maxTokens > 0 ? (usage.tokens / this.config.maxTokens) * 100 : 0,
      costBudgetPct: this.config.maxCostUsd > 0 ? (usage.costUsd / this.config.maxCostUsd) * 100 : 0,
      timeBudgetPct: this.config.maxTotalHours > 0 ? (wallClockHours / this.config.maxTotalHours) * 100 : 0,
    };
  }

  /** Check for budget warnings (>80% of any limit) and return new warnings only */
  checkWarnings(programId: string): BudgetWarning[] {
    const usage = this.getUsage(programId);
    const emitted = this.warningEmitted.get(programId) ?? new Set();
    const warnings: BudgetWarning[] = [];
    const THRESHOLD = 80;

    if (usage.tokenBudgetPct >= THRESHOLD && !emitted.has('tokens')) {
      warnings.push({ metric: 'tokens', currentPct: usage.tokenBudgetPct, threshold: THRESHOLD });
      emitted.add('tokens');
    }
    if (usage.costBudgetPct >= THRESHOLD && !emitted.has('cost')) {
      warnings.push({ metric: 'cost', currentPct: usage.costBudgetPct, threshold: THRESHOLD });
      emitted.add('cost');
    }
    if (usage.timeBudgetPct >= THRESHOLD && !emitted.has('time')) {
      warnings.push({ metric: 'time', currentPct: usage.timeBudgetPct, threshold: THRESHOLD });
      emitted.add('time');
    }

    if (warnings.length > 0) {
      this.warningEmitted.set(programId, emitted);
      log.warn('Budget warning', { programId, warnings });
    }

    return warnings;
  }

  /** Estimate tokens per iteration (moving average of last 5) */
  estimateIterationTokens(experiments: ExperimentEntry[]): number {
    const recent = experiments.slice(-5).filter((e) => e.tokensUsed > 0);
    if (recent.length === 0) return 10_000; // conservative default
    return Math.ceil(recent.reduce((sum, e) => sum + e.tokensUsed, 0) / recent.length);
  }

  /** Remove tracking for completed program */
  cleanup(programId: string): void {
    this.usage.delete(programId);
    this.warningEmitted.delete(programId);
  }
}
