/**
 * Content Module API routes.
 * Handles thumbnail generation (fal-ai), carousel building, and social publishing (blotato).
 */
import { Hono } from 'hono';

export const contentApp = new Hono();

const OPS_ROOT = '../../../.aios-core/scripts/ops';
const ENV_FILE = '../../../.env';

async function runOpsScript(script: string, args: string[]): Promise<{ ok: boolean; data: unknown; error?: string }> {
  try {
    const proc = Bun.spawn(
      ['node', `--env-file=${ENV_FILE}`, `${OPS_ROOT}/${script}`, ...args],
      { stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NODE_NO_WARNINGS: '1' } }
    );
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      return { ok: false, data: null, error: stderr.trim() };
    }
    try {
      return { ok: true, data: JSON.parse(stdout) };
    } catch {
      return { ok: true, data: { raw: stdout.trim() } };
    }
  } catch (err) {
    return { ok: false, data: null, error: String(err) };
  }
}

// ── Thumbnail generation ─────────────────────────────────────

/**
 * POST /content/thumbnail/generate
 * Generate a thumbnail using fal-ai via the Engine.
 * Body: { prompt: string, style?: string, aspectRatio?: string }
 */
contentApp.post('/thumbnail/generate', async (c) => {
  const body = await c.req.json<{
    prompt: string;
    style?: string;
    aspectRatio?: string;
    model?: string;
  }>();

  if (!body.prompt) {
    return c.json({ error: 'prompt is required' }, 400);
  }

  // For now, return a structured response that the frontend can use
  // to call fal-ai MCP tools directly or queue a generation task
  return c.json({
    status: 'queued',
    request: {
      prompt: body.prompt,
      style: body.style || 'photorealistic',
      aspectRatio: body.aspectRatio || '16:9',
      model: body.model || 'fal-ai/flux-pro/v1.1',
    },
    message: 'Use fal-ai MCP tools to generate. Engine proxy coming in next iteration.',
  });
});

// ── Social publishing (Blotato) ──────────────────────────────

/**
 * GET /content/social/accounts
 * List available social media accounts from Blotato.
 */
contentApp.get('/social/accounts', async (c) => {
  const result = await runOpsScript('blotato-ops.mjs', ['list-accounts']);

  if (!result.ok) {
    return c.json({
      source: 'demo',
      accounts: getDemoAccounts(),
      error: result.error,
    });
  }

  return c.json({ source: 'live', accounts: result.data });
});

/**
 * GET /content/social/scheduled
 * List scheduled posts.
 */
contentApp.get('/social/scheduled', async (c) => {
  const result = await runOpsScript('blotato-ops.mjs', ['list-scheduled']);

  if (!result.ok) {
    return c.json({
      source: 'demo',
      posts: getDemoScheduledPosts(),
    });
  }

  return c.json({ source: 'live', posts: result.data });
});

/**
 * POST /content/social/schedule
 * Schedule a new social media post via Blotato.
 */
contentApp.post('/social/schedule', async (c) => {
  const body = await c.req.json<{
    accountId: string;
    platform: string;
    text: string;
    scheduledTime: string;
    mediaUrl?: string;
  }>();

  if (!body.accountId || !body.text || !body.scheduledTime) {
    return c.json({ error: 'accountId, text, and scheduledTime are required' }, 400);
  }

  const args = [
    'schedule-post',
    `--account-id=${body.accountId}`,
    `--platform=${body.platform || 'instagram'}`,
    `--text=${body.text}`,
    `--scheduled-time=${body.scheduledTime}`,
  ];
  if (body.mediaUrl) args.push(`--media-url=${body.mediaUrl}`);

  const result = await runOpsScript('blotato-ops.mjs', args);

  if (!result.ok) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({ ok: true, data: result.data });
});

// ── YouTube analytics ────────────────────────────────────────

/**
 * GET /content/youtube/top-videos
 * Returns top-performing YouTube videos.
 */
contentApp.get('/youtube/top-videos', async (c) => {
  const max = c.req.query('max') || '10';
  const result = await runOpsScript('youtube-analytics-ops.mjs', ['top-videos', `--max=${max}`]);

  if (!result.ok) {
    return c.json({ source: 'demo', videos: getDemoYouTubeVideos() });
  }

  return c.json({ source: 'live', videos: result.data });
});

/**
 * GET /content/instagram/insights
 * Returns Instagram account insights.
 */
contentApp.get('/instagram/insights', async (c) => {
  const result = await runOpsScript('instagram-ops.mjs', ['account-info']);

  if (!result.ok) {
    return c.json({ source: 'demo', insights: getDemoInstagramInsights() });
  }

  return c.json({ source: 'live', insights: result.data });
});

// ── Demo data ────────────────────────────────────────────────

function getDemoAccounts() {
  return [
    { id: '9746', platform: 'instagram', name: '@nataliatanaka.massoterapeuta', followers: 245000 },
    { id: '9747', platform: 'facebook', name: 'Natalia Tanaka', followers: 82000 },
    { id: '9748', platform: 'youtube', name: 'Natalia Tanaka', subscribers: 156000 },
  ];
}

function getDemoScheduledPosts() {
  return [
    { id: 'p1', platform: 'instagram', type: 'carousel', caption: '5 pontos gatilhos que todo massoterapeuta precisa saber...', scheduledAt: '2026-03-14T15:00:00Z', status: 'scheduled' },
    { id: 'p2', platform: 'instagram', type: 'reel', caption: 'Protocolo MAL para dor cervical — resultado em 1 sessao', scheduledAt: '2026-03-15T12:00:00Z', status: 'scheduled' },
    { id: 'p3', platform: 'youtube', type: 'video', caption: 'LIVE: Perguntas e Respostas sobre Pos-Operatorio', scheduledAt: '2026-03-17T20:00:00Z', status: 'scheduled' },
  ];
}

function getDemoYouTubeVideos() {
  return [
    { title: 'Como Cobrar R$ 400 por Sessao', views: 125000, likes: 4800, comments: 320, publishedAt: '2026-02-10' },
    { title: 'Protocolo MAL — Aula Completa', views: 98000, likes: 3900, comments: 280, publishedAt: '2026-01-28' },
    { title: '5 Erros do Massoterapeuta Iniciante', views: 87000, likes: 3200, comments: 195, publishedAt: '2026-02-22' },
    { title: 'Metodo Agenda Magica — Como Funciona', views: 72000, likes: 2800, comments: 150, publishedAt: '2026-03-01' },
    { title: 'Pos-Operatorio: O Que Voce Precisa Saber', views: 65000, likes: 2400, comments: 180, publishedAt: '2026-02-15' },
  ];
}

function getDemoInstagramInsights() {
  return {
    followers: 245000,
    followersGrowth: 1200,
    reach: 890000,
    impressions: 1450000,
    engagement: 4.2,
    topPost: { type: 'carousel', likes: 8500, comments: 420 },
  };
}
