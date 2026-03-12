/**
 * Integration Docs — P15
 *
 * In-app documentation for each integration setup.
 * Provides step-by-step guides, links to official docs, and troubleshooting tips.
 */

import type { IntegrationId } from '../stores/integrationStore';

export interface IntegrationDoc {
  id: IntegrationId;
  name: string;
  description: string;
  steps: string[];
  envVars: { name: string; description: string; required: boolean }[];
  troubleshooting: { problem: string; solution: string }[];
  docsUrl?: string;
}

export const INTEGRATION_DOCS: Record<IntegrationId, IntegrationDoc> = {
  engine: {
    id: 'engine',
    name: 'AIOS Engine',
    description: 'The core execution engine for agents and workflows. Required for most platform features.',
    steps: [
      'Start the engine: cd engine && bun run src/index.ts',
      'Engine runs on port 4002 by default',
      'Set VITE_ENGINE_URL in .env if using a non-default URL',
      'Dashboard auto-discovers engine on localhost ports 3000, 3001, 4002, 4001, 8002',
    ],
    envVars: [
      { name: 'VITE_ENGINE_URL', description: 'Engine HTTP API URL', required: false },
      { name: 'ENGINE_PORT', description: 'Engine listening port', required: false },
      { name: 'ENGINE_SECRET', description: 'Shared secret for auth', required: false },
    ],
    troubleshooting: [
      { problem: 'Engine not found', solution: 'Check if engine is running with curl http://localhost:4002/health' },
      { problem: 'Connection refused', solution: 'Verify port mapping in docker-compose.yml and firewall rules' },
      { problem: 'Timeout on health check', solution: 'Engine may be starting up. Wait 10s and retry.' },
    ],
    docsUrl: 'https://github.com/synkra/aios-engine',
  },
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    description: 'Provides database, auth, and realtime backend. Used for task persistence and history.',
    steps: [
      'Create a Supabase project at supabase.com or run locally with supabase start',
      'Copy the project URL and anon key from Settings > API',
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
      'Run migrations: npx supabase db push',
    ],
    envVars: [
      { name: 'VITE_SUPABASE_URL', description: 'Supabase project URL', required: true },
      { name: 'VITE_SUPABASE_ANON_KEY', description: 'Supabase anonymous/public key', required: true },
    ],
    troubleshooting: [
      { problem: 'Not configured', solution: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file' },
      { problem: 'Unreachable', solution: 'Check if the Supabase URL is correct and the project is not paused' },
      { problem: 'RLS errors', solution: 'Ensure RLS policies allow anon access on orchestration_tasks table' },
    ],
    docsUrl: 'https://supabase.com/docs',
  },
  'api-keys': {
    id: 'api-keys',
    name: 'API Keys',
    description: 'LLM provider API keys for OpenAI, Anthropic, and other AI services.',
    steps: [
      'Go to Integrations > API Keys > Configure',
      'Enter your OpenAI API key (sk-...)',
      'Enter your Anthropic API key (sk-ant-...)',
      'Keys are stored locally in browser localStorage',
    ],
    envVars: [
      { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false },
      { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: false },
    ],
    troubleshooting: [
      { problem: 'Keys not detected', solution: 'Open API Keys configuration and re-enter your keys' },
      { problem: 'LLM calls failing', solution: 'Verify key validity at the provider dashboard. Check rate limits.' },
      { problem: 'Keys lost after clear', solution: 'Keys are in localStorage. Export config before clearing browser data.' },
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Business messaging via WAHA (WhatsApp HTTP API) or Meta Cloud API.',
    steps: [
      'Deploy WAHA: docker run -p 3003:3000 devlikeapro/waha',
      'Or configure Meta Cloud API with business account',
      'Set webhook URL to {engine}/integrations/whatsapp/webhook',
      'Configure in Integrations > WhatsApp > Configure',
    ],
    envVars: [
      { name: 'WHATSAPP_API_URL', description: 'WAHA or Meta API endpoint', required: true },
      { name: 'WHATSAPP_API_KEY', description: 'API key for authentication', required: true },
    ],
    troubleshooting: [
      { problem: 'Session not connected', solution: 'Scan QR code in WAHA dashboard at your WAHA_URL/dashboard' },
      { problem: 'Webhook not receiving', solution: 'Verify engine URL is accessible from WAHA container network' },
      { problem: 'Messages not sending', solution: 'Check WAHA logs and ensure session status is WORKING' },
    ],
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    description: 'Bot messaging via Telegram Bot API.',
    steps: [
      'Create a bot with @BotFather on Telegram',
      'Copy the bot token',
      'Set webhook: engine registers it automatically when configured',
      'Configure in Integrations > Telegram > Configure',
    ],
    envVars: [
      { name: 'TELEGRAM_BOT_TOKEN', description: 'Telegram bot token from BotFather', required: true },
    ],
    troubleshooting: [
      { problem: 'Bot not responding', solution: 'Verify bot token and that webhook is set correctly' },
      { problem: 'Webhook not set', solution: 'Engine sets webhook on startup. Restart engine after configuring token.' },
      { problem: 'Duplicate messages', solution: 'Ensure only one instance of the engine is running' },
    ],
  },
  voice: {
    id: 'voice',
    name: 'Voice / TTS',
    description: 'Text-to-speech provider for voice output in chat and agents.',
    steps: [
      'Browser TTS: Available by default (Web Speech API)',
      'External TTS: Configure provider in Integrations > Voice',
      'Supports ElevenLabs, Google TTS, and browser built-in',
    ],
    envVars: [
      { name: 'TTS_PROVIDER', description: 'TTS provider (browser, elevenlabs, google)', required: false },
      { name: 'ELEVENLABS_API_KEY', description: 'ElevenLabs API key (if using)', required: false },
    ],
    troubleshooting: [
      { problem: 'No voices available', solution: 'Browser TTS requires a modern browser. Try Chrome or Edge.' },
      { problem: 'Voice too slow/fast', solution: 'Adjust rate in voice settings panel' },
      { problem: 'External TTS failing', solution: 'Check API key validity and rate limits' },
    ],
  },
  'google-drive': {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'File storage, documents, and shared drives integration.',
    steps: [
      'Create OAuth credentials in Google Cloud Console',
      'Enable Google Drive API',
      'Configure OAuth redirect to {engine}/integrations/google/callback',
      'Authenticate via Integrations > Google Drive > Configure',
    ],
    envVars: [
      { name: 'GOOGLE_CLIENT_ID', description: 'Google OAuth client ID', required: true },
      { name: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth client secret', required: true },
    ],
    troubleshooting: [
      { problem: 'Auth redirect failed', solution: 'Verify redirect URI matches your engine URL in Google Console' },
      { problem: 'Scopes insufficient', solution: 'Re-authenticate with drive.file or drive scope' },
      { problem: 'Token expired', solution: 'Refresh tokens are handled automatically. Re-auth if persistent.' },
    ],
    docsUrl: 'https://developers.google.com/drive/api',
  },
  'google-calendar': {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Calendar events, scheduling, and availability integration.',
    steps: [
      'Uses same Google OAuth credentials as Google Drive',
      'Enable Google Calendar API in Cloud Console',
      'Authenticate via Integrations > Google Calendar > Configure',
      'Grant calendar read/write permissions',
    ],
    envVars: [
      { name: 'GOOGLE_CLIENT_ID', description: 'Google OAuth client ID (shared with Drive)', required: true },
      { name: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth client secret', required: true },
    ],
    troubleshooting: [
      { problem: 'Calendar not showing', solution: 'Verify Calendar API is enabled in Google Cloud Console' },
      { problem: 'Permission denied', solution: 'Re-authenticate with calendar scope enabled' },
      { problem: 'Events not syncing', solution: 'Check webhook configuration and engine connectivity' },
    ],
    docsUrl: 'https://developers.google.com/calendar/api',
  },
};

/**
 * Get doc for a specific integration.
 */
export function getIntegrationDoc(id: IntegrationId): IntegrationDoc {
  return INTEGRATION_DOCS[id];
}

/**
 * Get all docs.
 */
export function getAllIntegrationDocs(): IntegrationDoc[] {
  return Object.values(INTEGRATION_DOCS);
}
