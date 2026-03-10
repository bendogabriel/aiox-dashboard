import { NextResponse } from 'next/server';

/**
 * GET /api/integrations/health
 *
 * Checks real health status for all platform integrations.
 * Returns boolean/status indicators -- never exposes actual secrets or keys.
 */

interface IntegrationHealthResult {
  status: 'connected' | 'disconnected' | 'error' | 'partial';
  message: string;
  lastChecked: number;
}

const TIMEOUT_MS = 3000;

/** Fetch with a timeout */
async function fetchWithTimeout(
  url: string,
  opts?: RequestInit,
  timeoutMs = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Check AIOS Engine at localhost:4002/health */
async function checkEngine(): Promise<IntegrationHealthResult> {
  const now = Date.now();
  const engineUrl = process.env.VITE_ENGINE_URL || 'http://localhost:4002';
  try {
    const res = await fetchWithTimeout(`${engineUrl}/health`);
    if (!res.ok) {
      return { status: 'error', message: `HTTP ${res.status}`, lastChecked: now };
    }
    const data = (await res.json()) as { status?: string; version?: string; ws_clients?: number };
    if (data?.status === 'ok') {
      const msg = data.version
        ? `v${data.version} -- ${data.ws_clients ?? 0} WS clients`
        : 'Engine running';
      return { status: 'connected', message: msg, lastChecked: now };
    }
    return { status: 'error', message: 'Unexpected response', lastChecked: now };
  } catch {
    return { status: 'disconnected', message: 'Engine unreachable', lastChecked: now };
  }
}

/** Check Supabase REST endpoint */
async function checkSupabase(): Promise<IntegrationHealthResult> {
  const now = Date.now();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { status: 'disconnected', message: 'SUPABASE_URL or key not set', lastChecked: now };
  }

  try {
    const res = await fetchWithTimeout(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (res.ok || res.status === 200) {
      const hostname = new URL(url).hostname.split('.')[0];
      return { status: 'connected', message: hostname, lastChecked: now };
    }
    return { status: 'error', message: `HTTP ${res.status}`, lastChecked: now };
  } catch {
    return { status: 'error', message: 'Unreachable', lastChecked: now };
  }
}

/** Check if LLM API keys exist in environment */
function checkApiKeys(): IntegrationHealthResult {
  const now = Date.now();
  const keys: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) keys.push('Anthropic');
  if (process.env.CLAUDE_API_KEY) keys.push('Claude');
  if (process.env.OPENAI_API_KEY) keys.push('OpenAI');

  if (keys.length > 0) {
    return {
      status: 'connected',
      message: `${keys.join(', ')} configured`,
      lastChecked: now,
    };
  }
  return { status: 'disconnected', message: 'No API keys found in env', lastChecked: now };
}

/** Check WhatsApp (WAHA) */
async function checkWhatsApp(): Promise<IntegrationHealthResult> {
  const now = Date.now();
  const wahaUrl = process.env.WAHA_URL;

  if (!wahaUrl) {
    return { status: 'disconnected', message: 'WAHA_URL not set', lastChecked: now };
  }

  try {
    const res = await fetchWithTimeout(`${wahaUrl}/api/sessions`, undefined, TIMEOUT_MS);
    if (res.ok) {
      return { status: 'connected', message: 'WAHA reachable', lastChecked: now };
    }
    return { status: 'partial', message: `WAHA configured, HTTP ${res.status}`, lastChecked: now };
  } catch {
    return { status: 'partial', message: 'WAHA configured, unreachable', lastChecked: now };
  }
}

/** Check Telegram bot token */
function checkTelegram(): IntegrationHealthResult {
  const now = Date.now();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    return { status: 'connected', message: 'Bot token configured', lastChecked: now };
  }
  return { status: 'disconnected', message: 'TELEGRAM_BOT_TOKEN not set', lastChecked: now };
}

/** Check Voice/TTS provider */
function checkVoice(): IntegrationHealthResult {
  const now = Date.now();
  const providers: string[] = [];
  if (process.env.ELEVENLABS_API_KEY) providers.push('ElevenLabs');
  if (process.env.OPENAI_API_KEY) providers.push('OpenAI TTS');
  if (process.env.GOOGLE_TTS_KEY) providers.push('Google TTS');

  if (providers.length > 0) {
    return { status: 'connected', message: providers.join(', '), lastChecked: now };
  }
  return { status: 'disconnected', message: 'No TTS provider configured', lastChecked: now };
}

/** Check Google Drive OAuth */
function checkGoogleDrive(): IntegrationHealthResult {
  const now = Date.now();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    return { status: 'connected', message: 'OAuth tokens configured', lastChecked: now };
  }
  if (clientId && clientSecret) {
    return { status: 'partial', message: 'Client credentials set, no refresh token', lastChecked: now };
  }
  return { status: 'disconnected', message: 'Google OAuth not configured', lastChecked: now };
}

/** Check Google Calendar (same credentials as Drive) */
function checkGoogleCalendar(): IntegrationHealthResult {
  // Google Calendar uses the same OAuth credentials as Drive
  return checkGoogleDrive();
}

export async function GET() {
  // Run all checks in parallel
  const [engine, supabase, whatsapp] = await Promise.allSettled([
    checkEngine(),
    checkSupabase(),
    checkWhatsApp(),
  ]);

  // Synchronous checks
  const apiKeys = checkApiKeys();
  const telegram = checkTelegram();
  const voice = checkVoice();
  const googleDrive = checkGoogleDrive();
  const googleCalendar = checkGoogleCalendar();

  const integrations: Record<string, IntegrationHealthResult> = {
    engine: engine.status === 'fulfilled' ? engine.value : { status: 'error', message: 'Check failed', lastChecked: Date.now() },
    supabase: supabase.status === 'fulfilled' ? supabase.value : { status: 'error', message: 'Check failed', lastChecked: Date.now() },
    'api-keys': apiKeys,
    whatsapp: whatsapp.status === 'fulfilled' ? whatsapp.value : { status: 'error', message: 'Check failed', lastChecked: Date.now() },
    telegram,
    voice,
    'google-drive': googleDrive,
    'google-calendar': googleCalendar,
  };

  return NextResponse.json({ integrations });
}
