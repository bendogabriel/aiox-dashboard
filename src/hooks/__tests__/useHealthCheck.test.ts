import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { probeIntegration, probeAllIntegrations } from '../useHealthCheck';

// Mock integrationStore
const mockSetStatus = vi.fn();

vi.mock('../../stores/integrationStore', () => ({
  useIntegrationStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({ setStatus: mockSetStatus, integrations: {} }),
    {
      getState: () => ({
        integrations: {
          engine: { id: 'engine', status: 'disconnected', config: {} },
          supabase: { id: 'supabase', status: 'disconnected', config: {} },
          'api-keys': { id: 'api-keys', status: 'disconnected', config: {} },
          whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
          telegram: { id: 'telegram', status: 'disconnected', config: {} },
          voice: { id: 'voice', status: 'disconnected', config: {} },
          'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
          'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
        },
        setStatus: mockSetStatus,
      }),
    },
  ),
}));

// Mock connection module
vi.mock('../../lib/connection', () => ({
  getEngineUrl: vi.fn(() => 'http://localhost:4002'),
  discoverEngineUrl: vi.fn(async () => null),
  clearDiscoveryCache: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useHealthCheck — probeIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('probes engine and sets connected on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', version: '1.0.0' }),
    });

    const result = await probeIntegration('engine');

    expect(result.ok).toBe(true);
    expect(result.newStatus).toBe('connected');
    expect(result.msg).toContain('v1.0.0');
    expect(mockSetStatus).toHaveBeenCalledWith('engine', 'checking');
    expect(mockSetStatus).toHaveBeenCalledWith('engine', 'connected', expect.any(String));
  });

  it('probes engine and sets disconnected on failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await probeIntegration('engine');

    expect(result.ok).toBe(false);
    expect(result.newStatus).toBe('disconnected');
    expect(mockSetStatus).toHaveBeenCalledWith('engine', 'disconnected', expect.any(String));
  });

  it('probes api-keys using localStorage', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify([{ id: '1', label: 'OpenAI', key: 'sk-test' }]),
    );

    const result = await probeIntegration('api-keys');

    expect(result.ok).toBe(true);
    expect(result.msg).toContain('1 key(s)');
  });

  it('probes api-keys as disconnected when no keys', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const result = await probeIntegration('api-keys');

    expect(result.ok).toBe(false);
    expect(result.msg).toBe('No API keys');
  });

  it('probes supabase — handles fetch result', async () => {
    // Supabase probe behavior depends on env vars (import.meta.env)
    // which are set at build time. We test the result shape.
    const result = await probeIntegration('supabase');
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('msg');
    expect(result).toHaveProperty('newStatus');
    expect(['connected', 'disconnected']).toContain(result.newStatus);
  });

  it('returns previousStatus from store', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', version: '1.0.0' }),
    });

    const result = await probeIntegration('engine');
    expect(result.previousStatus).toBe('disconnected');
  });

  it('probes whatsapp via engine endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true }),
    });

    const result = await probeIntegration('whatsapp');

    expect(result.ok).toBe(true);
    expect(result.msg).toBe('Connected');
  });

  it('probes telegram as disconnected when engine reachable but telegram not configured', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await probeIntegration('telegram');

    expect(result.ok).toBe(false);
    expect(result.msg).toBe('Not configured');
  });
});

describe('useHealthCheck — probeAllIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('probes all 8 integrations', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', version: '1.0.0', connected: true }),
    });

    const results = await probeAllIntegrations();

    expect(results).toHaveLength(8);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('engine');
    expect(ids).toContain('supabase');
    expect(ids).toContain('api-keys');
    expect(ids).toContain('whatsapp');
    expect(ids).toContain('telegram');
    expect(ids).toContain('voice');
    expect(ids).toContain('google-drive');
    expect(ids).toContain('google-calendar');
  });

  it('each result has required fields', async () => {
    mockFetch.mockRejectedValue(new Error('Offline'));

    const results = await probeAllIntegrations();

    for (const result of results) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('msg');
      expect(result).toHaveProperty('previousStatus');
      expect(result).toHaveProperty('newStatus');
    }
  });
});
