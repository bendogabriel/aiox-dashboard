import { useMemo } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { useUIStore } from '../stores/uiStore';
import {
  computeCapabilities,
  getViewCapabilities,
  getCapabilitySummary,
  type Capability,
  type CapabilityInfo,
  type CapabilityLevel,
} from '../lib/degradation-map';
import type { IntegrationId, IntegrationStatus } from '../stores/integrationStore';

/**
 * Hook that returns current capabilities based on integration status.
 * Recomputes whenever integration statuses change.
 */
export function useCapabilities() {
  const integrations = useIntegrationStore((s) => s.integrations);

  const statusMap = useMemo(() => {
    const map = {} as Record<IntegrationId, IntegrationStatus>;
    for (const [id, entry] of Object.entries(integrations)) {
      map[id as IntegrationId] = entry.status;
    }
    return map;
  }, [integrations]);

  const capabilities = useMemo(() => computeCapabilities(statusMap), [statusMap]);
  const summary = useMemo(() => getCapabilitySummary(capabilities), [capabilities]);

  const isAvailable = useMemo(() => {
    const map = new Map<Capability, boolean>();
    for (const cap of capabilities) {
      map.set(cap.id, cap.level !== 'unavailable');
    }
    return (id: Capability) => map.get(id) ?? false;
  }, [capabilities]);

  const getLevel = useMemo(() => {
    const map = new Map<Capability, CapabilityLevel>();
    for (const cap of capabilities) {
      map.set(cap.id, cap.level);
    }
    return (id: Capability) => map.get(id) ?? 'unavailable';
  }, [capabilities]);

  return { capabilities, summary, isAvailable, getLevel, statusMap };
}

/**
 * Hook that returns capabilities relevant to the current view.
 */
export function useViewCapabilities() {
  const currentView = useUIStore((s) => s.currentView);
  const { statusMap } = useCapabilities();

  const viewCaps = useMemo(
    () => getViewCapabilities(statusMap, currentView),
    [statusMap, currentView],
  );

  const summary = useMemo(() => getCapabilitySummary(viewCaps), [viewCaps]);

  const hasUnavailable = summary.unavailable > 0;
  const hasDegraded = summary.degraded > 0;
  const allGood = !hasUnavailable && !hasDegraded;

  return {
    capabilities: viewCaps,
    summary,
    hasUnavailable,
    hasDegraded,
    allGood,
    currentView,
  };
}
