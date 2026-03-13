import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreakerManager, type CircuitState } from '../circuit-breaker';

describe('CircuitBreakerManager', () => {
  let cb: CircuitBreakerManager;

  beforeEach(() => {
    cb = new CircuitBreakerManager({ failureThreshold: 3, cooldownMs: 1000, maxCooldownMs: 5000 });
  });

  describe('initial state', () => {
    it('starts in closed state', () => {
      expect(cb.getState('engine')).toBe('closed');
    });

    it('allows probing in closed state', () => {
      expect(cb.canProbe('engine')).toBe(true);
    });

    it('has 0 failures initially', () => {
      expect(cb.getFailureCount('engine')).toBe(0);
    });
  });

  describe('failure tracking', () => {
    it('stays closed below threshold', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      expect(cb.getState('engine')).toBe('closed');
      expect(cb.getFailureCount('engine')).toBe(2);
    });

    it('opens after reaching threshold', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      expect(cb.getState('engine')).toBe('open');
    });

    it('blocks probing when open', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      expect(cb.canProbe('engine')).toBe(false);
    });

    it('resets failures on success', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', true);
      expect(cb.getState('engine')).toBe('closed');
      expect(cb.getFailureCount('engine')).toBe(0);
    });
  });

  describe('half-open transition', () => {
    it('transitions to half-open after cooldown', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      expect(cb.getState('engine')).toBe('open');

      // Simulate cooldown elapsed
      vi.useFakeTimers();
      vi.advanceTimersByTime(1100);

      expect(cb.getState('engine')).toBe('half_open');
      expect(cb.canProbe('engine')).toBe(true);

      vi.useRealTimers();
    });

    it('closes on success in half-open', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);

      vi.useFakeTimers();
      vi.advanceTimersByTime(1100);

      // Now half-open
      cb.recordResult('engine', true);
      expect(cb.getState('engine')).toBe('closed');

      vi.useRealTimers();
    });

    it('re-opens on failure in half-open', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);

      vi.useFakeTimers();
      vi.advanceTimersByTime(1100);

      // Now half-open, probe fails
      cb.recordResult('engine', false);
      expect(cb.getState('engine')).toBe('open');

      vi.useRealTimers();
    });
  });

  describe('cooldown escalation', () => {
    it('increases cooldown with consecutive opens', () => {
      vi.useFakeTimers();

      // First open: cooldown = 1000ms
      for (let i = 0; i < 3; i++) cb.recordResult('engine', false);
      const cooldown1 = cb.getRemainingCooldown('engine');
      expect(cooldown1).toBeLessThanOrEqual(1000);

      // Transition to half-open, fail again
      vi.advanceTimersByTime(1100);
      cb.recordResult('engine', false);

      // Second open: cooldown = 2000ms (1000 * 2^1)
      const cooldown2 = cb.getRemainingCooldown('engine');
      expect(cooldown2).toBeGreaterThan(1000);
      expect(cooldown2).toBeLessThanOrEqual(2000);

      vi.useRealTimers();
    });

    it('caps cooldown at maxCooldownMs', () => {
      vi.useFakeTimers();

      // Open/half-open/fail many times
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 3; i++) cb.recordResult('engine', false);
        vi.advanceTimersByTime(10_000);
        cb.recordResult('engine', false); // fail in half-open
      }

      const remaining = cb.getRemainingCooldown('engine');
      expect(remaining).toBeLessThanOrEqual(5000);

      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('resets a single breaker', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      expect(cb.getState('engine')).toBe('open');

      cb.reset('engine');
      expect(cb.getState('engine')).toBe('closed');
      expect(cb.getFailureCount('engine')).toBe(0);
    });

    it('resetAll clears all breakers', () => {
      cb.recordResult('engine', false);
      cb.recordResult('supabase', false);
      cb.resetAll();
      expect(cb.getFailureCount('engine')).toBe(0);
      expect(cb.getFailureCount('supabase')).toBe(0);
    });
  });

  describe('isolation', () => {
    it('tracks integrations independently', () => {
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);
      cb.recordResult('engine', false);

      expect(cb.getState('engine')).toBe('open');
      expect(cb.getState('supabase')).toBe('closed');
      expect(cb.canProbe('supabase')).toBe(true);
    });
  });

  describe('getAllStatuses', () => {
    it('returns all tracked breakers', () => {
      cb.recordResult('engine', true);
      cb.recordResult('supabase', false);

      const statuses = cb.getAllStatuses();
      expect(statuses.size).toBe(2);
      expect(statuses.get('engine')!.state).toBe('closed');
      expect(statuses.get('supabase')!.failures).toBe(1);
    });
  });
});
