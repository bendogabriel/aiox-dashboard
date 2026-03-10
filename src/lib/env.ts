/**
 * Environment variable validation — fail-fast on missing critical config.
 *
 * Client-side vars (NEXT_PUBLIC_*) are validated at import time.
 * Server-side vars are validated lazily when first accessed.
 */

// ── Client-side (available in browser) ─────────────────

export const env = {
  /** API base URL for backend calls */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',

  /** WebSocket URL for monitor stream */
  monitorWsUrl: process.env.NEXT_PUBLIC_MONITOR_WS_URL || 'ws://localhost:4001/stream',

  /** Whether running in development */
  isDev: process.env.NODE_ENV === 'development',

  /** Whether running in production */
  isProd: process.env.NODE_ENV === 'production',
} as const;

// ── Server-side (only available in API routes / server components) ──

export function getServerEnv() {
  return {
    /** Supabase project URL */
    supabaseUrl: process.env.SUPABASE_URL || '',

    /** Supabase anonymous key */
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',

    /** AIOS project root path */
    aiosProjectRoot: process.env.AIOS_PROJECT_ROOT || '',

    /** Anthropic API key (optional, for LLM health check) */
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

    /** OpenAI API key (optional, for multi-model support) */
    openaiApiKey: process.env.OPENAI_API_KEY || '',

    /** Claude CLI path */
    claudeCliPath: process.env.CLAUDE_CLI_PATH || 'claude',

    /** Claude max turns per execution */
    claudeMaxTurns: process.env.CLAUDE_MAX_TURNS || '25',

    /** Claude timeout in ms */
    claudeTimeoutMs: parseInt(process.env.CLAUDE_TIMEOUT_MS || '1800000', 10),

    /** Task TTL in ms */
    taskTtlMs: parseInt(process.env.TASK_TTL_MS || String(2 * 60 * 60 * 1000), 10),
  } as const;
}
