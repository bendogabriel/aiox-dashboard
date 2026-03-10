import { useEffect, useRef } from 'react';
import { useIntegrationStore, type IntegrationId, type IntegrationStatus } from '../stores/integrationStore';
import { useToastStore } from '../stores/toastStore';
import { useCapabilityHistoryStore } from '../stores/capabilityHistoryStore';
import { computeCapabilities, getCapabilitySummary } from '../lib/degradation-map';

type StatusSnapshot = Record<IntegrationId, IntegrationStatus>;

function takeSnapshot(): StatusSnapshot {
  const integrations = useIntegrationStore.getState().integrations;
  const map = {} as StatusSnapshot;
  for (const [id, entry] of Object.entries(integrations)) {
    map[id as IntegrationId] = entry.status;
  }
  return map;
}

function isOnline(status: IntegrationStatus): boolean {
  return status === 'connected' || status === 'partial';
}

const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  engine: 'Engine',
  supabase: 'Supabase',
  'api-keys': 'API Keys',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  voice: 'Voice',
  'google-drive': 'Google Drive',
  'google-calendar': 'Google Calendar',
};

/**
 * Watches integration status changes and fires toast notifications
 * when integrations come online or go offline, with capability impact.
 * Also records events in capability history store (P7 observability)
 * and fires configured webhooks.
 */
export function useCapabilityRecoveryToast() {
  const integrations = useIntegrationStore((s) => s.integrations);
  const prevSnapshot = useRef<StatusSnapshot | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    const currentSnapshot = takeSnapshot();

    // Skip first render — don't toast on mount
    if (!initialised.current) {
      prevSnapshot.current = currentSnapshot;
      initialised.current = true;
      return;
    }

    const prev = prevSnapshot.current;
    if (!prev) {
      prevSnapshot.current = currentSnapshot;
      return;
    }

    // Find status transitions (ignoring 'checking' intermediate state)
    const recovered: IntegrationId[] = [];
    const lost: IntegrationId[] = [];

    for (const id of Object.keys(currentSnapshot) as IntegrationId[]) {
      const prevStatus = prev[id];
      const currStatus = currentSnapshot[id];

      // Skip 'checking' — it's transient
      if (currStatus === 'checking') continue;
      if (prevStatus === currStatus) continue;

      const wasOnline = isOnline(prevStatus);
      const nowOnline = isOnline(currStatus);

      if (!wasOnline && nowOnline) {
        recovered.push(id);
      } else if (wasOnline && !nowOnline) {
        lost.push(id);
      }
    }

    prevSnapshot.current = currentSnapshot;

    // Calculate capability impact for toasts + history
    const caps = computeCapabilities(currentSnapshot);
    const summary = getCapabilitySummary(caps);
    const { recordEvent } = useCapabilityHistoryStore.getState();

    // Record history events + show toasts
    if (recovered.length > 0) {
      const names = recovered.map((id) => INTEGRATION_LABELS[id]).join(', ');

      // Record each recovery in history
      for (const id of recovered) {
        recordEvent({
          integrationId: id,
          previousStatus: prev[id],
          newStatus: currentSnapshot[id],
          capabilitiesAffected: caps.filter((c) => c.dependsOn.includes(id)).length,
          capabilitySummary: summary,
        });
      }

      useToastStore.getState().addToast({
        type: 'success',
        title: `${names} connected`,
        message: `${summary.full}/${summary.total} capabilities fully operational`,
        duration: 6000,
      });
    }

    if (lost.length > 0) {
      const names = lost.map((id) => INTEGRATION_LABELS[id]).join(', ');
      const impacted = summary.degraded + summary.unavailable;

      // Record each loss in history
      for (const id of lost) {
        recordEvent({
          integrationId: id,
          previousStatus: prev[id],
          newStatus: currentSnapshot[id],
          capabilitiesAffected: caps.filter((c) => c.dependsOn.includes(id)).length,
          capabilitySummary: summary,
        });
      }

      useToastStore.getState().addToast({
        type: 'warning',
        title: `${names} disconnected`,
        message: impacted > 0 ? `${impacted} capabilities affected` : undefined,
        duration: 8000,
      });
    }
  }, [integrations]);
}
