import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseConfigImport, applyConfigImport, type ConfigExport } from '../config-export';

// Mock the integrationStore
vi.mock('../../stores/integrationStore', () => ({
  useIntegrationStore: {
    getState: vi.fn(() => ({
      integrations: {
        engine: { id: 'engine', status: 'connected', config: { url: 'http://localhost:4002' } },
        supabase: { id: 'supabase', status: 'disconnected', config: {} },
        whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
        'api-keys': { id: 'api-keys', status: 'disconnected', config: {} },
        voice: { id: 'voice', status: 'disconnected', config: {} },
        telegram: { id: 'telegram', status: 'disconnected', config: {} },
        'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
        'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
      },
      setConfig: vi.fn(),
    })),
  },
}));

function makeValidExport(overrides: Partial<ConfigExport> = {}): ConfigExport {
  return {
    version: 1,
    exportedAt: '2026-03-10T00:00:00.000Z',
    platform: 'aios-platform',
    integrations: {
      engine: { status: 'connected', config: { url: 'http://localhost:4002' } },
      supabase: { status: 'disconnected', config: {} },
      whatsapp: { status: 'disconnected', config: {} },
      'api-keys': { status: 'disconnected', config: {} },
      voice: { status: 'disconnected', config: {} },
      telegram: { status: 'disconnected', config: {} },
      'google-drive': { status: 'disconnected', config: {} },
      'google-calendar': { status: 'disconnected', config: {} },
    },
    settings: {
      theme: 'aiox',
      voiceProvider: 'browser',
      engineUrl: 'http://localhost:4002',
      supabaseUrl: null,
    },
    ...overrides,
  };
}

describe('config-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseConfigImport', () => {
    it('parses valid config JSON', () => {
      const config = makeValidExport();
      const result = parseConfigImport(JSON.stringify(config));
      expect('error' in result).toBe(false);
      expect((result as ConfigExport).version).toBe(1);
    });

    it('rejects invalid JSON', () => {
      const result = parseConfigImport('not json');
      expect('error' in result).toBe(true);
      expect((result as { error: string }).error).toBe('Invalid JSON');
    });

    it('rejects wrong version', () => {
      const config = makeValidExport({ version: 2 as never });
      const result = parseConfigImport(JSON.stringify(config));
      expect('error' in result).toBe(true);
      expect((result as { error: string }).error).toContain('Invalid config');
    });

    it('rejects wrong platform', () => {
      const config = makeValidExport({ platform: 'other-platform' });
      const result = parseConfigImport(JSON.stringify(config));
      expect('error' in result).toBe(true);
    });

    it('rejects missing integrations', () => {
      const config = { version: 1, platform: 'aios-platform', exportedAt: '', settings: {} };
      const result = parseConfigImport(JSON.stringify(config));
      expect('error' in result).toBe(true);
    });
  });

  describe('applyConfigImport', () => {
    it('applies non-redacted config values', () => {
      const config = makeValidExport();
      config.integrations.engine.config = { url: 'http://example.com' };
      const result = applyConfigImport(config);
      expect(result.applied).toContain('engine');
    });

    it('skips redacted values', () => {
      const config = makeValidExport();
      config.integrations.engine.config = { token: '***REDACTED***' };
      const result = applyConfigImport(config);
      expect(result.skipped).toContain('engine');
    });

    it('applies theme setting', () => {
      const config = makeValidExport();
      config.settings.theme = 'matrix';
      const result = applyConfigImport(config);
      expect(result.applied).toContain('theme');
    });

    it('applies voice provider setting', () => {
      const config = makeValidExport();
      config.settings.voiceProvider = 'elevenlabs';
      const result = applyConfigImport(config);
      expect(result.applied).toContain('voice-provider');
    });

    it('skips null settings', () => {
      const config = makeValidExport();
      config.settings.theme = null;
      config.settings.voiceProvider = null;
      const result = applyConfigImport(config);
      expect(result.applied).not.toContain('theme');
      expect(result.applied).not.toContain('voice-provider');
    });
  });
});
