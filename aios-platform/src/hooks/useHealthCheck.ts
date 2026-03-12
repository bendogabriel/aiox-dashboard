import { useCallback, useRef, useState } from 'react';
import { useIntegrationStore, type IntegrationId } from '../stores/integrationStore';
import { getEngineUrl, discoverEngineUrl, clearDiscoveryCache } from '../lib/connection';

const PROBE_TIMEOUT_MS = 4000;

/**
 * Probe functions for each integration.
 * Returns { ok, message } or throws.
 */
const probes: Record<IntegrationId, () => Promise<{ ok: boolean; msg: string }>> = {
  engine: async () => {
    let url = getEngineUrl();
    if (!url) {
      clearDiscoveryCache();
      url = await discoverEngineUrl() ?? undefined;
    }
    if (!url) return { ok: false, msg: 'No engine found' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, msg: `HTTP ${res.status}` };
      const data = (await res.json()) as { status: string; version?: string };
      return { ok: data.status === 'ok' || data.status === 'healthy', msg: data.version ? `v${data.version}` : 'Connected' };
    } catch {
      clearTimeout(timer);
      return { ok: false, msg: 'Unreachable' };
    }
  },

  supabase: async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return { ok: false, msg: 'Not configured' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok
        ? { ok: true, msg: `Connected to ${new URL(url).hostname}` }
        : { ok: false, msg: `HTTP ${res.status}` };
    } catch {
      clearTimeout(timer);
      return { ok: false, msg: 'Unreachable' };
    }
  },

  'api-keys': async () => {
    try {
      const raw = localStorage.getItem('aios-api-keys');
      const keys = raw ? JSON.parse(raw) : [];
      return keys.length > 0
        ? { ok: true, msg: `${keys.length} key(s) configured` }
        : { ok: false, msg: 'No API keys' };
    } catch {
      return { ok: false, msg: 'Error reading keys' };
    }
  },

  whatsapp: async () => {
    const url = getEngineUrl();
    if (!url) return { ok: false, msg: 'Engine offline' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/integrations/whatsapp/status`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, msg: 'Not configured' };
      const data = (await res.json()) as { connected?: boolean };
      return data.connected ? { ok: true, msg: 'Connected' } : { ok: false, msg: 'Disconnected' };
    } catch {
      clearTimeout(timer);
      return { ok: false, msg: 'Unavailable' };
    }
  },

  telegram: async () => {
    const url = getEngineUrl();
    if (!url) return { ok: false, msg: 'Engine offline' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/integrations/telegram/status`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, msg: 'Not configured' };
      const data = (await res.json()) as { connected?: boolean };
      return data.connected ? { ok: true, msg: 'Connected' } : { ok: false, msg: 'Disconnected' };
    } catch {
      clearTimeout(timer);
      return { ok: false, msg: 'Unavailable' };
    }
  },

  voice: async () => {
    // Voice is available if speechSynthesis API is present or ElevenLabs key is configured
    if (typeof speechSynthesis !== 'undefined') {
      return { ok: true, msg: 'Browser TTS available' };
    }
    return { ok: false, msg: 'No speech synthesis' };
  },

  'google-drive': async () => {
    const url = getEngineUrl();
    if (!url) return { ok: false, msg: 'Engine offline' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/integrations/google-drive/status`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, msg: 'Not configured' };
      const data = (await res.json()) as { connected?: boolean };
      return data.connected ? { ok: true, msg: 'Connected' } : { ok: false, msg: 'Disconnected' };
    } catch {
      clearTimeout(timer);
      return { ok: false, msg: 'Unavailable' };
    }
  },

  'google-calendar': async () => {
    const url = getEngineUrl();
    if (!url) return { ok: false, msg: 'Engine offline' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/integrations/google-calendar/status`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, msg: 'Not configured' };
      const data = (await res.json()) as { connected?: boolean };
      return data.connected ? { ok: true, msg: 'Connected' } : { ok: false, msg: 'Disconnected' };
    } catch {
      clearTimeout(timer);
      return { ok: false, msg: 'Unavailable' };
    }
  },
};

export type HealthCheckResult = {
  id: IntegrationId;
  ok: boolean;
  msg: string;
  previousStatus: string;
  newStatus: string;
};

/**
 * Centralized health-check hook.
 * Provides `checkOne(id)` and `checkAll()` that probe integrations
 * and update the integration store.
 */
export function useHealthCheck() {
  const setStatus = useIntegrationStore((s) => s.setStatus);
  const [checking, setChecking] = useState(false);
  const abortRef = useRef(false);

  const checkOne = useCallback(async (id: IntegrationId): Promise<HealthCheckResult> => {
    const prevStatus = useIntegrationStore.getState().integrations[id].status;
    setStatus(id, 'checking');

    const probe = probes[id];
    const result = await probe();
    const newStatus = result.ok ? 'connected' : 'disconnected';

    if (!abortRef.current) {
      setStatus(id, newStatus, result.msg);
    }

    return { id, ok: result.ok, msg: result.msg, previousStatus: prevStatus, newStatus };
  }, [setStatus]);

  const checkAll = useCallback(async (): Promise<HealthCheckResult[]> => {
    setChecking(true);
    abortRef.current = false;

    const ids = Object.keys(probes) as IntegrationId[];
    const results = await Promise.all(ids.map((id) => checkOne(id)));

    if (!abortRef.current) {
      setChecking(false);
    }
    return results;
  }, [checkOne]);

  const checkMany = useCallback(async (ids: IntegrationId[]): Promise<HealthCheckResult[]> => {
    setChecking(true);
    abortRef.current = false;

    const results = await Promise.all(ids.map((id) => checkOne(id)));

    if (!abortRef.current) {
      setChecking(false);
    }
    return results;
  }, [checkOne]);

  return { checkOne, checkAll, checkMany, checking };
}

/**
 * Non-hook version for imperative use (e.g., inside store actions or callbacks).
 * Directly probes an integration and updates the store.
 */
export async function probeIntegration(id: IntegrationId): Promise<HealthCheckResult> {
  const store = useIntegrationStore.getState();
  const prevStatus = store.integrations[id].status;
  store.setStatus(id, 'checking');

  const probe = probes[id];
  const result = await probe();
  const newStatus = result.ok ? 'connected' : 'disconnected';

  store.setStatus(id, newStatus, result.msg);
  return { id, ok: result.ok, msg: result.msg, previousStatus: prevStatus, newStatus };
}

/**
 * Probe all integrations imperatively.
 */
export async function probeAllIntegrations(): Promise<HealthCheckResult[]> {
  const ids = Object.keys(probes) as IntegrationId[];
  return Promise.all(ids.map((id) => probeIntegration(id)));
}
