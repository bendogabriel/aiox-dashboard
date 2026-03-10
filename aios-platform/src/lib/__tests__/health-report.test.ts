import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateHealthReport } from '../health-report';

// Mock stores
vi.mock('../../stores/integrationStore', () => {
  const integrations = {
    engine: { id: 'engine', status: 'connected', lastChecked: Date.now(), message: 'OK', config: {} },
    supabase: { id: 'supabase', status: 'disconnected', lastChecked: null, message: null, config: {} },
    'api-keys': { id: 'api-keys', status: 'connected', lastChecked: Date.now(), config: {} },
    whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
    telegram: { id: 'telegram', status: 'disconnected', config: {} },
    voice: { id: 'voice', status: 'disconnected', config: {} },
    'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
    'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
  };
  return {
    useIntegrationStore: Object.assign(
      (selector?: any) => selector ? selector({ integrations }) : { integrations },
      { getState: () => ({ integrations }) },
    ),
  };
});

vi.mock('../../stores/capabilityHistoryStore', () => ({
  useCapabilityHistoryStore: Object.assign(
    (selector?: any) => selector ? selector({ events: [] }) : { events: [] },
    {
      getState: () => ({
        events: [
          {
            id: 'e1',
            timestamp: Date.now(),
            integrationId: 'engine',
            previousStatus: 'disconnected',
            newStatus: 'connected',
            capabilitiesAffected: 10,
            capabilitySummary: { full: 18, degraded: 2, unavailable: 1, total: 21 },
          },
        ],
      }),
    },
  ),
}));

vi.mock('../../stores/healthMonitorStore', () => ({
  useHealthMonitorStore: Object.assign(
    (selector?: any) => {
      const state = {
        enabled: true,
        intervalSeconds: 60,
        lastPollTimestamp: Date.now(),
        uptimeSnapshots: [],
        getUptimePercent: () => 99,
        getConsecutiveFailures: () => 0,
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        enabled: true,
        intervalSeconds: 60,
        lastPollTimestamp: Date.now(),
        uptimeSnapshots: [],
        getUptimePercent: () => 99,
        getConsecutiveFailures: () => 0,
      }),
    },
  ),
}));

vi.mock('../../stores/connectionProfileStore', () => ({
  useConnectionProfileStore: Object.assign(
    (selector?: any) => selector ? selector({ activeProfileId: null }) : { activeProfileId: null },
    { getState: () => ({ activeProfileId: 'preset:local-dev' }) },
  ),
}));

describe('health-report', () => {
  it('generates a valid report structure', () => {
    const report = generateHealthReport();

    expect(report.version).toBe(1);
    expect(report.platform).toBe('aios-platform');
    expect(report.generatedAt).toBeTruthy();
    expect(report.environment).toBeTruthy();
    expect(report.integrations).toBeInstanceOf(Array);
    expect(report.capabilities).toBeTruthy();
    expect(report.monitoring).toBeTruthy();
    expect(report.recentEvents).toBeInstanceOf(Array);
  });

  it('includes all 8 integrations', () => {
    const report = generateHealthReport();
    expect(report.integrations).toHaveLength(8);
  });

  it('includes integration uptime and failure counts', () => {
    const report = generateHealthReport();
    const engine = report.integrations.find((i) => i.id === 'engine');
    expect(engine).toBeTruthy();
    expect(engine!.uptimePercent).toBe(99);
    expect(engine!.consecutiveFailures).toBe(0);
  });

  it('includes capability summary', () => {
    const report = generateHealthReport();
    expect(report.capabilities.total).toBeGreaterThan(0);
    expect(report.capabilities.details).toBeInstanceOf(Array);
    expect(report.capabilities.details.length).toBe(report.capabilities.total);
  });

  it('includes monitoring config', () => {
    const report = generateHealthReport();
    expect(report.monitoring.enabled).toBe(true);
    expect(report.monitoring.intervalSeconds).toBe(60);
  });

  it('includes recent events', () => {
    const report = generateHealthReport();
    expect(report.recentEvents).toHaveLength(1);
    expect(report.recentEvents[0].integrationId).toBe('engine');
  });

  it('includes active profile', () => {
    const report = generateHealthReport();
    expect(report.activeProfile).toBe('preset:local-dev');
  });
});
