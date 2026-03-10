import { useEffect, useCallback } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { engineApi } from '../services/api/engine';
import { getEngineUrl } from '../lib/connection';
import type { IntegrationId } from '../stores/integrationStore';

/**
 * Hook that checks all integration health on mount and provides a refresh function.
 * Updates the integration store with live status.
 */
export function useIntegrationStatus() {
  const { integrations, setStatus } = useIntegrationStore();

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

  const checkAll = useCallback(async () => {
    // Run network checks in parallel, local checks sync
    checkApiKeys();
    checkVoice();
    await Promise.allSettled([checkEngine(), checkWhatsApp(), checkSupabase()]);
  }, [checkEngine, checkWhatsApp, checkSupabase, checkApiKeys, checkVoice]);

  const checkOne = useCallback(async (id: IntegrationId) => {
    switch (id) {
      case 'engine': return checkEngine();
      case 'whatsapp': return checkWhatsApp();
      case 'supabase': return checkSupabase();
      case 'api-keys': return checkApiKeys();
      case 'voice': return checkVoice();
    }
  }, [checkEngine, checkWhatsApp, checkSupabase, checkApiKeys, checkVoice]);

  // Check all on mount
  useEffect(() => {
    checkAll();
  }, [checkAll]);

  return { integrations, checkAll, checkOne };
}
