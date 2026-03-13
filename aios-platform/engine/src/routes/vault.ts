/**
 * Vault SSOT routes — Phase 1 + Phase 2
 *
 * /vault/workspaces/*     — Workspace CRUD
 * /vault/spaces/*         — Space CRUD
 * /vault/documents/*      — Document CRUD + upload + paste + AI memory import
 * /vault/sources/*        — Source CRUD + test + sync
 * /vault/sync-jobs/*      — Sync job status + SSE streaming
 * /vault/ai/*             — AI classification, summarization, taxonomy, quality
 * /vault/packages/*       — Context package CRUD + build + export
 */
import { Hono } from 'hono';
import * as vaultStore from '../core/vault-store';
import { parsePdf } from '../parsers/pdf';
import { parseDocx } from '../parsers/docx';
import { parseXlsx } from '../parsers/xlsx';
import { parseText } from '../parsers/text';
import { classifyDocument, summarizeDocument, suggestTaxonomy, scoreQuality, generateTags } from '../core/ai-services';
import { getConnector, listConnectorTypes } from '../connectors/registry';
import { parseAiMemoryContent } from '../connectors/ai-memory';
import { runSync } from '../core/sync-runner';
import { buildPackage, exportPackage } from '../core/package-builder';
import { formatSSE, createSSEHeaders } from '../lib/sse';

export const vaultApp = new Hono();

// ── Workspaces ──

vaultApp.post('/workspaces', async (c) => {
  const body = await c.req.json<{ name?: string; icon?: string; description?: string }>();
  if (!body.name) return c.json({ error: 'name is required' }, 400);

  const id = vaultStore.createWorkspace({
    name: body.name,
    icon: body.icon,
    description: body.description,
  });
  return c.json(vaultStore.getWorkspace(id), 201);
});

vaultApp.get('/workspaces', (c) => {
  return c.json(vaultStore.listWorkspaces());
});

vaultApp.get('/workspaces/:id', (c) => {
  const workspace = vaultStore.getWorkspace(c.req.param('id'));
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);
  return c.json(workspace);
});

vaultApp.put('/workspaces/:id', async (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getWorkspace(id)) return c.json({ error: 'Workspace not found' }, 404);
  const body = await c.req.json();
  vaultStore.updateWorkspace(id, body);
  return c.json(vaultStore.getWorkspace(id));
});

vaultApp.delete('/workspaces/:id', (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getWorkspace(id)) return c.json({ error: 'Workspace not found' }, 404);
  vaultStore.deleteWorkspace(id);
  return c.json({ deleted: true });
});

// ── Spaces ──

vaultApp.post('/workspaces/:wid/spaces', async (c) => {
  const wid = c.req.param('wid');
  if (!vaultStore.getWorkspace(wid)) return c.json({ error: 'Workspace not found' }, 404);

  const body = await c.req.json<{ name?: string; icon?: string; description?: string }>();
  if (!body.name) return c.json({ error: 'name is required' }, 400);

  const id = vaultStore.createSpace(wid, {
    name: body.name,
    icon: body.icon,
    description: body.description,
  });
  return c.json(vaultStore.getSpace(id), 201);
});

vaultApp.get('/workspaces/:wid/spaces', (c) => {
  return c.json(vaultStore.listSpaces(c.req.param('wid')));
});

vaultApp.get('/spaces/:id', (c) => {
  const space = vaultStore.getSpace(c.req.param('id'));
  if (!space) return c.json({ error: 'Space not found' }, 404);
  return c.json(space);
});

vaultApp.put('/spaces/:id', async (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getSpace(id)) return c.json({ error: 'Space not found' }, 404);
  const body = await c.req.json();
  vaultStore.updateSpace(id, body);
  return c.json(vaultStore.getSpace(id));
});

vaultApp.delete('/spaces/:id', (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getSpace(id)) return c.json({ error: 'Space not found' }, 404);
  vaultStore.deleteSpace(id);
  return c.json({ deleted: true });
});

// ── Documents ──

vaultApp.post('/documents', async (c) => {
  const body = await c.req.json<{
    workspaceId?: string;
    spaceId?: string;
    name?: string;
    type?: string;
    content?: string;
    categoryId?: string;
  }>();

  if (!body.workspaceId || !body.name) {
    return c.json({ error: 'workspaceId and name are required' }, 400);
  }

  const id = vaultStore.createDocument({
    workspaceId: body.workspaceId,
    spaceId: body.spaceId,
    name: body.name,
    type: body.type,
    content: body.content || '',
    categoryId: body.categoryId,
  });
  return c.json(vaultStore.getDocument(id), 201);
});

vaultApp.get('/documents', (c) => {
  const { workspace_id, space_id, status, category } = c.req.query();
  return c.json(vaultStore.listDocuments({ workspaceId: workspace_id, spaceId: space_id, status, category }));
});

// Upload must come before :id to avoid matching 'upload' as an id
vaultApp.post('/documents/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  const workspaceId = body.workspaceId as string;
  const spaceId = (body.spaceId as string) || undefined;
  const categoryId = (body.categoryId as string) || undefined;

  if (!file || typeof file === 'string') {
    return c.json({ error: 'file is required (multipart)' }, 400);
  }
  if (!workspaceId) {
    return c.json({ error: 'workspaceId is required' }, 400);
  }

  const blob = file as unknown as Blob;
  const filename = (file as unknown as { name?: string }).name || 'upload';
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  let parsed: { content: string; metadata: Record<string, unknown> };

  switch (ext) {
    case 'pdf':
      parsed = await parsePdf(buffer, filename);
      break;
    case 'docx':
      parsed = await parseDocx(buffer, filename);
      break;
    case 'xlsx':
    case 'csv':
      parsed = await parseXlsx(buffer, filename);
      break;
    default:
      parsed = await parseText(buffer, filename);
      break;
  }

  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(parsed.content);
  const contentHash = hasher.digest('hex');
  const tokenCount = Math.ceil(parsed.content.split(/\s+/).length / 0.75);

  const id = vaultStore.createDocument({
    workspaceId,
    spaceId,
    name: filename.replace(/\.[^.]+$/, ''),
    type: 'raw',
    content: parsed.content,
    contentHash,
    status: 'raw',
    tokenCount,
    categoryId,
    source: 'File Upload',
  });

  const doc = vaultStore.getDocument(id);
  return c.json({ ...doc, parserMetadata: parsed.metadata }, 201);
});

vaultApp.post('/documents/paste', async (c) => {
  const body = await c.req.json<{
    content?: string;
    name?: string;
    workspaceId?: string;
    spaceId?: string;
    category?: string;
  }>();

  if (!body.content || !body.name || !body.workspaceId) {
    return c.json({ error: 'content, name, and workspaceId are required' }, 400);
  }

  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(body.content);
  const contentHash = hasher.digest('hex');
  const tokenCount = Math.ceil(body.content.split(/\s+/).length / 0.75);

  const id = vaultStore.createDocument({
    workspaceId: body.workspaceId,
    spaceId: body.spaceId,
    name: body.name,
    type: 'raw',
    content: body.content,
    contentHash,
    status: 'raw',
    tokenCount,
    categoryId: body.category,
    source: 'Paste',
  });

  return c.json(vaultStore.getDocument(id), 201);
});

vaultApp.get('/documents/:id', (c) => {
  const doc = vaultStore.getDocument(c.req.param('id'));
  if (!doc) return c.json({ error: 'Document not found' }, 404);
  return c.json(doc);
});

vaultApp.put('/documents/:id', async (c) => {
  const id = c.req.param('id');
  const doc = vaultStore.getDocument(id);
  if (!doc) return c.json({ error: 'Document not found' }, 404);

  const body = await c.req.json();
  if (body.content && body.content !== doc.content) {
    body.token_count = Math.ceil(body.content.split(/\s+/).length / 0.75);
    body.last_updated = new Date().toISOString();
  }
  vaultStore.updateDocument(id, body);
  return c.json(vaultStore.getDocument(id));
});

vaultApp.delete('/documents/:id', (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getDocument(id)) return c.json({ error: 'Document not found' }, 404);
  vaultStore.deleteDocument(id);
  return c.json({ deleted: true });
});

vaultApp.post('/documents/:id/validate', (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getDocument(id)) return c.json({ error: 'Document not found' }, 404);

  vaultStore.updateDocument(id, {
    status: 'validated',
    validated_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  });
  return c.json(vaultStore.getDocument(id));
});

// ── AI Memory Import ──

vaultApp.post('/documents/import-ai-memory', async (c) => {
  const body = await c.req.json<{
    content?: string;
    workspaceId?: string;
    spaceId?: string;
    provider?: string;
  }>();

  if (!body.content || !body.workspaceId) {
    return c.json({ error: 'content and workspaceId are required' }, 400);
  }

  const items = parseAiMemoryContent(body.content, body.provider);
  if (items.length === 0) {
    return c.json({ error: 'No knowledge items could be extracted from the content' }, 400);
  }

  const created: string[] = [];

  for (const item of items) {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(item.content);
    const contentHash = hasher.digest('hex');
    const tokenCount = Math.ceil(item.content.split(/\s+/).length / 0.75);

    const id = vaultStore.createDocument({
      workspaceId: body.workspaceId,
      spaceId: body.spaceId,
      name: item.title,
      type: 'raw',
      content: item.content,
      contentHash,
      status: 'raw',
      tokenCount,
      source: `AI Memory (${item.provider})`,
    });

    created.push(id);
  }

  const docs = created.map((id) => vaultStore.getDocument(id)).filter(Boolean);

  return c.json({
    imported: created.length,
    provider: items[0]?.provider || 'unknown',
    documents: docs,
  }, 201);
});

// ── Sources ──

vaultApp.post('/sources', async (c) => {
  const body = await c.req.json<{
    workspaceId?: string;
    name?: string;
    type?: string;
    config?: Record<string, unknown>;
  }>();

  if (!body.workspaceId || !body.name || !body.type) {
    return c.json({ error: 'workspaceId, name, and type are required' }, 400);
  }

  if (!body.workspaceId || !vaultStore.getWorkspace(body.workspaceId)) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  const validTypes = listConnectorTypes();
  if (!validTypes.includes(body.type) && body.type !== 'manual') {
    return c.json({ error: `Invalid source type. Valid types: manual, ${validTypes.join(', ')}` }, 400);
  }

  const id = vaultStore.createSource({
    workspaceId: body.workspaceId,
    name: body.name,
    type: body.type,
    config: body.config,
  });

  return c.json(vaultStore.getSource(id), 201);
});

vaultApp.get('/workspaces/:wid/sources', (c) => {
  const wid = c.req.param('wid');
  if (!vaultStore.getWorkspace(wid)) return c.json({ error: 'Workspace not found' }, 404);
  return c.json(vaultStore.listSources(wid));
});

vaultApp.get('/sources/:id', (c) => {
  const source = vaultStore.getSource(c.req.param('id'));
  if (!source) return c.json({ error: 'Source not found' }, 404);
  return c.json(source);
});

vaultApp.put('/sources/:id', async (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getSource(id)) return c.json({ error: 'Source not found' }, 404);
  const body = await c.req.json();
  if (body.config && typeof body.config === 'object') {
    body.config = JSON.stringify(body.config);
  }
  vaultStore.updateSource(id, body);
  return c.json(vaultStore.getSource(id));
});

vaultApp.delete('/sources/:id', (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getSource(id)) return c.json({ error: 'Source not found' }, 404);
  vaultStore.deleteSource(id);
  return c.json({ deleted: true });
});

vaultApp.post('/sources/:id/test', async (c) => {
  const id = c.req.param('id');
  const source = vaultStore.getSource(id);
  if (!source) return c.json({ error: 'Source not found' }, 404);

  const connector = getConnector(source.type);
  if (!connector) {
    return c.json({ ok: false, error: `No connector for source type: ${source.type}` });
  }

  const config = JSON.parse(source.config || '{}');
  const result = await connector.testConnection(config);

  // Update source status based on test result
  vaultStore.updateSource(id, {
    status: result.ok ? 'connected' : 'error',
  });

  return c.json(result);
});

vaultApp.post('/sources/:id/sync', async (c) => {
  const id = c.req.param('id');
  const source = vaultStore.getSource(id);
  if (!source) return c.json({ error: 'Source not found' }, 404);

  const body = await c.req.json<{ spaceId?: string }>().catch(() => ({} as { spaceId?: string }));
  const syncSpaceId = body.spaceId || undefined;

  // Start sync in background, return job ID immediately
  const jobId = vaultStore.createSyncJob({
    sourceId: id,
    workspaceId: source.workspace_id,
    spaceId: syncSpaceId,
  });

  // Run async — do not await
  runSync({
    sourceId: id,
    workspaceId: source.workspace_id,
    spaceId: syncSpaceId,
    onProgress: (phase, current, total) => {
      vaultStore.updateSyncJob(jobId, {
        phase,
        progress_current: current,
        progress_total: total,
      });
    },
  }).catch((err) => {
    console.error(`[Vault] Sync job ${jobId} failed:`, err);
    vaultStore.updateSyncJob(jobId, {
      status: 'failed',
      phase: 'error',
      errors: JSON.stringify([{ itemId: 'global', error: (err as Error).message }]),
      completed_at: new Date().toISOString(),
    });
  });

  return c.json({ jobId, status: 'pending' }, 202);
});

// ── Sync Jobs ──

vaultApp.get('/sync-jobs/:id', (c) => {
  const job = vaultStore.getSyncJob(c.req.param('id'));
  if (!job) return c.json({ error: 'Sync job not found' }, 404);

  return c.json({
    ...job,
    errors: JSON.parse(job.errors || '[]'),
  });
});

vaultApp.get('/sync-jobs/:id/stream', async (c) => {
  const jobId = c.req.param('id');
  const job = vaultStore.getSyncJob(jobId);
  if (!job) return c.json({ error: 'Sync job not found' }, 404);

  return new Response(
    new ReadableStream({
      async start(controller) {
        const emit = (event: string, data: unknown) => {
          try {
            controller.enqueue(new TextEncoder().encode(formatSSE(event, data)));
          } catch {
            // Stream closed
          }
        };

        // Poll job status until it completes
        const POLL_INTERVAL = 500;
        const TIMEOUT = 5 * 60 * 1000; // 5 minutes
        const startTime = Date.now();

        // Send initial state
        emit('sync:state', {
          jobId,
          status: job.status,
          phase: job.phase,
          progressCurrent: job.progress_current,
          progressTotal: job.progress_total,
        });

        while (true) {
          await Bun.sleep(POLL_INTERVAL);

          const current = vaultStore.getSyncJob(jobId);
          if (!current) {
            emit('sync:error', { error: 'Job disappeared' });
            break;
          }

          emit('sync:progress', {
            jobId,
            status: current.status,
            phase: current.phase,
            progressCurrent: current.progress_current,
            progressTotal: current.progress_total,
            documentsCreated: current.documents_created,
            documentsSkipped: current.documents_skipped,
          });

          if (current.status === 'completed' || current.status === 'failed') {
            emit('sync:completed', {
              jobId,
              status: current.status,
              documentsCreated: current.documents_created,
              documentsUpdated: current.documents_updated,
              documentsSkipped: current.documents_skipped,
              errors: JSON.parse(current.errors || '[]'),
              completedAt: current.completed_at,
            });
            break;
          }

          if (Date.now() - startTime > TIMEOUT) {
            emit('sync:error', { error: 'SSE stream timeout (5 minutes)' });
            break;
          }
        }

        try {
          controller.close();
        } catch {
          // Already closed
        }
      },
    }),
    { headers: createSSEHeaders() }
  );
});

// ── AI Services ──

vaultApp.post('/ai/classify', async (c) => {
  const body = await c.req.json<{ content?: string; name?: string }>();
  if (!body.content || !body.name) {
    return c.json({ error: 'content and name are required' }, 400);
  }

  const result = await classifyDocument(body.content, body.name);
  return c.json(result);
});

vaultApp.post('/ai/summarize', async (c) => {
  const body = await c.req.json<{ content?: string; maxTokens?: number }>();
  if (!body.content) {
    return c.json({ error: 'content is required' }, 400);
  }

  const summary = await summarizeDocument(body.content, body.maxTokens);
  return c.json({ summary });
});

vaultApp.post('/ai/suggest-taxonomy', async (c) => {
  const body = await c.req.json<{ content?: string; name?: string; category?: string }>();
  if (!body.content || !body.name) {
    return c.json({ error: 'content and name are required' }, 400);
  }

  const result = await suggestTaxonomy(body.content, body.name, body.category || 'generic');
  return c.json(result);
});

vaultApp.post('/ai/quality-score', async (c) => {
  const body = await c.req.json<{ content?: string; name?: string }>();
  if (!body.content || !body.name) {
    return c.json({ error: 'content and name are required' }, 400);
  }

  const result = await scoreQuality(body.content, body.name);
  return c.json(result);
});

vaultApp.post('/ai/generate-tags', async (c) => {
  const body = await c.req.json<{ content?: string; name?: string }>();
  if (!body.content || !body.name) {
    return c.json({ error: 'content and name are required' }, 400);
  }

  const tags = await generateTags(body.content, body.name);
  return c.json({ tags });
});

// ── Context Packages ──

vaultApp.post('/packages', async (c) => {
  const body = await c.req.json<{
    workspaceId?: string;
    name?: string;
    description?: string;
    filterCriteria?: Record<string, unknown>;
    documentIds?: string[];
  }>();

  if (!body.workspaceId || !body.name) {
    return c.json({ error: 'workspaceId and name are required' }, 400);
  }

  if (!vaultStore.getWorkspace(body.workspaceId)) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  const id = vaultStore.createPackage({
    workspaceId: body.workspaceId,
    name: body.name,
    description: body.description,
    filterCriteria: body.filterCriteria,
    documentIds: body.documentIds,
  });

  return c.json(vaultStore.getPackage(id), 201);
});

vaultApp.get('/packages', (c) => {
  const workspaceId = c.req.query('workspace_id');
  return c.json(vaultStore.listPackages(workspaceId || undefined));
});

vaultApp.get('/packages/:id', (c) => {
  const pkg = vaultStore.getPackage(c.req.param('id'));
  if (!pkg) return c.json({ error: 'Package not found' }, 404);
  return c.json(pkg);
});

vaultApp.put('/packages/:id', async (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getPackage(id)) return c.json({ error: 'Package not found' }, 404);

  const body = await c.req.json();

  // Serialize complex fields
  if (body.filterCriteria && typeof body.filterCriteria === 'object') {
    body.filter_criteria = JSON.stringify(body.filterCriteria);
    delete body.filterCriteria;
  }
  if (body.documentIds && Array.isArray(body.documentIds)) {
    body.document_ids = JSON.stringify(body.documentIds);
    delete body.documentIds;
  }

  vaultStore.updatePackage(id, body);
  return c.json(vaultStore.getPackage(id));
});

vaultApp.delete('/packages/:id', (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getPackage(id)) return c.json({ error: 'Package not found' }, 404);
  vaultStore.deletePackage(id);
  return c.json({ deleted: true });
});

vaultApp.get('/packages/:id/export', (c) => {
  const id = c.req.param('id');
  const pkg = vaultStore.getPackage(id);
  if (!pkg) return c.json({ error: 'Package not found' }, 404);

  const format = (c.req.query('format') || 'markdown') as 'markdown' | 'json' | 'yaml';

  try {
    const content = exportPackage(id, format);

    if (format === 'markdown') {
      return new Response(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${pkg.name.replace(/[^a-z0-9-_]/gi, '_')}.md"`,
        },
      });
    }

    if (format === 'yaml') {
      return new Response(content, {
        headers: {
          'Content-Type': 'text/yaml; charset=utf-8',
          'Content-Disposition': `attachment; filename="${pkg.name.replace(/[^a-z0-9-_]/gi, '_')}.yaml"`,
        },
      });
    }

    // JSON
    return c.json(JSON.parse(content));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

vaultApp.post('/packages/:id/build', async (c) => {
  const id = c.req.param('id');
  if (!vaultStore.getPackage(id)) return c.json({ error: 'Package not found' }, 404);

  try {
    const result = await buildPackage(id);
    const pkg = vaultStore.getPackage(id);
    return c.json({
      ...result,
      package: pkg,
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
