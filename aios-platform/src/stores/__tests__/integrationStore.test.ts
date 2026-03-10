import { describe, it, expect, beforeEach } from 'vitest';
import { useIntegrationStore } from '../integrationStore';

describe('integrationStore', () => {
  beforeEach(() => {
    useIntegrationStore.setState({
      integrations: {
        engine: { id: 'engine', status: 'disconnected', config: {} },
        whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
        supabase: { id: 'supabase', status: 'disconnected', config: {} },
        'api-keys': { id: 'api-keys', status: 'disconnected', config: {} },
        voice: { id: 'voice', status: 'disconnected', config: {} },
      },
      setupModalOpen: null,
    });
  });

  it('should have all 5 integrations', () => {
    const ids = Object.keys(useIntegrationStore.getState().integrations);
    expect(ids).toEqual(['engine', 'whatsapp', 'supabase', 'api-keys', 'voice']);
  });

  it('should default all integrations to disconnected', () => {
    const { integrations } = useIntegrationStore.getState();
    for (const entry of Object.values(integrations)) {
      expect(entry.status).toBe('disconnected');
    }
  });

  it('should update status with setStatus', () => {
    useIntegrationStore.getState().setStatus('engine', 'connected', 'v1.0');
    const entry = useIntegrationStore.getState().integrations.engine;
    expect(entry.status).toBe('connected');
    expect(entry.message).toBe('v1.0');
    expect(entry.lastChecked).toBeGreaterThan(0);
  });

  it('should update status without message', () => {
    useIntegrationStore.getState().setStatus('whatsapp', 'checking');
    const entry = useIntegrationStore.getState().integrations.whatsapp;
    expect(entry.status).toBe('checking');
    expect(entry.message).toBeUndefined();
  });

  it('should merge config with setConfig', () => {
    useIntegrationStore.getState().setConfig('supabase', { url: 'https://x.supabase.co' });
    useIntegrationStore.getState().setConfig('supabase', { key: 'abc' });
    const config = useIntegrationStore.getState().integrations.supabase.config;
    expect(config).toEqual({ url: 'https://x.supabase.co', key: 'abc' });
  });

  it('should not clobber other integrations when updating one', () => {
    useIntegrationStore.getState().setStatus('engine', 'connected', 'ok');
    const { integrations } = useIntegrationStore.getState();
    expect(integrations.whatsapp.status).toBe('disconnected');
    expect(integrations.supabase.status).toBe('disconnected');
  });

  it('should open and close setup modal', () => {
    useIntegrationStore.getState().openSetup('whatsapp');
    expect(useIntegrationStore.getState().setupModalOpen).toBe('whatsapp');
    useIntegrationStore.getState().closeSetup();
    expect(useIntegrationStore.getState().setupModalOpen).toBeNull();
  });

  it('should get integration by id', () => {
    useIntegrationStore.getState().setStatus('voice', 'partial', 'Browser TTS');
    const entry = useIntegrationStore.getState().getIntegration('voice');
    expect(entry.status).toBe('partial');
    expect(entry.message).toBe('Browser TTS');
  });

  it('should cycle through status values', () => {
    const statuses = ['connected', 'disconnected', 'checking', 'error', 'partial'] as const;
    for (const s of statuses) {
      useIntegrationStore.getState().setStatus('engine', s);
      expect(useIntegrationStore.getState().integrations.engine.status).toBe(s);
    }
  });
});
