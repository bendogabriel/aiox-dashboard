/**
 * Health Report Generator — P10
 *
 * Generates a comprehensive JSON report of the current platform health
 * for debugging, support, and auditing.
 */

import { useIntegrationStore, type IntegrationId } from '../stores/integrationStore';
import { useCapabilityHistoryStore } from '../stores/capabilityHistoryStore';
import { useHealthMonitorStore } from '../stores/healthMonitorStore';
import { useConnectionProfileStore } from '../stores/connectionProfileStore';
import { computeCapabilities, getCapabilitySummary } from './degradation-map';

// ── Types ─────────────────────────────────────────────────

export interface HealthReport {
  version: 1;
  generatedAt: string;
  platform: string;
  environment: EnvironmentInfo;
  integrations: IntegrationReport[];
  capabilities: CapabilityReport;
  monitoring: MonitoringReport;
  recentEvents: EventReport[];
  activeProfile: string | null;
}

interface EnvironmentInfo {
  userAgent: string;
  engineUrl: string | null;
  supabaseUrl: string | null;
  timestamp: number;
}

interface IntegrationReport {
  id: IntegrationId;
  status: string;
  lastChecked: number | null;
  message: string | null;
  uptimePercent: number;
  consecutiveFailures: number;
}

interface CapabilityReport {
  full: number;
  degraded: number;
  unavailable: number;
  total: number;
  details: { id: string; level: string; reason?: string }[];
}

interface MonitoringReport {
  enabled: boolean;
  intervalSeconds: number;
  lastPollTimestamp: number | null;
  totalSnapshots: number;
}

interface EventReport {
  id: string;
  timestamp: string;
  integrationId: string;
  previousStatus: string;
  newStatus: string;
  capabilitiesAffected: number;
}

// ── Builder ──────────────────────────────────────────────

export function generateHealthReport(): HealthReport {
  const { integrations } = useIntegrationStore.getState();
  const historyStore = useCapabilityHistoryStore.getState();
  const monitor = useHealthMonitorStore.getState();
  const profileStore = useConnectionProfileStore.getState();

  const statuses = Object.fromEntries(
    Object.entries(integrations).map(([id, e]) => [id, e.status]),
  ) as Record<IntegrationId, any>;

  const caps = computeCapabilities(statuses);
  const summary = getCapabilitySummary(caps);

  const integrationReports: IntegrationReport[] = Object.entries(integrations).map(
    ([id, entry]) => ({
      id: id as IntegrationId,
      status: entry.status,
      lastChecked: entry.lastChecked || null,
      message: entry.message || null,
      uptimePercent: monitor.getUptimePercent(id as IntegrationId),
      consecutiveFailures: monitor.getConsecutiveFailures(id as IntegrationId),
    }),
  );

  const recentEvents: EventReport[] = historyStore.events.slice(0, 50).map((e) => ({
    id: e.id,
    timestamp: new Date(e.timestamp).toISOString(),
    integrationId: e.integrationId,
    previousStatus: e.previousStatus,
    newStatus: e.newStatus,
    capabilitiesAffected: e.capabilitiesAffected,
  }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    platform: 'aios-platform',
    environment: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      engineUrl: import.meta.env.VITE_ENGINE_URL || null,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || null,
      timestamp: Date.now(),
    },
    integrations: integrationReports,
    capabilities: {
      ...summary,
      details: caps.map((c) => ({
        id: c.id,
        level: c.level,
        reason: c.reason,
      })),
    },
    monitoring: {
      enabled: monitor.enabled,
      intervalSeconds: monitor.intervalSeconds,
      lastPollTimestamp: monitor.lastPollTimestamp,
      totalSnapshots: monitor.uptimeSnapshots.length,
    },
    recentEvents,
    activeProfile: profileStore.activeProfileId,
  };
}

/**
 * Download health report as JSON file.
 */
export function downloadHealthReport(): void {
  const report = generateHealthReport();
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `aios-health-report-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
