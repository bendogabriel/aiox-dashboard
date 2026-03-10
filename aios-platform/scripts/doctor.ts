#!/usr/bin/env npx tsx
// ============================================================
// AIOS Platform — Doctor (Health Check CLI)
// ============================================================
// Usage: npm run doctor
//
// Validates your local setup and reports what's working,
// what's misconfigured, and what's optional.
// ============================================================

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// ── Colors ─────────────────────────────────────────────────

const LIME = '\x1b[38;2;209;255;0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const OK = `${LIME}✓${RESET}`;
const FAIL = `${RED}✗${RESET}`;
const WARN = `${YELLOW}!${RESET}`;
const SKIP = `${DIM}○${RESET}`;

// ── Helpers ────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '..');
const ENGINE_DIR = resolve(ROOT, 'engine');

let passCount = 0;
let failCount = 0;
let warnCount = 0;
let skipCount = 0;

function pass(msg: string, detail?: string) {
  passCount++;
  console.log(`  ${OK} ${msg}${detail ? ` ${DIM}${detail}${RESET}` : ''}`);
}

function fail(msg: string, fix?: string) {
  failCount++;
  console.log(`  ${FAIL} ${msg}`);
  if (fix) console.log(`    ${DIM}→ ${fix}${RESET}`);
}

function warn(msg: string, detail?: string) {
  warnCount++;
  console.log(`  ${WARN} ${msg}${detail ? ` ${DIM}${detail}${RESET}` : ''}`);
}

function skip(msg: string, reason?: string) {
  skipCount++;
  console.log(`  ${SKIP} ${msg}${reason ? ` ${DIM}(${reason})${RESET}` : ''}`);
}

function section(title: string) {
  console.log(`\n${BOLD}${LIME}▸ ${title}${RESET}`);
}

function getVersion(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

async function checkUrl(url: string, timeoutMs = 3000): Promise<{ ok: boolean; status?: number; data?: unknown }> {
  return checkUrlWithHeaders(url, {}, timeoutMs);
}

async function checkUrlWithHeaders(url: string, headers: Record<string, string>, timeoutMs = 3000): Promise<{ ok: boolean; status?: number; data?: unknown }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timer);
    let data: unknown;
    try { data = await res.json(); } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false };
  }
}

function isPortInUse(port: number): boolean {
  try {
    execSync(`lsof -i :${port} -t`, { encoding: 'utf8', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ── Checks ─────────────────────────────────────────────────

async function checkRuntimes() {
  section('Runtimes');

  // Node
  const nodeVer = getVersion('node --version');
  if (nodeVer) {
    const major = parseInt(nodeVer.replace('v', ''));
    if (major >= 18) pass(`Node.js ${nodeVer}`);
    else warn(`Node.js ${nodeVer}`, 'v18+ recommended');
  } else {
    fail('Node.js not found', 'Install from https://nodejs.org');
  }

  // Bun (for engine)
  const bunVer = getVersion('bun --version');
  if (bunVer) {
    pass(`Bun ${bunVer}`);
  } else {
    fail('Bun not found', 'Install: curl -fsSL https://bun.sh/install | bash');
  }

  // npm
  const npmVer = getVersion('npm --version');
  if (npmVer) pass(`npm ${npmVer}`);
  else warn('npm not found');

  // Docker (optional)
  const dockerVer = getVersion('docker --version');
  if (dockerVer) {
    pass(`Docker ${dockerVer.replace('Docker version ', '').split(',')[0]}`);
  } else {
    skip('Docker not installed', 'optional — needed for docker compose');
  }

  // Git
  const gitVer = getVersion('git --version');
  if (gitVer) pass(`Git ${gitVer.replace('git version ', '')}`);
  else warn('Git not found');
}

function checkProjectStructure() {
  section('Project Structure');

  const checks: [string, string, boolean][] = [
    ['package.json', resolve(ROOT, 'package.json'), true],
    ['engine/package.json', resolve(ENGINE_DIR, 'package.json'), true],
    ['engine/engine.config.yaml', resolve(ENGINE_DIR, 'engine.config.yaml'), true],
    ['engine/migrations/', resolve(ENGINE_DIR, 'migrations'), true],
    ['vite.config.ts', resolve(ROOT, 'vite.config.ts'), true],
    ['src/', resolve(ROOT, 'src'), true],
    ['public/', resolve(ROOT, 'public'), false],
    ['Dockerfile', resolve(ROOT, 'Dockerfile'), false],
    ['nginx.conf', resolve(ROOT, 'nginx.conf'), false],
  ];

  for (const [label, path, required] of checks) {
    if (existsSync(path)) {
      pass(label);
    } else if (required) {
      fail(`${label} missing`, `Expected at ${path}`);
    } else {
      skip(label, 'optional');
    }
  }

  // node_modules
  if (existsSync(resolve(ROOT, 'node_modules'))) {
    pass('node_modules installed');
  } else {
    fail('node_modules missing', 'Run: npm install');
  }

  // Engine node_modules (Bun)
  if (existsSync(resolve(ENGINE_DIR, 'node_modules'))) {
    pass('engine/node_modules installed');
  } else {
    warn('engine/node_modules missing', 'Run: cd engine && bun install');
  }
}

function checkEnvFiles() {
  section('Environment Files');

  // Dashboard .env
  const envPaths = [
    '.env.development',
    '.env.local',
    '.env.production',
    '.env',
  ];

  let dashboardEnv: Record<string, string> = {};
  let foundEnv: string | null = null;

  for (const name of envPaths) {
    const p = resolve(ROOT, name);
    if (existsSync(p)) {
      foundEnv = name;
      dashboardEnv = parseEnvFile(p);
      break;
    }
  }

  if (foundEnv) {
    pass(`Dashboard env: ${foundEnv}`);
  } else {
    fail('No .env file found', 'cp .env.example .env.development');
    return { dashboardEnv: {}, engineEnv: {} };
  }

  // Check required dashboard vars
  const engineUrl = dashboardEnv['VITE_ENGINE_URL'];
  if (engineUrl) {
    pass(`VITE_ENGINE_URL = ${engineUrl}`);
  } else {
    fail('VITE_ENGINE_URL not set', 'Add to your .env file');
  }

  // Check optional dashboard vars
  const supabaseUrl = dashboardEnv['VITE_SUPABASE_URL'];
  const supabaseKey = dashboardEnv['VITE_SUPABASE_ANON_KEY'];
  if (supabaseUrl && supabaseKey) {
    pass(`VITE_SUPABASE_URL = ${supabaseUrl.replace(/https?:\/\//, '').split('.')[0]}...`);
  } else if (supabaseUrl || supabaseKey) {
    warn('Supabase partially configured', 'Need both URL and anon key');
  } else {
    skip('Supabase not configured', 'optional — data stays in localStorage');
  }

  // Engine .env
  const engineEnvPath = resolve(ENGINE_DIR, '.env');
  let engineEnv: Record<string, string> = {};
  if (existsSync(engineEnvPath)) {
    engineEnv = parseEnvFile(engineEnvPath);
    pass('Engine env: engine/.env');

    const secret = engineEnv['ENGINE_SECRET'];
    if (secret && secret !== 'aios-dev-secret-change-in-production') {
      pass('ENGINE_SECRET configured');
    } else {
      warn('ENGINE_SECRET using default', 'Run: openssl rand -hex 32');
    }

    // Telegram
    if (engineEnv['TELEGRAM_BOT_TOKEN']) {
      pass('TELEGRAM_BOT_TOKEN set');
    } else {
      skip('Telegram not configured', 'optional');
    }

    // Google OAuth
    if (engineEnv['GOOGLE_CLIENT_ID'] && engineEnv['GOOGLE_CLIENT_SECRET']) {
      pass('Google OAuth credentials set');
    } else {
      skip('Google OAuth not configured', 'optional');
    }

    // WhatsApp
    if (engineEnv['WHATSAPP_PROVIDER']) {
      pass(`WhatsApp provider: ${engineEnv['WHATSAPP_PROVIDER']}`);
    } else {
      skip('WhatsApp not configured', 'optional');
    }
  } else {
    skip('engine/.env not found', 'cp engine/.env.example engine/.env');
  }

  return { dashboardEnv, engineEnv };
}

async function checkServices(dashboardEnv: Record<string, string>) {
  section('Services');

  // Engine
  const engineUrl = dashboardEnv['VITE_ENGINE_URL'] || 'http://localhost:4002';
  const engineResult = await checkUrl(`${engineUrl}/health`);
  if (engineResult.ok && engineResult.data) {
    const d = engineResult.data as { version?: string; ws_clients?: number };
    pass(`Engine running`, `v${d.version} — ${d.ws_clients} WS clients`);
  } else if (isPortInUse(4002)) {
    warn('Port 4002 in use but health check failed', 'Engine may be starting');
  } else {
    warn('Engine not running', 'Start with: npm run engine:dev');
  }

  // Supabase
  const supabaseUrl = dashboardEnv['VITE_SUPABASE_URL'];
  const supabaseKey = dashboardEnv['VITE_SUPABASE_ANON_KEY'];
  if (supabaseUrl && supabaseKey) {
    const sbResult = await checkUrlWithHeaders(`${supabaseUrl}/rest/v1/`, {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    });
    if (sbResult.ok || sbResult.status === 200) {
      pass('Supabase reachable', new URL(supabaseUrl).hostname.split('.')[0]);
    } else {
      fail('Supabase unreachable', `${supabaseUrl} returned ${sbResult.status || 'no response'}`);
    }
  } else {
    skip('Supabase check', 'not configured');
  }

  // WhatsApp (WAHA)
  if (engineResult.ok) {
    const waResult = await checkUrl(`${engineUrl}/whatsapp/status`);
    if (waResult.ok) {
      const d = waResult.data as { configured?: boolean; provider?: string };
      if (d?.configured) {
        pass(`WhatsApp connected`, d.provider);
      } else {
        skip('WhatsApp not configured on engine');
      }
    }

    // Telegram
    const tgResult = await checkUrl(`${engineUrl}/telegram/status`);
    if (tgResult.ok) {
      const d = tgResult.data as { configured?: boolean; bot_username?: string };
      if (d?.configured) {
        pass(`Telegram connected`, `@${d.bot_username}`);
      } else {
        skip('Telegram not configured on engine');
      }
    }

    // Google Auth
    const gaResult = await checkUrl(`${engineUrl}/auth/google/status`);
    if (gaResult.ok) {
      const d = gaResult.data as { configured?: boolean };
      if (d?.configured) {
        pass('Google OAuth configured');
      } else {
        skip('Google OAuth not configured on engine');
      }
    }
  }

  // Vite dev server
  if (isPortInUse(5173)) {
    pass('Vite dev server running', 'port 5173');
  } else if (isPortInUse(5174)) {
    pass('Vite dev server running', 'port 5174');
  } else {
    skip('Vite dev server not running', 'start with: npm run dev');
  }
}

function checkBuild() {
  section('Build');

  const distDir = resolve(ROOT, 'dist');
  if (existsSync(distDir) && existsSync(resolve(distDir, 'index.html'))) {
    pass('Production build exists', 'dist/');
  } else {
    skip('No production build', 'run: npm run build');
  }

  const engineDataDir = resolve(ENGINE_DIR, 'data');
  if (existsSync(engineDataDir)) {
    pass('Engine data directory exists', 'engine/data/');
  } else {
    skip('Engine data directory', 'created on first engine start');
  }
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  console.log(`
${LIME}${BOLD}  ╔══════════════════════════════════════╗
  ║     AIOS Platform — Doctor v1.0      ║
  ╚══════════════════════════════════════╝${RESET}
`);

  await checkRuntimes();
  checkProjectStructure();
  const { dashboardEnv } = checkEnvFiles();
  await checkServices(dashboardEnv);
  checkBuild();

  // Summary
  console.log(`
${BOLD}─────────────────────────────────────────${RESET}
  ${OK} ${passCount} passed   ${FAIL} ${failCount} failed   ${WARN} ${warnCount} warnings   ${SKIP} ${skipCount} skipped
${BOLD}─────────────────────────────────────────${RESET}`);

  if (failCount === 0) {
    console.log(`
  ${LIME}${BOLD}Ready to go!${RESET} ${DIM}Start with: npm run dev:full${RESET}
`);
  } else {
    console.log(`
  ${RED}${BOLD}${failCount} issue${failCount > 1 ? 's' : ''} found.${RESET} ${DIM}Fix the items above and run again: npm run doctor${RESET}
`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
