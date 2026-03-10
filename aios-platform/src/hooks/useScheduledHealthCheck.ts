/**
 * useScheduledHealthCheck — P8 Scheduled Health Polling
 *
 * Runs periodic health probes at the configured interval.
 * Applies exponential backoff for repeatedly-failing integrations.
 * Records results in healthMonitorStore for uptime tracking.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useHealthMonitorStore } from '../stores/healthMonitorStore';
import { useIntegrationStore, type IntegrationId } from '../stores/integrationStore';
import { probeIntegration } from './useHealthCheck';

const ALL_INTEGRATIONS: IntegrationId[] = [
  'engine', 'supabase', 'api-keys', 'whatsapp',
  'telegram', 'voice', 'google-drive', 'google-calendar',
];

export function useScheduledHealthCheck() {
  const enabled = useHealthMonitorStore((s) => s.enabled);
  const intervalSeconds = useHealthMonitorStore((s) => s.intervalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const runPoll = useCallback(async () => {
    const monitor = useHealthMonitorStore.getState();
    const integrations = useIntegrationStore.getState().integrations;

    monitor.recordPollTimestamp();
    pollCountRef.current += 1;

    // Determine which integrations to check this cycle
    // Apply backoff: only check failing integrations every N cycles
    const toCheck = ALL_INTEGRATIONS.filter((id) => {
      const multiplier = monitor.getBackoffMultiplier(id);
      if (multiplier <= 1) return true;
      // Check on every Nth poll cycle
      return pollCountRef.current % multiplier === 0;
    });

    // Probe in parallel
    const results = await Promise.allSettled(
      toCheck.map(async (id) => {
        // Skip if currently checking
        if (integrations[id]?.status === 'checking') return;

        const result = await probeIntegration(id);
        monitor.recordPollResult(id, result.ok);
        return result;
      }),
    );

    return results;
  }, []);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) return;

    // Run initial poll after a short delay (don't overlap with mount checks)
    const initialDelay = setTimeout(() => {
      runPoll();
      // Then set up recurring interval
      timerRef.current = setInterval(runPoll, intervalSeconds * 1000);
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, intervalSeconds, runPoll]);

  return {
    /** Force a manual poll cycle */
    pollNow: runPoll,
    /** Current poll count */
    pollCount: pollCountRef.current,
  };
}
