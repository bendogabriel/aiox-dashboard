import { Hono } from 'hono';
import { log } from '../lib/logger';
import { resolveApiKey } from '../lib/secrets';

// ============================================================
// Telegram Bot Integration — Bot API
// ============================================================

const telegram = new Hono();

// ── Config ───────────────────────────────────────────────

const BOT_TOKEN = () => resolveApiKey('telegram-bot-token', 'TELEGRAM_BOT_TOKEN') || '';
const WEBHOOK_SECRET = () => process.env.TELEGRAM_WEBHOOK_SECRET || '';
const TELEGRAM_API = 'https://api.telegram.org';

function isConfigured(): boolean {
  return !!BOT_TOKEN();
}

function botUrl(method: string): string {
  return `${TELEGRAM_API}/bot${BOT_TOKEN()}/${method}`;
}

// ── SSE Client Management ────────────────────────────────

interface SSEClient {
  controller: ReadableStreamDefaultController;
}

const sseClients = new Set<SSEClient>();
const eventBuffer: Array<{ event: string; data: string; ts: number }> = [];
const MAX_BUFFER = 100;

function broadcast(event: string, data: unknown): void {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const msg = `event: ${event}\ndata: ${payload}\n\n`;
  eventBuffer.push({ event, data: payload, ts: Date.now() });
  if (eventBuffer.length > MAX_BUFFER) eventBuffer.shift();
  for (const client of sseClients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(msg));
    } catch {
      sseClients.delete(client);
    }
  }
}

// ── Routes ───────────────────────────────────────────────

// GET /telegram/status — Check configuration and bot info
telegram.get('/status', async (c) => {
  if (!isConfigured()) {
    return c.json({ configured: false });
  }
  try {
    const res = await fetch(botUrl('getMe'));
    const data = await res.json() as { ok: boolean; result?: { username: string; first_name: string } };
    if (!data.ok) {
      return c.json({ configured: true, bot_username: null, error: 'Invalid token' });
    }

    // Check webhook info
    const whRes = await fetch(botUrl('getWebhookInfo'));
    const whData = await whRes.json() as { ok: boolean; result?: { url: string; has_custom_certificate: boolean; pending_update_count: number } };
    const webhookUrl = whData.result?.url || '';

    return c.json({
      configured: true,
      bot_username: data.result?.username,
      bot_name: data.result?.first_name,
      webhook_set: !!webhookUrl,
      webhook_url: webhookUrl || null,
      pending_updates: whData.result?.pending_update_count || 0,
    });
  } catch (err) {
    log.error('Telegram status check failed', { error: (err as Error).message });
    return c.json({ configured: true, error: 'API unreachable' }, 500);
  }
});

// POST /telegram/webhook — Set webhook URL
telegram.post('/webhook/setup', async (c) => {
  if (!isConfigured()) {
    return c.json({ success: false, error: 'Bot token not configured' }, 400);
  }

  const body = await c.req.json<{ url?: string }>().catch(() => ({}));
  // Default to engine's own webhook endpoint
  const webhookUrl = body.url || `${process.env.TELEGRAM_WEBHOOK_URL || ''}`;
  if (!webhookUrl) {
    return c.json({ success: false, error: 'TELEGRAM_WEBHOOK_URL not set and no url provided' }, 400);
  }

  try {
    const params: Record<string, string> = { url: webhookUrl };
    if (WEBHOOK_SECRET()) {
      params.secret_token = WEBHOOK_SECRET();
    }

    const res = await fetch(botUrl('setWebhook'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json() as { ok: boolean; description?: string };

    if (data.ok) {
      log.info('Telegram webhook set', { url: webhookUrl });
      return c.json({ success: true, message: `Webhook set to ${webhookUrl}` });
    } else {
      return c.json({ success: false, error: data.description || 'Failed to set webhook' });
    }
  } catch (err) {
    log.error('Failed to set Telegram webhook', { error: (err as Error).message });
    return c.json({ success: false, error: 'API unreachable' }, 500);
  }
});

// POST /telegram/webhook — Receive incoming updates
telegram.post('/webhook', async (c) => {
  // Verify secret token if configured
  const secret = WEBHOOK_SECRET();
  if (secret) {
    const headerSecret = c.req.header('x-telegram-bot-api-secret-token');
    if (headerSecret !== secret) {
      log.warn('Telegram webhook: invalid secret token');
      return c.json({ ok: true }); // Return 200 to avoid retries
    }
  }

  try {
    const update = await c.req.json<{
      update_id: number;
      message?: {
        message_id: number;
        from: { id: number; first_name: string; username?: string };
        chat: { id: number; type: string };
        text?: string;
        date: number;
      };
      callback_query?: {
        id: string;
        from: { id: number; first_name: string };
        data?: string;
      };
    }>();

    log.info('Telegram update received', {
      update_id: update.update_id,
      type: update.message ? 'message' : update.callback_query ? 'callback_query' : 'other',
    });

    // Broadcast to SSE clients
    if (update.message) {
      broadcast('message', {
        id: update.message.message_id,
        from: update.message.from.first_name,
        username: update.message.from.username,
        chat_id: update.message.chat.id,
        text: update.message.text || '',
        timestamp: update.message.date,
      });
    } else if (update.callback_query) {
      broadcast('callback', {
        id: update.callback_query.id,
        from: update.callback_query.from.first_name,
        data: update.callback_query.data,
      });
    }
  } catch (err) {
    log.error('Telegram webhook parse error', { error: (err as Error).message });
  }

  return c.json({ ok: true });
});

// POST /telegram/send — Send a message
telegram.post('/send', async (c) => {
  if (!isConfigured()) {
    return c.json({ error: 'Bot token not configured' }, 400);
  }

  const body = await c.req.json<{
    chat_id: number | string;
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: unknown;
  }>();

  if (!body.chat_id || !body.text) {
    return c.json({ error: 'chat_id and text are required' }, 400);
  }

  try {
    const res = await fetch(botUrl('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: body.chat_id,
        text: body.text,
        parse_mode: body.parse_mode || 'HTML',
        reply_markup: body.reply_markup,
      }),
    });
    const data = await res.json() as { ok: boolean; result?: unknown; description?: string };

    if (data.ok) {
      broadcast('sent', { chat_id: body.chat_id, text: body.text });
      return c.json({ success: true, result: data.result });
    } else {
      return c.json({ success: false, error: data.description }, 400);
    }
  } catch (err) {
    log.error('Telegram send failed', { error: (err as Error).message });
    return c.json({ error: 'API unreachable' }, 500);
  }
});

// POST /telegram/test — Send test message to the bot itself (getMe chat)
telegram.post('/test', async (c) => {
  if (!isConfigured()) {
    return c.json({ success: false, error: 'Bot token not configured' }, 400);
  }

  try {
    // Get bot info first
    const meRes = await fetch(botUrl('getMe'));
    const meData = await meRes.json() as { ok: boolean; result?: { id: number; username: string } };
    if (!meData.ok || !meData.result) {
      return c.json({ success: false, error: 'Cannot get bot info' });
    }

    return c.json({
      success: true,
      message: `Bot @${meData.result.username} is active. Send a message to the bot to test webhook delivery.`,
      bot_id: meData.result.id,
    });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 500);
  }
});

// GET /telegram/events — SSE stream
telegram.get('/events', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const client: SSEClient = { controller };
      sseClients.add(client);
      log.info('Telegram SSE client connected', { total: sseClients.size });

      // Send buffered events
      for (const ev of eventBuffer) {
        controller.enqueue(new TextEncoder().encode(`event: ${ev.event}\ndata: ${ev.data}\n\n`));
      }

      // Heartbeat
      const hb = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(hb);
          sseClients.delete(client);
        }
      }, 15_000);

      // Cleanup when client disconnects
      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(hb);
        sseClients.delete(client);
        log.info('Telegram SSE client disconnected', { total: sseClients.size });
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

export { telegram };
