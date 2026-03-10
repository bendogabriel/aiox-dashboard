import { Hono } from 'hono';
import { log } from '../lib/logger';
import { setSecret, getSecret, deleteSecret } from '../lib/secrets';

// ============================================================
// Google OAuth 2.0 — Server-side token exchange
// Handles PKCE flow callback, token refresh, and status checks.
// Supports multiple Google services (Drive, Calendar, etc.)
// ============================================================

const googleAuth = new Hono();

// ── Config ───────────────────────────────────────────────

const GOOGLE_CLIENT_ID = () => process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = () => process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

// Service-specific scopes
const SERVICE_SCOPES: Record<string, string[]> = {
  'google-drive': [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
  'google-calendar': [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
};

function isConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID() && GOOGLE_CLIENT_SECRET());
}

// ── Routes ───────────────────────────────────────────────

// GET /auth/google/status — Check if Google OAuth is configured and which services are connected
googleAuth.get('/status', (c) => {
  const services: Record<string, { connected: boolean; email?: string }> = {};

  for (const svc of Object.keys(SERVICE_SCOPES)) {
    const refreshToken = getSecret(`${svc}-refresh-token`);
    const email = getSecret(`${svc}-email`);
    services[svc] = {
      connected: !!refreshToken,
      email: email || undefined,
    };
  }

  return c.json({
    configured: isConfigured(),
    client_id: GOOGLE_CLIENT_ID() ? `${GOOGLE_CLIENT_ID().slice(0, 12)}...` : null,
    services,
  });
});

// GET /auth/google/url — Generate authorization URL for a service
googleAuth.get('/url', (c) => {
  const service = c.req.query('service');
  if (!service || !SERVICE_SCOPES[service]) {
    return c.json({ error: `Invalid service. Available: ${Object.keys(SERVICE_SCOPES).join(', ')}` }, 400);
  }

  if (!isConfigured()) {
    return c.json({ error: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured' }, 400);
  }

  const redirectUri = c.req.query('redirect_uri');
  if (!redirectUri) {
    return c.json({ error: 'redirect_uri query parameter is required' }, 400);
  }

  const state = JSON.stringify({ service, ts: Date.now() });
  const scopes = [
    'openid',
    'email',
    'profile',
    ...SERVICE_SCOPES[service],
  ];

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return c.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state,
  });
});

// POST /auth/google/callback — Exchange authorization code for tokens
googleAuth.post('/callback', async (c) => {
  const body = await c.req.json<{
    code: string;
    redirect_uri: string;
    state?: string;
  }>();

  if (!body.code || !body.redirect_uri) {
    return c.json({ error: 'code and redirect_uri are required' }, 400);
  }

  if (!isConfigured()) {
    return c.json({ error: 'Google OAuth not configured on engine' }, 400);
  }

  // Parse state to determine service
  let service = 'google-drive'; // default
  if (body.state) {
    try {
      const parsed = JSON.parse(body.state);
      if (parsed.service && SERVICE_SCOPES[parsed.service]) {
        service = parsed.service;
      }
    } catch { /* ignore */ }
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: body.code,
        client_id: GOOGLE_CLIENT_ID(),
        client_secret: GOOGLE_CLIENT_SECRET(),
        redirect_uri: body.redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (tokens.error) {
      log.error('Google token exchange failed', { error: tokens.error, description: tokens.error_description });
      return c.json({ error: tokens.error_description || tokens.error }, 400);
    }

    if (!tokens.access_token) {
      return c.json({ error: 'No access token received' }, 400);
    }

    // Get user info
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json() as { email?: string; name?: string; picture?: string };

    // Store tokens in secrets vault
    setSecret(`${service}-access-token`, tokens.access_token, service);
    if (tokens.refresh_token) {
      setSecret(`${service}-refresh-token`, tokens.refresh_token, service);
    }
    if (user.email) {
      setSecret(`${service}-email`, user.email, service);
    }

    const expiresAt = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;

    log.info('Google OAuth completed', { service, email: user.email });

    return c.json({
      success: true,
      service,
      email: user.email,
      name: user.name,
      picture: user.picture,
      expires_at: expiresAt,
      has_refresh_token: !!tokens.refresh_token,
    });
  } catch (err) {
    log.error('Google OAuth callback failed', { error: (err as Error).message });
    return c.json({ error: 'Token exchange failed' }, 500);
  }
});

// POST /auth/google/refresh — Refresh an access token
googleAuth.post('/refresh', async (c) => {
  const body = await c.req.json<{ service: string }>();
  const service = body.service;

  if (!service || !SERVICE_SCOPES[service]) {
    return c.json({ error: 'Invalid service' }, 400);
  }

  const refreshToken = getSecret(`${service}-refresh-token`);
  if (!refreshToken) {
    return c.json({ error: 'No refresh token stored. Re-authenticate.' }, 400);
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID(),
        client_secret: GOOGLE_CLIENT_SECRET(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await tokenRes.json() as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (tokens.error || !tokens.access_token) {
      // Refresh token may have been revoked
      log.warn('Google token refresh failed', { service, error: tokens.error });
      return c.json({ error: tokens.error_description || 'Refresh failed. Re-authenticate.' }, 400);
    }

    setSecret(`${service}-access-token`, tokens.access_token, service);
    const expiresAt = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;

    log.info('Google token refreshed', { service });
    return c.json({ success: true, expires_at: expiresAt });
  } catch (err) {
    log.error('Google token refresh error', { error: (err as Error).message });
    return c.json({ error: 'Refresh failed' }, 500);
  }
});

// POST /auth/google/disconnect — Revoke tokens and remove from vault
googleAuth.post('/disconnect', async (c) => {
  const body = await c.req.json<{ service: string }>();
  const service = body.service;

  if (!service || !SERVICE_SCOPES[service]) {
    return c.json({ error: 'Invalid service' }, 400);
  }

  // Try to revoke the token
  const accessToken = getSecret(`${service}-access-token`);
  if (accessToken) {
    try {
      await fetch(`${GOOGLE_REVOKE_URL}?token=${accessToken}`, { method: 'POST' });
    } catch {
      // Best effort — token may already be expired
    }
  }

  // Remove from vault
  deleteSecret(`${service}-access-token`);
  deleteSecret(`${service}-refresh-token`);
  deleteSecret(`${service}-email`);

  log.info('Google service disconnected', { service });
  return c.json({ success: true, service });
});

// GET /auth/google/token — Get current access token for a service (internal use)
googleAuth.get('/token', async (c) => {
  const service = c.req.query('service');
  if (!service || !SERVICE_SCOPES[service]) {
    return c.json({ error: 'Invalid service' }, 400);
  }

  const accessToken = getSecret(`${service}-access-token`);
  if (!accessToken) {
    return c.json({ error: 'Not authenticated', authenticated: false }, 401);
  }

  return c.json({
    authenticated: true,
    access_token: accessToken,
    service,
  });
});

export { googleAuth };
