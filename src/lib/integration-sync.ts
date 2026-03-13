import { getEngineUrl } from './connection';
import type { IntegrationId, IntegrationStatus } from '../stores/integrationStore';

/**
 * Attempts to sync integration status with the engine.
 * Falls back to local-only operation when engine is unavailable.
 */

function engineUrl(): string | null {
  return getEngineUrl() || null;
}

/**
 * Push integration status to engine (best-effort, non-blocking).
 */
export async function syncStatusToEngine(
  id: IntegrationId,
  status: IntegrationStatus,
  message?: string,
  config?: Record<string, string>,
): Promise<void> {
  const base = engineUrl();
  if (!base) return;

  try {
    await fetch(`${base}/integrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, message, config }),
    });
  } catch {
    // Silent fail — engine not reachable
  }
}

/**
 * Store a secret in the engine vault. Falls back to localStorage.
 */
export async function storeSecret(
  key: string,
  value: string,
  integrationId?: string,
): Promise<'engine' | 'local'> {
  const base = engineUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/integrations/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, integration: integrationId }),
      });
      if (res.ok) return 'engine';
    } catch {
      // Fall through to localStorage
    }
  }

  // Fallback: localStorage (less secure)
  try {
    const raw = localStorage.getItem('aios-secrets') || '{}';
    const secrets = JSON.parse(raw);
    secrets[key] = value;
    localStorage.setItem('aios-secrets', JSON.stringify(secrets));
  } catch { /* empty */ }
  return 'local';
}

/**
 * Retrieve a secret. Tries engine first, then localStorage.
 */
export async function getSecretValue(key: string): Promise<string | null> {
  const base = engineUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/integrations/secrets/${key}`);
      if (res.ok) {
        const data = await res.json() as { exists: boolean; preview: string };
        // Engine only returns preview — for actual value, engine uses it internally
        if (data.exists) return data.preview;
      }
    } catch { /* empty */ }
  }

  // Fallback: localStorage
  try {
    const raw = localStorage.getItem('aios-secrets');
    if (raw) {
      const secrets = JSON.parse(raw);
      return secrets[key] || null;
    }
  } catch { /* empty */ }
  return null;
}

/**
 * Start Google OAuth flow via engine.
 * Returns the authorization URL to redirect the user to.
 */
export async function startGoogleOAuth(
  service: 'google-drive' | 'google-calendar',
): Promise<{ url: string; state: string } | { error: string }> {
  const base = engineUrl();
  if (!base) {
    return { error: 'Engine not configured' };
  }

  const redirectUri = `${window.location.origin}/auth/google/callback`;

  try {
    const res = await fetch(
      `${base}/auth/google/url?service=${service}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    );
    const data = await res.json() as { url?: string; state?: string; error?: string };

    if (data.error) return { error: data.error };
    if (!data.url) return { error: 'No URL returned' };

    // Store state for verification on callback
    sessionStorage.setItem('google-oauth-state', data.state || '');
    sessionStorage.setItem('google-oauth-service', service);

    return { url: data.url, state: data.state || '' };
  } catch {
    return { error: 'Cannot reach engine' };
  }
}

/**
 * Complete Google OAuth flow — exchange code for tokens via engine.
 */
export async function completeGoogleOAuth(
  code: string,
  state: string,
): Promise<{ success: boolean; email?: string; service?: string; error?: string }> {
  const base = engineUrl();
  if (!base) return { success: false, error: 'Engine not configured' };

  const redirectUri = `${window.location.origin}/auth/google/callback`;

  try {
    const res = await fetch(`${base}/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri, state }),
    });
    const data = await res.json() as {
      success?: boolean;
      email?: string;
      service?: string;
      error?: string;
    };

    if (data.success && data.service) {
      // Update localStorage for the SPA health check
      const storageKey = `aios-${data.service}`;
      const existing = (() => {
        try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
        catch { return {}; }
      })();
      localStorage.setItem(storageKey, JSON.stringify({
        ...existing,
        accessToken: true, // just a flag — actual token is in engine vault
        email: data.email,
        connectedAt: Date.now(),
      }));
    }

    return data as { success: boolean; email?: string; service?: string; error?: string };
  } catch {
    return { success: false, error: 'Token exchange failed' };
  }
}

/**
 * Disconnect a Google service.
 */
export async function disconnectGoogle(
  service: 'google-drive' | 'google-calendar',
): Promise<boolean> {
  const base = engineUrl();
  if (base) {
    try {
      await fetch(`${base}/auth/google/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
    } catch { /* empty */ }
  }

  // Clear local flags
  try {
    localStorage.removeItem(`aios-${service}`);
  } catch { /* empty */ }

  return true;
}

/**
 * Check Google auth status from engine.
 */
export async function getGoogleAuthStatus(): Promise<{
  configured: boolean;
  services: Record<string, { connected: boolean; email?: string }>;
} | null> {
  const base = engineUrl();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/auth/google/status`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
