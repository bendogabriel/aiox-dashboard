import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encodeConfigForShare,
  decodeConfigFromShare,
  getImportFromUrl,
  clearImportFromUrl,
  generateQrSvg,
} from '../qr-config-share';
import type { ConfigExport } from '../config-export';

// Mock config-export
vi.mock('../config-export', () => ({
  buildConfigExport: vi.fn(() => ({
    version: 1,
    exportedAt: '2026-03-10T00:00:00.000Z',
    platform: 'aios-platform',
    integrations: {
      engine: { status: 'connected', config: { url: 'http://localhost:4002' } },
      supabase: { status: 'disconnected', config: {} },
      'api-keys': { status: 'disconnected', config: {} },
      whatsapp: { status: 'disconnected', config: {} },
      telegram: { status: 'disconnected', config: {} },
      voice: { status: 'disconnected', config: {} },
      'google-drive': { status: 'disconnected', config: {} },
      'google-calendar': { status: 'disconnected', config: {} },
    },
    settings: {
      theme: 'aiox',
      voiceProvider: 'browser',
      engineUrl: 'http://localhost:4002',
      supabaseUrl: null,
    },
  })),
  parseConfigImport: vi.fn((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data?.version === 1 && data?.platform === 'aios-platform') return data;
      return { error: 'Invalid config' };
    } catch {
      return { error: 'Invalid JSON' };
    }
  }),
}));

describe('qr-config-share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encodeConfigForShare / decodeConfigFromShare', () => {
    it('encodes and decodes config roundtrip', async () => {
      const encoded = await encodeConfigForShare();
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');

      const decoded = await decodeConfigFromShare(encoded);
      expect('error' in decoded).toBe(false);
      expect((decoded as ConfigExport).version).toBe(1);
      expect((decoded as ConfigExport).platform).toBe('aios-platform');
    });

    it('encoded string is URL-safe', async () => {
      const encoded = await encodeConfigForShare();
      // Should not contain +, /, or = (base64url format)
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it('returns error for invalid encoded string', async () => {
      const result = await decodeConfigFromShare('not-valid-base64!!!');
      expect('error' in result).toBe(true);
    });
  });

  describe('getImportFromUrl', () => {
    it('returns null when no import param', () => {
      // jsdom default URL has no params
      expect(getImportFromUrl()).toBeNull();
    });

    it('returns encoded value from URL', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('import', 'test-encoded-value');
      window.history.replaceState({}, '', url.toString());

      expect(getImportFromUrl()).toBe('test-encoded-value');

      // Clean up
      clearImportFromUrl();
    });
  });

  describe('clearImportFromUrl', () => {
    it('removes import param from URL', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('import', 'some-value');
      window.history.replaceState({}, '', url.toString());

      clearImportFromUrl();

      const params = new URLSearchParams(window.location.search);
      expect(params.get('import')).toBeNull();
    });
  });

  describe('generateQrSvg', () => {
    it('generates SVG for short text', () => {
      const svg = generateQrSvg('https://example.com', 200);
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox');
      expect(svg).toContain('<path');
    });

    it('returns null for very long text', () => {
      const longText = 'x'.repeat(3000);
      const svg = generateQrSvg(longText);
      expect(svg).toBeNull();
    });

    it('respects size parameter', () => {
      const svg = generateQrSvg('test', 300);
      expect(svg).toContain('width="300"');
      expect(svg).toContain('height="300"');
    });

    it('generates different SVGs for different inputs', () => {
      const svg1 = generateQrSvg('hello');
      const svg2 = generateQrSvg('world');
      expect(svg1).not.toBe(svg2);
    });
  });
});
