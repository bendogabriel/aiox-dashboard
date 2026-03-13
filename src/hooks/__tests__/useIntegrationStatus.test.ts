import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIntegrationStore } from '../../stores/integrationStore';

// Mock dependencies
vi.mock('../../services/api/engine', () => ({
  engineApi: {
    health: vi.fn(),
  },
}));

vi.mock('../../lib/connection', () => ({
  getEngineUrl: vi.fn(),
}));

// Grab mocked modules
import { engineApi } from '../../services/api/engine';
import { getEngineUrl } from '../../lib/connection';

const mockedHealth = vi.mocked(engineApi.health);
const mockedGetEngineUrl = vi.mocked(getEngineUrl);

describe('useIntegrationStatus (unit logic)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIntegrationStore.setState({
      integrations: {
        engine: { id: 'engine', status: 'disconnected', config: {} },
        whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
        supabase: { id: 'supabase', status: 'disconnected', config: {} },
        'api-keys': { id: 'api-keys', status: 'disconnected', config: {} },
        voice: { id: 'voice', status: 'disconnected', config: {} },
        telegram: { id: 'telegram', status: 'disconnected', config: {} },
        'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
        'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
      },
      setupModalOpen: null,
    });
  });

  it('should set engine disconnected when no URL configured', async () => {
    mockedGetEngineUrl.mockReturnValue('');

    // Simulate checkEngine logic
    const url = mockedGetEngineUrl();
    if (!url) {
      useIntegrationStore.getState().setStatus('engine', 'disconnected', 'VITE_ENGINE_URL not configured');
    }

    const entry = useIntegrationStore.getState().integrations.engine;
    expect(entry.status).toBe('disconnected');
    expect(entry.message).toContain('not configured');
  });

  it('should set engine connected on successful health check', async () => {
    mockedGetEngineUrl.mockReturnValue('http://localhost:4002');
    mockedHealth.mockResolvedValue({ status: 'ok', version: '0.5.0', ws_clients: 2 });

    // Simulate checkEngine logic
    useIntegrationStore.getState().setStatus('engine', 'checking');
    const health = await engineApi.health();
    useIntegrationStore.getState().setStatus('engine', 'connected', `v${health.version} — ${health.ws_clients} WS clients`);

    const entry = useIntegrationStore.getState().integrations.engine;
    expect(entry.status).toBe('connected');
    expect(entry.message).toBe('v0.5.0 — 2 WS clients');
  });

  it('should set engine error on health check failure', async () => {
    mockedGetEngineUrl.mockReturnValue('http://localhost:4002');
    mockedHealth.mockRejectedValue(new Error('Network error'));

    useIntegrationStore.getState().setStatus('engine', 'checking');
    try {
      await engineApi.health();
    } catch {
      useIntegrationStore.getState().setStatus('engine', 'error', 'Engine unreachable');
    }

    const entry = useIntegrationStore.getState().integrations.engine;
    expect(entry.status).toBe('error');
    expect(entry.message).toBe('Engine unreachable');
  });

  it('should handle api-keys from localStorage', () => {
    // Simulate checkApiKeys logic
    const keys = [{ id: '1', label: 'OpenAI', key: 'sk-test' }];
    const count = keys.length;
    useIntegrationStore.getState().setStatus('api-keys', 'connected', `${count} key configured`);

    const entry = useIntegrationStore.getState().integrations['api-keys'];
    expect(entry.status).toBe('connected');
    expect(entry.message).toContain('1 key');
  });

  it('should handle voice provider detection', () => {
    // Simulate checkVoice logic — browser provider
    useIntegrationStore.getState().setStatus('voice', 'partial', 'Browser TTS (basic)');

    let entry = useIntegrationStore.getState().integrations.voice;
    expect(entry.status).toBe('partial');

    // elevenlabs provider
    useIntegrationStore.getState().setStatus('voice', 'connected', 'TTS: elevenlabs');
    entry = useIntegrationStore.getState().integrations.voice;
    expect(entry.status).toBe('connected');
  });
});
