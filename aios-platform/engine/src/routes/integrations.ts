import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { setSecret, getSecret, deleteSecret, listSecrets } from '../lib/secrets';
import { log } from '../lib/logger';

const integrations = new Hono();

// ── Integration CRUD ─────────────────────────────────────

interface IntegrationRow {
  id: string;
  status: string;
  config: string;
  message: string | null;
  last_checked: number | null;
  updated_at: string;
}

// GET /integrations — list all
integrations.get('/', (c) => {
  const db = getDb();
  const rows = db.query<IntegrationRow, []>('SELECT * FROM integrations ORDER BY id').all();
  return c.json(rows.map((r) => ({ ...r, config: JSON.parse(r.config) })));
});

// GET /integrations/:id
integrations.get('/:id', (c) => {
  const db = getDb();
  const row = db.query<IntegrationRow, [string]>('SELECT * FROM integrations WHERE id = ?').get(c.req.param('id'));
  if (!row) return c.json({ error: 'Integration not found' }, 404);
  return c.json({ ...row, config: JSON.parse(row.config) });
});

// PUT /integrations/:id — upsert integration config
integrations.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ status?: string; config?: Record<string, string>; message?: string }>();
  const db = getDb();

  db.run(
    `INSERT INTO integrations (id, status, config, message, last_checked, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       status = COALESCE(excluded.status, integrations.status),
       config = COALESCE(excluded.config, integrations.config),
       message = excluded.message,
       last_checked = excluded.last_checked,
       updated_at = datetime('now')`,
    [
      id,
      body.status || 'disconnected',
      JSON.stringify(body.config || {}),
      body.message || null,
      Date.now(),
    ],
  );

  log.info('Integration updated', { id, status: body.status });
  return c.json({ ok: true, id });
});

// DELETE /integrations/:id
integrations.delete('/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  db.run('DELETE FROM integrations WHERE id = ?', [id]);
  log.info('Integration deleted', { id });
  return c.json({ ok: true });
});

// ── Secrets ──────────────────────────────────────────────

// GET /integrations/secrets/list?integration=xxx
integrations.get('/secrets/list', (c) => {
  const integrationId = c.req.query('integration');
  const secrets = listSecrets(integrationId);
  // Never return actual values, only metadata
  return c.json(secrets);
});

// POST /integrations/secrets — store a secret
integrations.post('/secrets', async (c) => {
  const body = await c.req.json<{ key: string; value: string; integration?: string }>();
  if (!body.key || !body.value) {
    return c.json({ error: 'key and value are required' }, 400);
  }
  setSecret(body.key, body.value, body.integration);
  return c.json({ ok: true, key: body.key });
});

// GET /integrations/secrets/:key — retrieve a secret value
integrations.get('/secrets/:key', (c) => {
  const value = getSecret(c.req.param('key'));
  if (value === null) return c.json({ error: 'Secret not found' }, 404);
  // Return masked value + indicator it exists
  return c.json({
    key: c.req.param('key'),
    exists: true,
    preview: value.slice(0, 4) + '••••' + value.slice(-4),
  });
});

// DELETE /integrations/secrets/:key
integrations.delete('/secrets/:key', (c) => {
  const deleted = deleteSecret(c.req.param('key'));
  return c.json({ ok: deleted });
});

export { integrations };
