/**
 * Env Generator — P6 One-Click Deploy
 *
 * Generates .env file content from the current integration config
 * and system settings. Supports both dashboard (.env) and engine (.env) formats.
 */

import { useIntegrationStore } from '../stores/integrationStore';

// ── Types ────────────────────────────────────────────────

export interface EnvVar {
  key: string;
  value: string;
  comment?: string;
  required: boolean;
  section: string;
}

export interface EnvGenResult {
  content: string;
  vars: EnvVar[];
  warnings: string[];
}

// ── Dashboard .env generator ─────────────────────────────

export function generateDashboardEnv(): EnvGenResult {
  const { integrations } = useIntegrationStore.getState();
  const vars: EnvVar[] = [];
  const warnings: string[] = [];

  // Engine URL
  const engineConfig = integrations.engine.config;
  const engineUrl = engineConfig.url || import.meta.env.VITE_ENGINE_URL || 'http://localhost:4002';
  vars.push({
    key: 'VITE_ENGINE_URL',
    value: engineUrl,
    comment: 'AIOS execution engine',
    required: true,
    section: 'Core: Engine API',
  });

  // Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  vars.push({
    key: 'VITE_SUPABASE_URL',
    value: supabaseUrl,
    comment: 'Supabase project URL',
    required: false,
    section: 'Core: Supabase',
  });
  vars.push({
    key: 'VITE_SUPABASE_ANON_KEY',
    value: supabaseKey,
    comment: 'Supabase anon key',
    required: false,
    section: 'Core: Supabase',
  });

  if (integrations.supabase.status === 'connected' && !supabaseUrl) {
    warnings.push('Supabase is connected but env vars are not set — config may be from imported profile');
  }

  // Optional services
  vars.push({
    key: 'VITE_MONITOR_URL',
    value: import.meta.env.VITE_MONITOR_URL || '',
    comment: 'Monitor service (optional)',
    required: false,
    section: 'Optional',
  });

  vars.push({
    key: 'VITE_WHATSAPP_SSE_URL',
    value: import.meta.env.VITE_WHATSAPP_SSE_URL || '',
    comment: 'WhatsApp SSE events (optional)',
    required: false,
    section: 'Optional',
  });

  return {
    content: formatEnvContent('AIOS Platform Dashboard', vars),
    vars,
    warnings,
  };
}

// ── Engine .env generator ────────────────────────────────

export function generateEngineEnv(): EnvGenResult {
  const { integrations } = useIntegrationStore.getState();
  const vars: EnvVar[] = [];
  const warnings: string[] = [];

  // Server
  vars.push({
    key: 'ENGINE_PORT',
    value: '4002',
    comment: 'Engine HTTP port',
    required: true,
    section: 'Server',
  });
  vars.push({
    key: 'ENGINE_HOST',
    value: '0.0.0.0',
    comment: 'Bind address',
    required: true,
    section: 'Server',
  });
  vars.push({
    key: 'LOG_LEVEL',
    value: 'info',
    comment: 'debug | info | warn | error',
    required: false,
    section: 'Server',
  });

  // Security
  vars.push({
    key: 'ENGINE_SECRET',
    value: generateSecret(),
    comment: 'Secrets vault encryption key (auto-generated)',
    required: true,
    section: 'Security',
  });

  // Channels — WhatsApp
  if (integrations.whatsapp.status === 'connected' || Object.keys(integrations.whatsapp.config).length > 0) {
    const waCfg = integrations.whatsapp.config;
    vars.push({
      key: 'WHATSAPP_PROVIDER',
      value: waCfg.provider || 'waha',
      comment: 'waha | meta',
      required: false,
      section: 'WhatsApp',
    });
    vars.push({ key: 'WAHA_URL', value: waCfg.wahaUrl || 'http://localhost:3000', required: false, section: 'WhatsApp' });
    vars.push({ key: 'WAHA_API_KEY', value: '', comment: 'Set manually', required: false, section: 'WhatsApp' });
  }

  // Channels — Telegram
  if (integrations.telegram.status === 'connected' || Object.keys(integrations.telegram.config).length > 0) {
    vars.push({ key: 'TELEGRAM_BOT_TOKEN', value: '', comment: 'Set manually', required: false, section: 'Telegram' });
    vars.push({ key: 'TELEGRAM_WEBHOOK_URL', value: '', comment: 'Public URL for webhooks', required: false, section: 'Telegram' });
  }

  // LLM Keys placeholder
  vars.push({ key: 'OPENAI_API_KEY', value: '', comment: 'Set manually', required: false, section: 'LLM Providers' });
  vars.push({ key: 'ANTHROPIC_API_KEY', value: '', comment: 'Set manually', required: false, section: 'LLM Providers' });
  vars.push({ key: 'GOOGLE_AI_API_KEY', value: '', comment: 'Set manually', required: false, section: 'LLM Providers' });

  if (integrations['api-keys'].status !== 'connected') {
    warnings.push('No API keys configured — agents will not be able to use LLMs');
  }

  return {
    content: formatEnvContent('AIOS Engine', vars),
    vars,
    warnings,
  };
}

// ── Format helpers ───────────────────────────────────────

function formatEnvContent(title: string, vars: EnvVar[]): string {
  const lines: string[] = [];
  lines.push(`# ============================================================`);
  lines.push(`# ${title} — Environment Variables`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# ============================================================`);
  lines.push('');

  let currentSection = '';
  for (const v of vars) {
    if (v.section !== currentSection) {
      currentSection = v.section;
      if (lines[lines.length - 1] !== '') lines.push('');
      const req = v.required ? 'REQUIRED' : 'OPTIONAL';
      lines.push(`# ─── ${currentSection} ${'─'.repeat(Math.max(0, 40 - currentSection.length))} ${req} ──`);
    }
    if (v.comment) {
      lines.push(`# ${v.comment}`);
    }
    if (v.value) {
      lines.push(`${v.key}=${v.value}`);
    } else {
      lines.push(`# ${v.key}=`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

// ── Download helper ──────────────────────────────────────

export function downloadEnvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
