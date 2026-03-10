import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatRelativeTime, generateId, truncate, capitalizeFirst } from '@/lib/utils';

describe('cn (class name merger)', () => {
  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });
});

describe('formatRelativeTime', () => {
  let now: number;

  beforeEach(() => {
    now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "agora" for less than 60 seconds ago', () => {
    expect(formatRelativeTime(new Date(now - 30_000))).toBe('agora');
  });

  it('returns "agora" for exactly now', () => {
    expect(formatRelativeTime(new Date(now))).toBe('agora');
  });

  it('returns minutes for 60s-3599s', () => {
    expect(formatRelativeTime(new Date(now - 60_000))).toBe('1m atrás');
    expect(formatRelativeTime(new Date(now - 120_000))).toBe('2m atrás');
    expect(formatRelativeTime(new Date(now - 3_599_000))).toBe('59m atrás');
  });

  it('returns hours for 3600s-86399s', () => {
    expect(formatRelativeTime(new Date(now - 3_600_000))).toBe('1h atrás');
    expect(formatRelativeTime(new Date(now - 7_200_000))).toBe('2h atrás');
  });

  it('returns days for 86400s-604799s', () => {
    expect(formatRelativeTime(new Date(now - 86_400_000))).toBe('1d atrás');
    expect(formatRelativeTime(new Date(now - 604_799_000))).toBe('6d atrás');
  });

  it('returns formatted date for older than 7 days', () => {
    const old = new Date(now - 700_000_000);
    const result = formatRelativeTime(old);
    // Should be a date string like "15 de jan." (locale pt-BR)
    expect(result).not.toContain('atrás');
    expect(result).not.toBe('agora');
  });

  it('accepts string dates', () => {
    expect(formatRelativeTime(new Date(now - 30_000).toISOString())).toBe('agora');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('contains a dash separator', () => {
    expect(generateId()).toContain('-');
  });

  it('starts with a timestamp-like number', () => {
    const id = generateId();
    const timestampPart = id.split('-')[0];
    const num = Number(timestampPart);
    expect(num).toBeGreaterThan(1_000_000_000_000);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('truncate', () => {
  it('returns original string if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns original string if equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles maxLength of 3 (minimum for ellipsis)', () => {
    expect(truncate('hello', 3)).toBe('...');
  });
});

describe('capitalizeFirst', () => {
  it('capitalizes first character', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('a')).toBe('A');
  });

  it('handles already capitalized', () => {
    expect(capitalizeFirst('Hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalizeFirst('')).toBe('');
  });

  it('handles numbers', () => {
    expect(capitalizeFirst('123abc')).toBe('123abc');
  });
});
