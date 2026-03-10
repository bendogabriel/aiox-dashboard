/**
 * Connection Mode Detection + Engine Auto-Discovery
 *
 * Priority:
 * 1. Cloud mode (relay URL + room + token)
 * 2. Engine mode (VITE_ENGINE_URL or auto-discovered URL)
 * 3. Local mode (monitor server fallback)
 *
 * Auto-discovery probes multiple candidate URLs when VITE_ENGINE_URL is not set.
 */

export type ConnectionMode = 'local' | 'cloud' | 'engine';

export interface ConnectionConfig {
  mode: ConnectionMode;
  /** WebSocket URL for event streaming */
  wsUrl: string;
  /** HTTP URL for REST API calls */
  httpUrl: string;
  /** Room ID (cloud mode only) */
  roomId?: string;
  /** Auth token (cloud mode only) */
  token?: string;
}

const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || 'http://localhost:4001';
const ENGINE_URL = import.meta.env.VITE_ENGINE_URL as string | undefined;
const RELAY_URL = import.meta.env.VITE_RELAY_URL as string | undefined;
const RELAY_HTTP_URL = import.meta.env.VITE_RELAY_HTTP_URL as string | undefined;

// ── Auto-Discovery ─────────────────────────────────────────

const DISCOVERY_CACHE_KEY = 'aios-engine-discovered-url';
const DISCOVERY_TIMEOUT_MS = 2000;

/** Candidate URLs to probe when VITE_ENGINE_URL is not set */
function getDiscoveryCandidates(): string[] {
  const candidates: string[] = [];
  const { origin, hostname } = window.location;

  // Same origin (co-located: engine serves the dashboard)
  candidates.push(origin);

  // Common local dev ports
  const localPorts = [4002, 4001, 8002];
  for (const port of localPorts) {
    candidates.push(`http://${hostname}:${port}`);
    if (hostname !== 'localhost') {
      candidates.push(`http://localhost:${port}`);
    }
  }

  return [...new Set(candidates)]; // deduplicate
}

/** Probe a URL for a valid engine /health response */
async function probeEngine(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);
    const res = await fetch(`${url}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json() as { status?: string };
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

let discoveryPromise: Promise<string | null> | null = null;
let discoveredUrl: string | null = null;

/**
 * Auto-discover engine URL by probing candidates.
 * Returns the first responsive URL, or null if none found.
 * Result is cached in sessionStorage for the browser tab lifetime.
 */
export async function discoverEngineUrl(): Promise<string | null> {
  // Return cached result
  if (discoveredUrl) return discoveredUrl;

  // Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(DISCOVERY_CACHE_KEY);
    if (cached) {
      discoveredUrl = cached;
      return cached;
    }
  } catch { /* storage unavailable */ }

  // Deduplicate concurrent discovery calls
  if (discoveryPromise) return discoveryPromise;

  discoveryPromise = (async () => {
    const candidates = getDiscoveryCandidates();

    // Race all candidates — first to respond wins
    const result = await Promise.any(
      candidates.map(async (url) => {
        const ok = await probeEngine(url);
        if (ok) return url;
        throw new Error('not reachable');
      }),
    ).catch(() => null);

    if (result) {
      discoveredUrl = result;
      try { sessionStorage.setItem(DISCOVERY_CACHE_KEY, result); } catch { /* */ }
    }

    discoveryPromise = null;
    return result;
  })();

  return discoveryPromise;
}

/** Clear the discovery cache (forces re-probe on next call) */
export function clearDiscoveryCache(): void {
  discoveredUrl = null;
  try { sessionStorage.removeItem(DISCOVERY_CACHE_KEY); } catch { /* */ }
}

// ── Public API ─────────────────────────────────────────────

/** Check if we're in cloud mode */
export function isCloudMode(): boolean {
  return !!RELAY_URL;
}

/** Get connection config based on URL params and env */
export function getConnectionConfig(): ConnectionConfig {
  // Check URL for room parameter
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || undefined;
  let storedToken: string | null = null;
  try { storedToken = localStorage.getItem('aios_token'); } catch { /* storage unavailable */ }
  const token = urlParams.get('token') || storedToken || undefined;

  // Cloud mode: relay URL configured and room ID provided
  if (RELAY_URL && roomId && token) {
    return {
      mode: 'cloud',
      wsUrl: `${RELAY_URL}/dashboard?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`,
      httpUrl: RELAY_HTTP_URL || RELAY_URL.replace(/^ws/, 'http'),
      roomId,
      token,
    };
  }

  const engineUrl = getEngineUrl();

  // Engine mode: direct to execution engine (port 4002, WS at /live)
  if (engineUrl) {
    return {
      mode: 'engine',
      wsUrl: `${engineUrl.replace(/^http/, 'ws')}/live`,
      httpUrl: engineUrl,
    };
  }

  // Local mode: direct to monitor server
  return {
    mode: 'local',
    wsUrl: `${MONITOR_URL.replace(/^http/, 'ws')}/stream`,
    httpUrl: MONITOR_URL,
  };
}

/**
 * Get the engine HTTP URL.
 * Returns configured URL, discovered URL (from cache), or undefined.
 */
export function getEngineUrl(): string | undefined {
  return ENGINE_URL || discoveredUrl || undefined;
}

/**
 * Check if an engine URL is available (configured or discovered).
 * For async discovery, use discoverEngineUrl() first.
 */
export function engineAvailable(): boolean {
  return !!getEngineUrl();
}

/** Store auth token */
export function setAuthToken(token: string): void {
  try { localStorage.setItem('aios_token', token); } catch { /* storage unavailable */ }
}

/** Get stored auth token */
export function getAuthToken(): string | null {
  try { return localStorage.getItem('aios_token'); } catch { return null; }
}

/** Clear auth token */
export function clearAuthToken(): void {
  try { localStorage.removeItem('aios_token'); } catch { /* storage unavailable */ }
}
