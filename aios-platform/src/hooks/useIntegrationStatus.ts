import { useEffect, useCallback, useRef } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { engineApi } from '../services/api/engine';
import { getEngineUrl } from '../lib/connection';
import { getGoogleAuthStatus } from '../lib/integration-sync';
import type { IntegrationId, IntegrationStatus } from '../stores/integrationStore';

/** Polling interval for server-side health checks (ms) */
const HEALTH_POLL_INTERVAL_MS = 30_000;

/** Response shape from /api/integrations/health */
interface HealthApiResponse {
  integrations: Record<string, {
    status: IntegrationStatus;
    message: string;
    lastChecked: number;
  }>;
}

/**
 * Hook that checks all integration health on mount, polls every 30s,
 * and provides a refresh function.
 *
 * Uses a hybrid approach:
 * - Server-side API route checks env vars and network services
 * - Client-side checks handle localStorage-based state and engine APIs
 *
 * Updates the integration store with live status.
 */
export function useIntegrationStatus() {
  const { integrations, setStatus } = useIntegrationStore();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkEngine = useCallback(async () => {
    const url = getEngineUrl();
    if (!url) {
      setStatus('engine', 'disconnected', 'VITE_ENGINE_URL not configured');
      return;
    }
    setStatus('engine', 'checking');
    try {
      const health = await engineApi.health();
      setStatus('engine', 'connected', `v${health.version} — ${health.ws_clients} WS clients`);
    } catch {
      setStatus('engine', 'error', 'Engine unreachable');
    }
  }, [setStatus]);

  const checkWhatsApp = useCallback(async () => {
    const url = getEngineUrl();
    if (!url) {
      setStatus('whatsapp', 'disconnected', 'Engine not configured');
      return;
    }
    setStatus('whatsapp', 'checking');
    try {
      const res = await fetch(`${url}/whatsapp/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        configured: boolean;
        provider?: string;
        session?: { status?: string };
      };
      if (!data.configured) {
        setStatus('whatsapp', 'disconnected', 'Not configured');
      } else if (data.session?.status === 'WORKING' || data.session?.status === 'CONNECTED') {
        setStatus('whatsapp', 'connected', `${data.provider} — session active`);
      } else {
        setStatus('whatsapp', 'partial', `${data.provider} — configured, session ${data.session?.status || 'unknown'}`);
      }
    } catch {
      setStatus('whatsapp', 'disconnected', 'Engine unavailable');
    }
  }, [setStatus]);

  const checkSupabase = useCallback(async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setStatus('supabase', 'disconnected', 'VITE_SUPABASE_URL or key not set');
      return;
    }
    setStatus('supabase', 'checking');
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      if (res.ok || res.status === 200) {
        setStatus('supabase', 'connected', new URL(url).hostname.split('.')[0]);
      } else {
        setStatus('supabase', 'error', `HTTP ${res.status}`);
      }
    } catch {
      setStatus('supabase', 'error', 'Unreachable');
    }
  }, [setStatus]);

  const checkApiKeys = useCallback(() => {
    try {
      const raw = localStorage.getItem('aios-api-keys');
      const keys = raw ? JSON.parse(raw) : [];
      const count = Array.isArray(keys) ? keys.length : 0;
      if (count > 0) {
        setStatus('api-keys', 'connected', `${count} key${count > 1 ? 's' : ''} configured`);
      } else {
        setStatus('api-keys', 'disconnected', 'No API keys saved');
      }
    } catch {
      setStatus('api-keys', 'disconnected', 'No API keys saved');
    }
  }, [setStatus]);

  const checkVoice = useCallback(() => {
    try {
      const raw = localStorage.getItem('aios-voice-settings');
      if (raw) {
        const data = JSON.parse(raw);
        const state = data?.state;
        const provider = state?.ttsProvider || state?.provider;
        if (provider && provider !== 'browser') {
          setStatus('voice', 'connected', `TTS: ${provider}`);
        } else if (provider === 'browser') {
          setStatus('voice', 'partial', 'Browser TTS (basic)');
        } else {
          setStatus('voice', 'disconnected', 'Not configured');
        }
      } else {
        setStatus('voice', 'disconnected', 'Not configured');
      }
    } catch {
      setStatus('voice', 'disconnected', 'Not configured');
    }
  }, [setStatus]);

  const checkTelegram = useCallback(async () => {
    const url = getEngineUrl();
    if (!url) {
      setStatus('telegram', 'disconnected', 'Engine not configured');
      return;
    }
    setStatus('telegram', 'checking');
    try {
      const res = await fetch(`${url}/telegram/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        configured: boolean;
        bot_username?: string;
        webhook_set?: boolean;
      };
      if (!data.configured) {
        setStatus('telegram', 'disconnected', 'Bot token not configured');
      } else if (data.webhook_set) {
        setStatus('telegram', 'connected', `@${data.bot_username} — webhook active`);
      } else {
        setStatus('telegram', 'partial', `@${data.bot_username} — webhook not set`);
      }
    } catch {
      setStatus('telegram', 'disconnected', 'Engine unavailable');
    }
  }, [setStatus]);

  const checkGoogleServices = useCallback(async () => {
    // Try engine first for authoritative status
    const engineStatus = await getGoogleAuthStatus();
    if (engineStatus) {
      for (const [svc, info] of Object.entries(engineStatus.services)) {
        const id = svc as IntegrationId;
        if (info.connected) {
          setStatus(id, 'connected', info.email || 'Authenticated');
        } else if (engineStatus.configured) {
          setStatus(id, 'partial', 'OAuth configured, not authenticated');
        } else {
          setStatus(id, 'disconnected', 'Not configured on engine');
        }
      }
      return;
    }

    // Fallback: check localStorage
    for (const svc of ['google-drive', 'google-calendar'] as const) {
      try {
        const raw = localStorage.getItem(`aios-${svc}`);
        if (raw) {
          const data = JSON.parse(raw);
          if (data?.accessToken || data?.refreshToken) {
            setStatus(svc, 'connected', data.email || 'Authenticated');
          } else if (data?.clientId) {
            setStatus(svc, 'partial', 'Client ID set, not authenticated');
          } else {
            setStatus(svc, 'disconnected', 'Not configured');
          }
        } else {
          setStatus(svc, 'disconnected', 'Not configured');
        }
      } catch {
        setStatus(svc, 'disconnected', 'Not configured');
      }
    }
  }, [setStatus]);

  const checkAll = useCallback(async () => {
    // Run local checks sync
    checkApiKeys();
    checkVoice();
    // Run network checks in parallel
    await Promise.allSettled([checkEngine(), checkWhatsApp(), checkSupabase(), checkTelegram(), checkGoogleServices()]);
  }, [checkEngine, checkWhatsApp, checkSupabase, checkApiKeys, checkVoice, checkTelegram, checkGoogleServices]);

  const checkOne = useCallback(async (id: IntegrationId) => {
    switch (id) {
      case 'engine': return checkEngine();
      case 'whatsapp': return checkWhatsApp();
      case 'supabase': return checkSupabase();
      case 'api-keys': return checkApiKeys();
      case 'voice': return checkVoice();
      case 'telegram': return checkTelegram();
      case 'google-drive':
      case 'google-calendar': return checkGoogleServices();
    }
  }, [checkEngine, checkWhatsApp, checkSupabase, checkApiKeys, checkVoice, checkTelegram, checkGoogleServices]);

  // Check all on mount
  useEffect(() => {
    checkAll();
  }, [checkAll]);

  return { integrations, checkAll, checkOne };
}
