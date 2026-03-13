import { describe, test, expect } from 'bun:test';
import {
  ENGINE_TO_FRONTEND_STATUS,
  ENGINE_TERMINAL_STATUSES,
  FRONTEND_TERMINAL_STATUSES,
  encodeDemand,
  decodeDemand,
  SSE_EVENT_TYPES,
} from '../../../shared/api-contract';

// ============================================================
// Orchestration Router — Unit Tests
// Tests the shared contract, status mapping, and encoding/decoding
// ============================================================

describe('API Contract — Status Mapping', () => {
  test('all engine statuses map to frontend statuses', () => {
    const engineStatuses = ['pending', 'started', 'running', 'analyzing', 'planning',
      'awaiting_approval', 'executing', 'completed', 'done', 'failed', 'timeout',
      'rejected', 'cancelled'];
    for (const s of engineStatuses) {
      expect(ENGINE_TO_FRONTEND_STATUS[s]).toBeTruthy();
    }
  });

  test('terminal engine statuses all map to frontend terminal statuses', () => {
    for (const s of ENGINE_TERMINAL_STATUSES) {
      const mapped = ENGINE_TO_FRONTEND_STATUS[s];
      expect(mapped).toBeTruthy();
      expect(FRONTEND_TERMINAL_STATUSES).toContain(mapped);
    }
  });

  test('pending maps to analyzing', () => {
    expect(ENGINE_TO_FRONTEND_STATUS['pending']).toBe('analyzing');
  });

  test('done maps to completed', () => {
    expect(ENGINE_TO_FRONTEND_STATUS['done']).toBe('completed');
  });

  test('failed maps to failed', () => {
    expect(ENGINE_TO_FRONTEND_STATUS['failed']).toBe('failed');
  });

  test('timeout maps to failed', () => {
    expect(ENGINE_TO_FRONTEND_STATUS['timeout']).toBe('failed');
  });
});

describe('API Contract — Demand Encoding', () => {
  test('encodeDemand wraps string in JSON object', () => {
    const encoded = encodeDemand('testar novo router');
    const parsed = JSON.parse(encoded);
    expect(parsed).toEqual({ demand: 'testar novo router' });
  });

  test('decodeDemand extracts demand from JSON', () => {
    const encoded = encodeDemand('build feature X');
    const decoded = decodeDemand(encoded);
    expect(decoded).toBe('build feature X');
  });

  test('decodeDemand handles plain string fallback', () => {
    const decoded = decodeDemand('plain text input');
    expect(decoded).toBe('plain text input');
  });

  test('decodeDemand handles malformed JSON gracefully', () => {
    const decoded = decodeDemand('{invalid json');
    expect(decoded).toBe('{invalid json');
  });

  test('encodeDemand then decodeDemand is identity', () => {
    const original = 'implementar autenticação OAuth2';
    expect(decodeDemand(encodeDemand(original))).toBe(original);
  });

  test('decodeDemand handles empty demand field', () => {
    const encoded = JSON.stringify({ demand: '' });
    expect(decodeDemand(encoded)).toBe('');
  });

  test('decodeDemand handles missing demand field', () => {
    const encoded = JSON.stringify({ other: 'value' });
    // Falls back to the raw input_payload string
    expect(decodeDemand(encoded)).toBe(encoded);
  });
});

describe('API Contract — SSE Event Types', () => {
  test('SSE_EVENT_TYPES includes all orchestration phases', () => {
    expect(SSE_EVENT_TYPES).toContain('task:analyzing');
    expect(SSE_EVENT_TYPES).toContain('task:planning');
    expect(SSE_EVENT_TYPES).toContain('task:executing');
    expect(SSE_EVENT_TYPES).toContain('task:completed');
    expect(SSE_EVENT_TYPES).toContain('task:failed');
  });

  test('SSE_EVENT_TYPES includes step streaming events', () => {
    expect(SSE_EVENT_TYPES).toContain('step:started');
    expect(SSE_EVENT_TYPES).toContain('step:completed');
    expect(SSE_EVENT_TYPES).toContain('step:streaming:start');
    expect(SSE_EVENT_TYPES).toContain('step:streaming:chunk');
    expect(SSE_EVENT_TYPES).toContain('step:streaming:end');
  });

  test('SSE_EVENT_TYPES includes squad/plan events', () => {
    expect(SSE_EVENT_TYPES).toContain('task:squads-selected');
    expect(SSE_EVENT_TYPES).toContain('task:plan-ready');
  });

  test('all event types are unique', () => {
    const unique = new Set(SSE_EVENT_TYPES);
    expect(unique.size).toBe(SSE_EVENT_TYPES.length);
  });
});

describe('API Contract — Terminal Status Detection', () => {
  test('ENGINE_TERMINAL_STATUSES contains expected values', () => {
    expect(ENGINE_TERMINAL_STATUSES).toContain('done');
    expect(ENGINE_TERMINAL_STATUSES).toContain('failed');
    expect(ENGINE_TERMINAL_STATUSES).toContain('timeout');
    expect(ENGINE_TERMINAL_STATUSES).toContain('rejected');
    expect(ENGINE_TERMINAL_STATUSES).toContain('cancelled');
  });

  test('running is NOT a terminal status', () => {
    expect(ENGINE_TERMINAL_STATUSES).not.toContain('running');
    expect(ENGINE_TERMINAL_STATUSES).not.toContain('pending');
  });

  test('FRONTEND_TERMINAL_STATUSES contains completed and failed', () => {
    expect(FRONTEND_TERMINAL_STATUSES).toContain('completed');
    expect(FRONTEND_TERMINAL_STATUSES).toContain('failed');
  });
});
