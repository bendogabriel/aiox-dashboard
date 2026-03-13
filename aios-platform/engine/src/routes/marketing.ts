/**
 * Marketing Hub API routes.
 * Proxies CLI scripts (meta-ads-ops, google-ads-ops, ga4-analytics-ops)
 * and returns structured JSON for the frontend.
 */
import { Hono } from 'hono';

export const marketingApp = new Hono();

// Path to ops scripts (relative to engine cwd, which is inside dashboard/aios-platform/engine/)
const OPS_ROOT = '../../../.aios-core/scripts/ops';
const ENV_FILE = '../../../.env';

interface CliResult {
  ok: boolean;
  data: unknown;
  error?: string;
  source: 'live' | 'demo';
}

/**
 * Run a CLI ops script and return parsed JSON output.
 * Falls back to demo data if the script fails (missing tokens, etc).
 */
async function runOpsScript(script: string, args: string[]): Promise<CliResult> {
  try {
    const proc = Bun.spawn(
      ['node', `--env-file=${ENV_FILE}`, `${OPS_ROOT}/${script}`, ...args],
      {
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      }
    );

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      console.warn(`[Marketing] ${script} ${args.join(' ')} failed:`, stderr.trim());
      return { ok: false, data: null, error: stderr.trim(), source: 'demo' };
    }

    // Parse JSON output
    try {
      const data = JSON.parse(stdout);
      return { ok: true, data, source: 'live' };
    } catch {
      // Non-JSON output
      return { ok: true, data: { raw: stdout.trim() }, source: 'live' };
    }
  } catch (err) {
    console.error(`[Marketing] Failed to run ${script}:`, err);
    return { ok: false, data: null, error: String(err), source: 'demo' };
  }
}

// ── Traffic endpoints ────────────────────────────────────────

/**
 * GET /marketing/traffic/dashboard
 * Returns campaign dashboard data from Meta Ads + Google Ads.
 * Query params: datePreset (default: last_14d), includeDailyly (default: false)
 */
marketingApp.get('/traffic/dashboard', async (c) => {
  const datePreset = c.req.query('datePreset') || 'last_14d';
  const includeDaily = c.req.query('includeDaily') === 'true';

  // Run Meta Ads dashboard
  const metaArgs = ['dashboard', `--date-preset=${datePreset}`];
  if (includeDaily) metaArgs.push('--include-daily');
  const metaResult = await runOpsScript('meta-ads-ops.mjs', metaArgs);

  // Run Google Ads dashboard
  const googleResult = await runOpsScript('google-ads-ops.mjs', ['dashboard']);

  // Determine data source
  const source = metaResult.ok && googleResult.ok ? 'live' : 'demo';

  if (source === 'demo') {
    return c.json({
      source: 'demo',
      datePreset,
      meta: metaResult.ok ? metaResult.data : getDemoMetaData(),
      google: googleResult.ok ? googleResult.data : getDemoGoogleData(),
      errors: {
        meta: metaResult.error || null,
        google: googleResult.error || null,
      },
    });
  }

  return c.json({
    source: 'live',
    datePreset,
    meta: metaResult.data,
    google: googleResult.data,
  });
});

/**
 * GET /marketing/traffic/meta/campaigns
 * Returns Meta Ads campaign list with insights.
 */
marketingApp.get('/traffic/meta/campaigns', async (c) => {
  const datePreset = c.req.query('datePreset') || 'last_14d';
  const result = await runOpsScript('meta-ads-ops.mjs', [
    'campaigns',
    `--date-preset=${datePreset}`,
  ]);

  if (!result.ok) {
    return c.json({ source: 'demo', campaigns: getDemoMetaCampaigns() });
  }

  return c.json({ source: 'live', campaigns: result.data });
});

/**
 * GET /marketing/traffic/meta/campaign/:id
 * Returns detailed insights for a specific Meta campaign.
 */
marketingApp.get('/traffic/meta/campaign/:id', async (c) => {
  const id = c.req.param('id');
  const compact = c.req.query('compact') || 'sales';
  const result = await runOpsScript('meta-ads-ops.mjs', [
    'campaign-insights',
    `--id=${id}`,
    `--compact=${compact}`,
  ]);

  if (!result.ok) {
    return c.json({ source: 'demo', error: result.error }, 404);
  }

  return c.json({ source: 'live', insights: result.data });
});

/**
 * GET /marketing/traffic/google/campaigns
 * Returns Google Ads campaign list.
 */
marketingApp.get('/traffic/google/campaigns', async (c) => {
  const result = await runOpsScript('google-ads-ops.mjs', [
    'campaigns',
    '--status=ENABLED',
  ]);

  if (!result.ok) {
    return c.json({ source: 'demo', campaigns: getDemoGoogleCampaigns() });
  }

  return c.json({ source: 'live', campaigns: result.data });
});

/**
 * GET /marketing/traffic/ga4/report
 * Returns GA4 analytics report.
 */
marketingApp.get('/traffic/ga4/report', async (c) => {
  const start = c.req.query('start');
  const end = c.req.query('end');

  const args = ['run-report'];
  if (start) args.push(`--start=${start}`);
  if (end) args.push(`--end=${end}`);

  const result = await runOpsScript('ga4-analytics-ops.mjs', args);

  if (!result.ok) {
    return c.json({ source: 'demo', report: getDemoGA4Report() });
  }

  return c.json({ source: 'live', report: result.data });
});

/**
 * GET /marketing/traffic/ga4/realtime
 * Returns GA4 realtime report.
 */
marketingApp.get('/traffic/ga4/realtime', async (c) => {
  const result = await runOpsScript('ga4-analytics-ops.mjs', ['run-realtime-report']);

  if (!result.ok) {
    return c.json({ source: 'demo', realtime: { activeUsers: 42 } });
  }

  return c.json({ source: 'live', realtime: result.data });
});

// ── Meta Ads actions ─────────────────────────────────────────

/**
 * POST /marketing/traffic/meta/campaign/status
 * Update campaign status (pause/activate/archive).
 */
marketingApp.post('/traffic/meta/campaign/status', async (c) => {
  const body = await c.req.json<{ id: string; status: string }>();
  if (!body.id || !body.status) {
    return c.json({ error: 'id and status are required' }, 400);
  }

  const result = await runOpsScript('meta-ads-ops.mjs', [
    'update-status',
    `--id=${body.id}`,
    `--status=${body.status}`,
  ]);

  if (!result.ok) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({ ok: true, data: result.data });
});

// ── Demo data fallbacks ──────────────────────────────────────

function getDemoMetaData() {
  return {
    account: { name: 'Natalia Tanaka', currency: 'BRL' },
    summary: {
      spend: 12450.00,
      impressions: 2400000,
      clicks: 45200,
      ctr: 1.88,
      cpc: 0.28,
      cpm: 5.19,
      conversions: 1240,
      cpa: 10.04,
      revenue: 52300.00,
      roas: 4.20,
    },
    campaigns: getDemoMetaCampaigns(),
  };
}

function getDemoMetaCampaigns() {
  return [
    { id: '1001', name: '[SALES] MPG - Perpetua', status: 'ACTIVE', objective: 'OUTCOME_SALES', spend: 3240, roas: 5.2, conversions: 420, impressions: 580000, clicks: 12400, ctr: 2.14, cpc: 0.26 },
    { id: '1002', name: '[SALES] MAM - Lancamento', status: 'ACTIVE', objective: 'OUTCOME_SALES', spend: 4100, roas: 3.8, conversions: 380, impressions: 720000, clicks: 14800, ctr: 2.06, cpc: 0.28 },
    { id: '1003', name: '[LEADS] GPO - Captacao', status: 'ACTIVE', objective: 'OUTCOME_LEADS', spend: 1890, roas: 0, conversions: 1250, impressions: 450000, clicks: 8200, ctr: 1.82, cpc: 0.23 },
    { id: '1004', name: '[AWARENESS] MCPM - Video', status: 'ACTIVE', objective: 'OUTCOME_AWARENESS', spend: 790, roas: 0, conversions: 0, impressions: 320000, clicks: 4100, ctr: 1.28, cpc: 0.19 },
    { id: '1005', name: '[SALES] FDS - Masterclass', status: 'PAUSED', objective: 'OUTCOME_SALES', spend: 1430, roas: 2.9, conversions: 95, impressions: 280000, clicks: 5700, ctr: 2.04, cpc: 0.25 },
  ];
}

function getDemoGoogleData() {
  return {
    account: { name: 'Natalia Tanaka', currency: 'BRL' },
    summary: {
      spend: 2430.00,
      impressions: 180000,
      clicks: 8900,
      ctr: 4.94,
      cpc: 0.27,
      conversions: 143,
      cpa: 17.00,
    },
    campaigns: getDemoGoogleCampaigns(),
  };
}

function getDemoGoogleCampaigns() {
  return [
    { id: '2001', name: 'Search - Brand NT', status: 'ENABLED', spend: 1450, conversions: 95, ctr: 8.2, cpc: 0.18, qualityScore: 9 },
    { id: '2002', name: 'Search - Generic Massagem', status: 'ENABLED', spend: 680, conversions: 32, ctr: 3.1, cpc: 0.42, qualityScore: 6 },
    { id: '2003', name: 'Search - Concorrentes', status: 'PAUSED', spend: 300, conversions: 16, ctr: 2.8, cpc: 0.38, qualityScore: 5 },
  ];
}

function getDemoGA4Report() {
  return {
    sessions: 28500,
    users: 18200,
    newUsers: 12400,
    bounceRate: 42.3,
    avgSessionDuration: 185,
    pagesPerSession: 3.2,
    topPages: [
      { page: '/', sessions: 8500, bounceRate: 38 },
      { page: '/mpg', sessions: 4200, bounceRate: 35 },
      { page: '/blog', sessions: 3100, bounceRate: 52 },
      { page: '/mam', sessions: 2800, bounceRate: 41 },
      { page: '/sobre', sessions: 1900, bounceRate: 58 },
    ],
    trafficSources: [
      { source: 'google / cpc', sessions: 8900, conversions: 143 },
      { source: 'facebook / cpc', sessions: 7200, conversions: 1240 },
      { source: 'google / organic', sessions: 5400, conversions: 89 },
      { source: 'direct / none', sessions: 3800, conversions: 52 },
      { source: 'instagram / referral', sessions: 2100, conversions: 28 },
    ],
  };
}
