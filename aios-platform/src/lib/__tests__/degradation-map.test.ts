import { describe, it, expect } from 'vitest';
import {
  computeCapabilities,
  getViewCapabilities,
  getCapabilitySummary,
  getCapabilityDefs,
  type CapabilityInfo,
} from '../degradation-map';
import type { IntegrationId, IntegrationStatus } from '../../stores/integrationStore';

// Helper to create a status map with defaults
function makeStatusMap(
  overrides: Partial<Record<IntegrationId, IntegrationStatus>> = {},
): Record<IntegrationId, IntegrationStatus> {
  return {
    engine: 'disconnected',
    whatsapp: 'disconnected',
    supabase: 'disconnected',
    'api-keys': 'disconnected',
    voice: 'disconnected',
    telegram: 'disconnected',
    'google-drive': 'disconnected',
    'google-calendar': 'disconnected',
    ...overrides,
  };
}

describe('degradation-map', () => {
  describe('computeCapabilities', () => {
    it('returns all capabilities as unavailable when everything is offline', () => {
      const caps = computeCapabilities(makeStatusMap());
      const unavailable = caps.filter((c) => c.level === 'unavailable');
      // Most capabilities require engine or api-keys, so most should be unavailable
      expect(unavailable.length).toBeGreaterThan(10);
    });

    it('marks engine-dependent capabilities as available when engine is connected', () => {
      const caps = computeCapabilities(makeStatusMap({ engine: 'connected' }));
      const agentExec = caps.find((c) => c.id === 'agent-execution')!;
      // agent-execution requires engine (connected) but enhancedBy api-keys (disconnected)
      expect(agentExec.level).toBe('degraded');

      const jobMgmt = caps.find((c) => c.id === 'job-management')!;
      expect(jobMgmt.level).toBe('full');
    });

    it('marks capabilities as full when all dependencies are connected', () => {
      const caps = computeCapabilities(
        makeStatusMap({
          engine: 'connected',
          'api-keys': 'connected',
          supabase: 'connected',
          voice: 'connected',
          whatsapp: 'connected',
          telegram: 'connected',
          'google-drive': 'connected',
          'google-calendar': 'connected',
        }),
      );
      const allFull = caps.every((c) => c.level === 'full');
      expect(allFull).toBe(true);
    });

    it('treats "partial" status as online', () => {
      const caps = computeCapabilities(makeStatusMap({ engine: 'partial' }));
      const jobMgmt = caps.find((c) => c.id === 'job-management')!;
      expect(jobMgmt.level).toBe('full');
    });

    it('treats "checking" status as offline', () => {
      const caps = computeCapabilities(makeStatusMap({ engine: 'checking' }));
      const jobMgmt = caps.find((c) => c.id === 'job-management')!;
      expect(jobMgmt.level).toBe('unavailable');
    });

    it('handles multi-dependency capabilities correctly', () => {
      // whatsapp-messaging requires engine + whatsapp
      const caps1 = computeCapabilities(makeStatusMap({ engine: 'connected' }));
      const wa1 = caps1.find((c) => c.id === 'whatsapp-messaging')!;
      expect(wa1.level).toBe('unavailable');
      expect(wa1.reason).toContain('whatsapp');

      const caps2 = computeCapabilities(
        makeStatusMap({ engine: 'connected', whatsapp: 'connected' }),
      );
      const wa2 = caps2.find((c) => c.id === 'whatsapp-messaging')!;
      expect(wa2.level).toBe('full');
    });

    it('distinguishes degraded from unavailable', () => {
      // voice-tts has no requires but enhancedBy voice
      const caps = computeCapabilities(makeStatusMap());
      const voice = caps.find((c) => c.id === 'voice-tts')!;
      expect(voice.level).toBe('degraded');
      expect(voice.reason).toContain('voice');
    });

    it('includes reason string for non-full capabilities', () => {
      const caps = computeCapabilities(makeStatusMap());
      for (const cap of caps) {
        if (cap.level !== 'full') {
          expect(cap.reason).toBeTruthy();
        }
      }
    });

    it('includes dependsOn array for every capability', () => {
      const caps = computeCapabilities(makeStatusMap());
      for (const cap of caps) {
        expect(Array.isArray(cap.dependsOn)).toBe(true);
      }
    });
  });

  describe('getViewCapabilities', () => {
    it('filters capabilities by view', () => {
      const statuses = makeStatusMap();
      const chatCaps = getViewCapabilities(statuses, 'chat');
      const engineCaps = getViewCapabilities(statuses, 'engine-view');

      // Chat has different capabilities than engine view
      const chatIds = chatCaps.map((c) => c.id);
      const engineIds = engineCaps.map((c) => c.id);

      expect(chatIds).toContain('agent-execution');
      expect(engineIds).toContain('job-management');
      expect(engineIds).toContain('pool-monitor');
      expect(chatIds).not.toContain('pool-monitor');
    });

    it('returns empty array for unknown view', () => {
      const caps = getViewCapabilities(makeStatusMap(), 'nonexistent-view');
      expect(caps).toHaveLength(0);
    });
  });

  describe('getCapabilitySummary', () => {
    it('counts levels correctly', () => {
      const caps: CapabilityInfo[] = [
        { id: 'agent-execution', label: 'A', level: 'full', dependsOn: [] },
        { id: 'workflow-execution', label: 'B', level: 'degraded', reason: 'x', dependsOn: [] },
        { id: 'job-management', label: 'C', level: 'unavailable', reason: 'y', dependsOn: [] },
        { id: 'pool-monitor', label: 'D', level: 'unavailable', reason: 'z', dependsOn: [] },
      ];
      const summary = getCapabilitySummary(caps);
      expect(summary).toEqual({ full: 1, degraded: 1, unavailable: 2, total: 4 });
    });

    it('handles empty array', () => {
      const summary = getCapabilitySummary([]);
      expect(summary).toEqual({ full: 0, degraded: 0, unavailable: 0, total: 0 });
    });
  });

  describe('getCapabilityDefs', () => {
    it('returns all capability definitions', () => {
      const defs = getCapabilityDefs();
      expect(defs.length).toBeGreaterThan(15);
      for (const def of defs) {
        expect(def.id).toBeTruthy();
        expect(def.label).toBeTruthy();
        expect(Array.isArray(def.requires)).toBe(true);
        expect(Array.isArray(def.relevantViews)).toBe(true);
      }
    });
  });
});
