/**
 * Circuit Breaker — P17
 *
 * Implements the circuit breaker pattern for integration probes.
 * States: CLOSED (normal) → OPEN (failing, stop probing) → HALF_OPEN (retry one)
 *
 * After N consecutive failures, the breaker opens and stops probing
 * for a cooldown period. After cooldown, it enters half-open state
 * and allows a single probe. If that succeeds, it closes. If not, re-opens.
 */

import type { IntegrationId } from '../stores/integrationStore';

// ── Types ─────────────────────────────────────────────────

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  /** Failures before opening (default 5) */
  failureThreshold: number;
  /** Cooldown in ms before half-open (default 60000 = 1min) */
  cooldownMs: number;
  /** Max cooldown after repeated opens (default 300000 = 5min) */
  maxCooldownMs: number;
}

interface BreakerState {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  openedAt: number;
  consecutiveOpens: number;
}

// ── Default config ───────────────────────────────────────

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 60_000,
  maxCooldownMs: 300_000,
};

// ── Circuit Breaker Manager ──────────────────────────────

export class CircuitBreakerManager {
  private breakers: Map<IntegrationId, BreakerState> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getBreaker(id: IntegrationId): BreakerState {
    if (!this.breakers.has(id)) {
      this.breakers.set(id, {
        state: 'closed',
        failures: 0,
        lastFailure: 0,
        openedAt: 0,
        consecutiveOpens: 0,
      });
    }
    return this.breakers.get(id)!;
  }

  /**
   * Check if a probe is allowed for this integration.
   */
  canProbe(id: IntegrationId): boolean {
    const breaker = this.getBreaker(id);

    switch (breaker.state) {
      case 'closed':
        return true;

      case 'open': {
        // Check if cooldown has elapsed
        const cooldown = this.getCooldown(breaker);
        if (Date.now() - breaker.openedAt >= cooldown) {
          // Transition to half-open
          breaker.state = 'half_open';
          return true;
        }
        return false;
      }

      case 'half_open':
        return true;
    }
  }

  /**
   * Record a probe result.
   */
  recordResult(id: IntegrationId, ok: boolean): void {
    const breaker = this.getBreaker(id);

    if (ok) {
      // Success → close the circuit
      breaker.state = 'closed';
      breaker.failures = 0;
      breaker.consecutiveOpens = 0;
    } else {
      breaker.failures += 1;
      breaker.lastFailure = Date.now();

      if (breaker.state === 'half_open') {
        // Half-open failure → re-open
        breaker.state = 'open';
        breaker.openedAt = Date.now();
        breaker.consecutiveOpens += 1;
      } else if (breaker.failures >= this.config.failureThreshold) {
        // Threshold reached → open
        breaker.state = 'open';
        breaker.openedAt = Date.now();
        breaker.consecutiveOpens += 1;
      }
    }
  }

  /**
   * Get the current state of a breaker.
   */
  getState(id: IntegrationId): CircuitState {
    const breaker = this.getBreaker(id);

    // Auto-transition open → half_open if cooldown elapsed
    if (breaker.state === 'open') {
      const cooldown = this.getCooldown(breaker);
      if (Date.now() - breaker.openedAt >= cooldown) {
        breaker.state = 'half_open';
      }
    }

    return breaker.state;
  }

  /**
   * Get remaining cooldown in ms (0 if not in open state).
   */
  getRemainingCooldown(id: IntegrationId): number {
    const breaker = this.getBreaker(id);
    if (breaker.state !== 'open') return 0;
    const cooldown = this.getCooldown(breaker);
    const elapsed = Date.now() - breaker.openedAt;
    return Math.max(0, cooldown - elapsed);
  }

  /**
   * Get failure count for an integration.
   */
  getFailureCount(id: IntegrationId): number {
    return this.getBreaker(id).failures;
  }

  /**
   * Force reset a breaker to closed state.
   */
  reset(id: IntegrationId): void {
    this.breakers.set(id, {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      openedAt: 0,
      consecutiveOpens: 0,
    });
  }

  /**
   * Reset all breakers.
   */
  resetAll(): void {
    this.breakers.clear();
  }

  /**
   * Get all breaker statuses.
   */
  getAllStatuses(): Map<IntegrationId, { state: CircuitState; failures: number; cooldownRemaining: number }> {
    const result = new Map<IntegrationId, { state: CircuitState; failures: number; cooldownRemaining: number }>();
    for (const [id] of this.breakers) {
      result.set(id, {
        state: this.getState(id),
        failures: this.getFailureCount(id),
        cooldownRemaining: this.getRemainingCooldown(id),
      });
    }
    return result;
  }

  // ── Private ────────────────────────────────────────────

  private getCooldown(breaker: BreakerState): number {
    // Exponential cooldown: base * 2^(consecutiveOpens-1), capped at max
    const multiplier = Math.pow(2, Math.max(0, breaker.consecutiveOpens - 1));
    return Math.min(this.config.cooldownMs * multiplier, this.config.maxCooldownMs);
  }
}

// ── Singleton instance ───────────────────────────────────

export const circuitBreaker = new CircuitBreakerManager();
