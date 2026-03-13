import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConnectionProfileStore } from '../connectionProfileStore';

// Mock integration store
vi.mock('../integrationStore', () => {
  const mockState = {
    integrations: {
      engine: { id: 'engine', status: 'connected', config: { url: 'http://localhost:3001' } },
      supabase: { id: 'supabase', status: 'disconnected', config: {} },
      'api-keys': { id: 'api-keys', status: 'connected', config: {} },
      whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
      telegram: { id: 'telegram', status: 'disconnected', config: {} },
      voice: { id: 'voice', status: 'disconnected', config: {} },
      'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
      'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
    },
    setConfig: vi.fn(),
  };

  return {
    useIntegrationStore: Object.assign(
      (selector?: any) => selector ? selector(mockState) : mockState,
      { getState: () => mockState },
    ),
  };
});

describe('connectionProfileStore', () => {
  beforeEach(() => {
    // Reset to presets only
    const state = useConnectionProfileStore.getState();
    useConnectionProfileStore.setState({
      profiles: state.profiles.filter((p) => p.isPreset),
      activeProfileId: null,
    });
  });

  describe('presets', () => {
    it('has 3 built-in presets', () => {
      const presets = useConnectionProfileStore.getState().profiles.filter((p) => p.isPreset);
      expect(presets).toHaveLength(3);
    });

    it('includes Local Dev, Docker Compose, and Demo Mode', () => {
      const names = useConnectionProfileStore.getState()
        .profiles.filter((p) => p.isPreset)
        .map((p) => p.name);
      expect(names).toContain('Local Dev');
      expect(names).toContain('Docker Compose');
      expect(names).toContain('Demo Mode');
    });
  });

  describe('saveCurrentAsProfile', () => {
    it('saves a custom profile from current config', () => {
      const id = useConnectionProfileStore.getState().saveCurrentAsProfile('My Setup', 'Testing');
      const profiles = useConnectionProfileStore.getState().profiles;
      const custom = profiles.find((p) => p.id === id);

      expect(custom).toBeTruthy();
      expect(custom!.name).toBe('My Setup');
      expect(custom!.description).toBe('Testing');
      expect(custom!.isPreset).toBe(false);
      expect(custom!.configs.engine).toEqual({ url: 'http://localhost:3001' });
    });

    it('sets saved profile as active', () => {
      const id = useConnectionProfileStore.getState().saveCurrentAsProfile('Active');
      expect(useConnectionProfileStore.getState().activeProfileId).toBe(id);
    });
  });

  describe('applyProfile', () => {
    it('applies a preset profile', async () => {
      const { useIntegrationStore } = await import('../integrationStore');
      const result = useConnectionProfileStore.getState().applyProfile('preset:local-dev');

      expect(result.notFound).toBe(false);
      expect(result.applied.length).toBeGreaterThan(0);
      expect(useIntegrationStore.getState().setConfig).toHaveBeenCalled();
    });

    it('sets active profile id', () => {
      useConnectionProfileStore.getState().applyProfile('preset:local-dev');
      expect(useConnectionProfileStore.getState().activeProfileId).toBe('preset:local-dev');
    });

    it('returns notFound for unknown profile', () => {
      const result = useConnectionProfileStore.getState().applyProfile('nonexistent');
      expect(result.notFound).toBe(true);
      expect(result.applied).toHaveLength(0);
    });
  });

  describe('deleteProfile', () => {
    it('deletes a custom profile', () => {
      const id = useConnectionProfileStore.getState().saveCurrentAsProfile('Temp');
      useConnectionProfileStore.getState().deleteProfile(id);
      expect(useConnectionProfileStore.getState().profiles.find((p) => p.id === id)).toBeUndefined();
    });

    it('cannot delete a preset', () => {
      const before = useConnectionProfileStore.getState().profiles.length;
      useConnectionProfileStore.getState().deleteProfile('preset:local-dev');
      expect(useConnectionProfileStore.getState().profiles.length).toBe(before);
    });

    it('clears activeProfileId if deleted profile was active', () => {
      const id = useConnectionProfileStore.getState().saveCurrentAsProfile('Active');
      expect(useConnectionProfileStore.getState().activeProfileId).toBe(id);
      useConnectionProfileStore.getState().deleteProfile(id);
      expect(useConnectionProfileStore.getState().activeProfileId).toBeNull();
    });
  });

  describe('renameProfile', () => {
    it('renames a custom profile', () => {
      const id = useConnectionProfileStore.getState().saveCurrentAsProfile('Old Name');
      useConnectionProfileStore.getState().renameProfile(id, 'New Name');
      expect(useConnectionProfileStore.getState().getProfile(id)!.name).toBe('New Name');
    });

    it('cannot rename a preset', () => {
      useConnectionProfileStore.getState().renameProfile('preset:local-dev', 'Hacked');
      expect(useConnectionProfileStore.getState().getProfile('preset:local-dev')!.name).toBe('Local Dev');
    });
  });

  describe('getActiveProfile', () => {
    it('returns undefined when no active profile', () => {
      expect(useConnectionProfileStore.getState().getActiveProfile()).toBeUndefined();
    });

    it('returns active profile after apply', () => {
      useConnectionProfileStore.getState().applyProfile('preset:demo');
      const active = useConnectionProfileStore.getState().getActiveProfile();
      expect(active?.name).toBe('Demo Mode');
    });
  });
});
