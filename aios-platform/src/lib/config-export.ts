/**
 * Config Export / Import — P2 plug-and-play feature.
 *
 * Exports a JSON snapshot of all integration configs and localStorage keys
 * that a new installation needs to be pre-configured.
 * NEVER includes secrets (API keys, tokens) — only structure & non-sensitive values.
 */

import { useIntegrationStore, type IntegrationId } from '../stores/integrationStore';

// ── Types ──────────────────────────────────────────────────

export interface ConfigExport {
  version: 1;
  exportedAt: string;
  platform: string;
  integrations: Record<IntegrationId, IntegrationSnapshot>;
  settings: SettingsSnapshot;
}

interface IntegrationSnapshot {
  status: string;
  config: Record<string, string>;
}

interface SettingsSnapshot {
  theme: string | null;
  voiceProvider: string | null;
  engineUrl: string | null;
  supabaseUrl: string | null;
}

// ── Safe localStorage read ─────────────────────────────────

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeGetJSON<T>(key: string): T | null {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Build Export ───────────────────────────────────────────

export function buildConfigExport(): ConfigExport {
  const { integrations } = useIntegrationStore.getState();

  const integrationSnapshots = {} as Record<IntegrationId, IntegrationSnapshot>;
  for (const [id, entry] of Object.entries(integrations)) {
    integrationSnapshots[id as IntegrationId] = {
      status: entry.status,
      // Export config but redact any key-like values
      config: redactSecrets(entry.config),
    };
  }

  // Read voice provider (non-sensitive)
  const voiceData = safeGetJSON<{ state?: { ttsProvider?: string; provider?: string } }>('aios-voice-settings');
  const voiceProvider = voiceData?.state?.ttsProvider || voiceData?.state?.provider || null;

  // Read theme
  const uiStore = safeGetJSON<{ state?: { theme?: string } }>('aios-ui-store');
  const theme = uiStore?.state?.theme || null;

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    platform: 'aios-platform',
    integrations: integrationSnapshots,
    settings: {
      theme,
      voiceProvider,
      engineUrl: import.meta.env.VITE_ENGINE_URL || null,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || null,
    },
  };
}

// ── Redact secrets from config values ─────────────────────

const SECRET_PATTERNS = /key|token|secret|password|auth/i;

function redactSecrets(config: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    result[k] = SECRET_PATTERNS.test(k) ? '***REDACTED***' : v;
  }
  return result;
}

// ── Download as JSON ──────────────────────────────────────

export function downloadConfigExport(): void {
  const data = buildConfigExport();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `aios-config-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// ── Parse Import ──────────────────────────────────────────

export function parseConfigImport(jsonStr: string): ConfigExport | { error: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (data?.version !== 1 || data?.platform !== 'aios-platform') {
      return { error: 'Invalid config file format' };
    }
    if (!data.integrations) {
      return { error: 'Missing integrations data' };
    }
    return data as ConfigExport;
  } catch {
    return { error: 'Invalid JSON' };
  }
}

// ── Apply Import ──────────────────────────────────────────

export function applyConfigImport(config: ConfigExport): { applied: string[]; skipped: string[] } {
  const applied: string[] = [];
  const skipped: string[] = [];
  const store = useIntegrationStore.getState();

  // Apply integration configs (non-redacted values only)
  for (const [id, snap] of Object.entries(config.integrations)) {
    const cleanConfig: Record<string, string> = {};
    let hasValues = false;
    for (const [k, v] of Object.entries(snap.config)) {
      if (v !== '***REDACTED***') {
        cleanConfig[k] = v;
        hasValues = true;
      }
    }
    if (hasValues) {
      store.setConfig(id as IntegrationId, cleanConfig);
      applied.push(id);
    } else {
      skipped.push(id);
    }
  }

  // Apply voice provider
  if (config.settings.voiceProvider) {
    try {
      const existing = safeGetJSON<Record<string, unknown>>('aios-voice-settings') || {};
      localStorage.setItem('aios-voice-settings', JSON.stringify({
        ...existing,
        state: { ...(existing.state as Record<string, unknown> || {}), ttsProvider: config.settings.voiceProvider, provider: config.settings.voiceProvider },
      }));
      applied.push('voice-provider');
    } catch {
      skipped.push('voice-provider');
    }
  }

  // Apply theme
  if (config.settings.theme) {
    try {
      const existing = safeGetJSON<Record<string, unknown>>('aios-ui-store') || {};
      const state = (existing.state as Record<string, unknown>) || {};
      localStorage.setItem('aios-ui-store', JSON.stringify({
        ...existing,
        state: { ...state, theme: config.settings.theme },
      }));
      applied.push('theme');
    } catch {
      skipped.push('theme');
    }
  }

  return { applied, skipped };
}
