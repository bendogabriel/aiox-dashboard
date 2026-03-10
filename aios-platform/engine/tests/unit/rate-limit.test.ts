import { describe, test, expect, beforeEach } from 'bun:test';

// ============================================================
// Rate Limiter — Unit Tests (sliding window, in-memory)
// Tests the checkRateLimit algorithm from src/routes/webhooks.ts
// ============================================================

// -- Duplicated rate limit logic for isolated unit testing --

interface RateLimitEntry {
  timestamps: number[];
}

let rateLimitMap: Map<string, RateLimitEntry>;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;           // max requests per window

function checkRateLimit(ip: string, now = Date.now()): boolean {
  const entry = rateLimitMap.get(ip) ?? { timestamps: [] };

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  entry.timestamps.push(now);
  rateLimitMap.set(ip, entry);
  return true;
}

function cleanupMap(now = Date.now()): void {
  for (const [ip, entry] of rateLimitMap) {
    entry.timestamps = entry.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (entry.timestamps.length === 0) {
      rateLimitMap.delete(ip);
    }
  }
}

// -- Tests --

describe('Rate Limiter — Sliding Window', () => {
  beforeEach(() => {
    rateLimitMap = new Map();
  });

  test('allows first request', () => {
    expect(checkRateLimit('192.168.1.1')).toBe(true);
  });

  test('allows up to RATE_LIMIT_MAX requests within window', () => {
    const ip = '10.0.0.1';
    const now = 1000000;

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit(ip, now + i)).toBe(true);
    }
  });

  test('blocks request at RATE_LIMIT_MAX + 1', () => {
    const ip = '10.0.0.2';
    const now = 1000000;

    // Fill up to limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(ip, now + i);
    }

    // 11th request should be blocked
    expect(checkRateLimit(ip, now + RATE_LIMIT_MAX)).toBe(false);
  });

  test('allows request after window expires', () => {
    const ip = '10.0.0.3';
    const now = 1000000;

    // Fill up to limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(ip, now);
    }

    // Should be blocked within window
    expect(checkRateLimit(ip, now + 30_000)).toBe(false);

    // Should pass after full window elapses
    expect(checkRateLimit(ip, now + RATE_LIMIT_WINDOW_MS + 1)).toBe(true);
  });

  test('sliding window — partial expiry frees capacity', () => {
    const ip = '10.0.0.4';
    const baseTime = 1000000;

    // Make 5 requests at t=0
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, baseTime);
    }

    // Make 5 more requests at t=30s (total 10, at limit)
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, baseTime + 30_000);
    }

    // At t=30s, blocked (10 requests in window)
    expect(checkRateLimit(ip, baseTime + 30_000)).toBe(false);

    // At t=61s, the first 5 requests expire → 5 remaining → allowed
    expect(checkRateLimit(ip, baseTime + RATE_LIMIT_WINDOW_MS + 1)).toBe(true);
  });

  test('different IPs have independent limits', () => {
    const now = 1000000;

    // Fill IP A to limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('ip-a', now);
    }
    expect(checkRateLimit('ip-a', now)).toBe(false);

    // IP B should still be allowed
    expect(checkRateLimit('ip-b', now)).toBe(true);
  });

  test('tracks timestamps correctly per IP', () => {
    const now = 1000000;

    checkRateLimit('10.0.0.10', now);
    checkRateLimit('10.0.0.10', now + 100);
    checkRateLimit('10.0.0.20', now + 200);

    expect(rateLimitMap.get('10.0.0.10')!.timestamps).toEqual([now, now + 100]);
    expect(rateLimitMap.get('10.0.0.20')!.timestamps).toEqual([now + 200]);
  });

  test('blocked request does NOT record a timestamp', () => {
    const ip = '10.0.0.5';
    const now = 1000000;

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(ip, now);
    }

    // Attempt blocked request
    checkRateLimit(ip, now + 1);

    // Should still have exactly RATE_LIMIT_MAX timestamps
    expect(rateLimitMap.get(ip)!.timestamps.length).toBe(RATE_LIMIT_MAX);
  });
});

describe('Rate Limiter — Cleanup', () => {
  beforeEach(() => {
    rateLimitMap = new Map();
  });

  test('cleanup removes expired entries', () => {
    const now = 1000000;

    checkRateLimit('old-ip', now);
    checkRateLimit('fresh-ip', now + RATE_LIMIT_WINDOW_MS);

    cleanupMap(now + RATE_LIMIT_WINDOW_MS + 1);

    expect(rateLimitMap.has('old-ip')).toBe(false);
    expect(rateLimitMap.has('fresh-ip')).toBe(true);
  });

  test('cleanup keeps partially-active entries', () => {
    const now = 1000000;

    // Two requests: one old, one recent
    checkRateLimit('mixed-ip', now);
    checkRateLimit('mixed-ip', now + 50_000);

    // Cleanup at t=61s — first timestamp expires, second stays
    cleanupMap(now + RATE_LIMIT_WINDOW_MS + 1);

    expect(rateLimitMap.has('mixed-ip')).toBe(true);
    expect(rateLimitMap.get('mixed-ip')!.timestamps.length).toBe(1);
  });

  test('cleanup on empty map is a no-op', () => {
    cleanupMap(Date.now());
    expect(rateLimitMap.size).toBe(0);
  });
});

describe('Rate Limiter — Edge Cases', () => {
  beforeEach(() => {
    rateLimitMap = new Map();
  });

  test('exact boundary — request at window edge is within window', () => {
    const ip = '10.0.0.6';
    const now = 1000000;

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(ip, now);
    }

    // Exactly at window boundary (59,999ms) — still blocked
    expect(checkRateLimit(ip, now + RATE_LIMIT_WINDOW_MS - 1)).toBe(false);

    // At exactly RATE_LIMIT_WINDOW_MS (60,000ms) — timestamps use strict < so still within window
    expect(checkRateLimit(ip, now + RATE_LIMIT_WINDOW_MS)).toBe(false);

    // At RATE_LIMIT_WINDOW_MS + 1 — expired
    expect(checkRateLimit(ip, now + RATE_LIMIT_WINDOW_MS + 1)).toBe(true);
  });

  test('empty string IP is treated as valid key', () => {
    expect(checkRateLimit('')).toBe(true);
    expect(rateLimitMap.has('')).toBe(true);
  });

  test('"unknown" fallback IP works normally', () => {
    const now = 1000000;

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('unknown', now);
    }

    expect(checkRateLimit('unknown', now)).toBe(false);
  });

  test('rapid-fire within same millisecond all count', () => {
    const ip = '10.0.0.7';
    const now = 1000000;

    // All at exactly the same timestamp
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit(ip, now)).toBe(true);
    }

    expect(checkRateLimit(ip, now)).toBe(false);
    expect(rateLimitMap.get(ip)!.timestamps.length).toBe(RATE_LIMIT_MAX);
  });

  test('recovery after full block — allows full burst again', () => {
    const ip = '10.0.0.8';
    const t1 = 1000000;

    // First burst
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(ip, t1);
    }
    expect(checkRateLimit(ip, t1)).toBe(false);

    // Wait for window to expire
    const t2 = t1 + RATE_LIMIT_WINDOW_MS + 1;

    // Second burst should all pass
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit(ip, t2)).toBe(true);
    }
    expect(checkRateLimit(ip, t2)).toBe(false);
  });
});

describe('Rate Limiter — Constants', () => {
  test('window is 60 seconds', () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });

  test('limit is 10 requests per window', () => {
    expect(RATE_LIMIT_MAX).toBe(10);
  });
});
