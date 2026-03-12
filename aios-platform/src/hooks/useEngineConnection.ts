import { useEffect, useRef, useCallback } from 'react';
import { useEngineStore } from '../stores/engineStore';
import { getEngineUrl, discoverEngineUrl, clearDiscoveryCache } from '../lib/connection';
import type { EngineHealthData } from '../stores/engineStore';

const HEALTH_INTERVAL_MS = 15_000; // 15s when online
const MAX_BACKOFF_MS = 60_000; // 1 min max between retries
const HEALTH_TIMEOUT_MS = 3_000;

/**
 * Hook that manages engine connection lifecycle:
 * 1. Auto-discovers engine URL if not configured
 * 2. Polls /health at regular intervals
 * 3. Exponential backoff on failures
 * 4. Updates engineStore with connection status
 */
export function useEngineConnection() {
  const { status, url, health, failCount, setOnline, setOffline, setDiscovering } = useEngineStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const checkHealth = useCallback(async (engineUrl: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      const res = await fetch(`${engineUrl}/health`, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        setOffline(`HTTP ${res.status}`);
        return false;
      }

      const data = (await res.json()) as EngineHealthData;
      if (!mountedRef.current) return false;

      setOnline(engineUrl, data);
      return true;
    } catch {
      if (mountedRef.current) setOffline();
      return false;
    }
  }, [setOnline, setOffline]);

  const discover = useCallback(async () => {
    // If URL is already configured via env, skip discovery
    const configuredUrl = getEngineUrl();
    if (configuredUrl) {
      await checkHealth(configuredUrl);
      return;
    }

    // Auto-discover
    setDiscovering();
    const found = await discoverEngineUrl();
    if (!mountedRef.current) return;

    if (found) {
      await checkHealth(found);
    } else {
      setOffline('No engine found. Set VITE_ENGINE_URL or start the engine.');
    }
  }, [checkHealth, setDiscovering, setOffline]);

  const scheduleNext = useCallback(() => {
    if (!mountedRef.current) return;

    const currentFailCount = useEngineStore.getState().failCount;
    const delay = currentFailCount === 0
      ? HEALTH_INTERVAL_MS
      : Math.min(HEALTH_INTERVAL_MS * Math.pow(1.5, currentFailCount), MAX_BACKOFF_MS);

    timerRef.current = setTimeout(async () => {
      const engineUrl = getEngineUrl();
      if (engineUrl) {
        await checkHealth(engineUrl);
      } else {
        // Re-attempt discovery
        clearDiscoveryCache();
        await discover();
      }
      scheduleNext();
    }, delay);
  }, [checkHealth, discover]);

  // Initial discovery + start polling loop
  useEffect(() => {
    mountedRef.current = true;

    discover().then(() => {
      scheduleNext();
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [discover, scheduleNext]);

  /** Force an immediate health check */
  const refresh = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const engineUrl = getEngineUrl();
    if (engineUrl) {
      await checkHealth(engineUrl);
    } else {
      clearDiscoveryCache();
      await discover();
    }
    scheduleNext();
  }, [checkHealth, discover, scheduleNext]);

  return { status, url, health, failCount, refresh };
}
