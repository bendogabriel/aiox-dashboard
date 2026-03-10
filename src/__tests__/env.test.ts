import { describe, it, expect } from 'vitest';
import { env, getServerEnv } from '@/lib/env';

// ── Client-side env ──

describe('env (client-side)', () => {
  it('apiUrl defaults to /api', () => {
    expect(env.apiUrl).toBe('/api');
  });

  it('monitorWsUrl defaults to ws://localhost:4001/stream', () => {
    expect(env.monitorWsUrl).toBe('ws://localhost:4001/stream');
  });

  it('isDev is a boolean', () => {
    expect(typeof env.isDev).toBe('boolean');
  });

  it('isProd is a boolean', () => {
    expect(typeof env.isProd).toBe('boolean');
  });

  it('isDev and isProd are mutually exclusive in test environment', () => {
    // In vitest, NODE_ENV is "test", so both should be false
    expect(env.isDev).toBe(false);
    expect(env.isProd).toBe(false);
  });
});

// ── Server-side env ──

describe('getServerEnv()', () => {
  it('returns an object', () => {
    const serverEnv = getServerEnv();
    expect(typeof serverEnv).toBe('object');
    expect(serverEnv).not.toBeNull();
  });

  it('contains all expected keys', () => {
    const serverEnv = getServerEnv();
    const expectedKeys = [
      'supabaseUrl',
      'supabaseAnonKey',
      'aiosProjectRoot',
      'anthropicApiKey',
      'openaiApiKey',
      'claudeCliPath',
      'claudeMaxTurns',
      'claudeTimeoutMs',
      'taskTtlMs',
    ];
    for (const key of expectedKeys) {
      expect(serverEnv).toHaveProperty(key);
    }
  });

  it('string values are strings', () => {
    const serverEnv = getServerEnv();
    expect(typeof serverEnv.supabaseUrl).toBe('string');
    expect(typeof serverEnv.supabaseAnonKey).toBe('string');
    expect(typeof serverEnv.aiosProjectRoot).toBe('string');
    expect(typeof serverEnv.anthropicApiKey).toBe('string');
    expect(typeof serverEnv.openaiApiKey).toBe('string');
    expect(typeof serverEnv.claudeCliPath).toBe('string');
    expect(typeof serverEnv.claudeMaxTurns).toBe('string');
  });

  it('numeric values are numbers', () => {
    const serverEnv = getServerEnv();
    expect(typeof serverEnv.claudeTimeoutMs).toBe('number');
    expect(typeof serverEnv.taskTtlMs).toBe('number');
  });

  it('claudeCliPath defaults to "claude"', () => {
    const serverEnv = getServerEnv();
    expect(serverEnv.claudeCliPath).toBe('claude');
  });

  it('claudeMaxTurns defaults to "25"', () => {
    const serverEnv = getServerEnv();
    expect(serverEnv.claudeMaxTurns).toBe('25');
  });

  it('claudeTimeoutMs defaults to 1800000', () => {
    const serverEnv = getServerEnv();
    expect(serverEnv.claudeTimeoutMs).toBe(1800000);
  });

  it('taskTtlMs defaults to 7200000 (2 hours)', () => {
    const serverEnv = getServerEnv();
    expect(serverEnv.taskTtlMs).toBe(2 * 60 * 60 * 1000);
  });

  it('returns a fresh object on each call', () => {
    const a = getServerEnv();
    const b = getServerEnv();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
