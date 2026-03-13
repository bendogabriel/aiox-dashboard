/**
 * Vault SSOT routes — Phase 1
 *
 * Workspaces:
 *   POST   /                        Create workspace
 *   GET    /                        List workspaces
 *   GET    /:id                     Get workspace
 *   PUT    /:id                     Update workspace
 *   DELETE /:id                     Delete workspace
 *
 * Spaces:
 *   POST   /:wid/spaces             Create space
 *   GET    /:wid/spaces             List spaces
 *   GET    /spaces/:id              Get space
 *   PUT    /spaces/:id              Update space
 *   DELETE /spaces/:id              Delete space
 *
 * Documents:
 *   POST   /documents               Create document
 *   GET    /documents               List (query: workspace_id, space_id, category, status)
 *   GET    /documents/:id           Get document
 *   PUT    /documents/:id           Update document
 *   DELETE /documents/:id           Delete document
 *   POST   /documents/:id/validate  Mark as validated
 *   POST   /documents/upload        Multipart file upload
 *   POST   /documents/paste         Text paste
 */
import { Hono } from 'hono';
import * as vaultStore from '../core/vault-store';
import { parsePdf } from '../parsers/pdf';
import { parseDocx } from '../parsers/docx';
import { parseXlsx } from '../parsers/xlsx';
import { parseText } from '../parsers/text';

export const vaultApp = new Hono();

// ── Workspaces ──

vaultApp.post('/', async (c) => {
  const body = await c.req.json<{ name?: string; icon?: string; description?: string }>();
  if (!body.name) return c.json({ error: 'name is required' }, 400);

  const id = vaultStore.createWorkspace({
    name: body.name,
    icon: body.icon,
    description: body.description,
  });
  const workspace = vaultStore.getWorkspace(id);
  return c.json(workspace, 201);
});

vaultApp.get('/', (c) => {
  const workspaces = vaultStore.listWorkspaces();
  return c.json(workspaces);
});

vaultApp.get('/:id', (c) => {
  const workspace = vaultStore.getWorkspace(c.req.param('id'));
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);
  return c.json(workspace);
});

vaultApp.put('/:id', async (c) => {
  const id = c.req.param('id');
  const workspace = vaultStore.getWorkspace(id);
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);

  const body = await c.req.json();
  vaultStore.updateWorkspace(id, body);
  return c.json(vaultStore.getWorkspace(id));
});

vaultApp.delete('/:id', (c) => {
  const id = c.req.param('id');
  const workspace = vaultStore.getWorkspace(id);
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);

  vaultStore.deleteWorkspace(id);
  return c.json({ deleted: true });
});

// ── Spaces ──

vaultApp.post('/:wid/spaces', async (c) => {
  const wid = c.req.param('wid');
  const workspace = vaultStore.getWorkspace(wid);
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);

  const body = await c.req.json<{ name?: string; icon?: string; description?: string }>();
  if (!body.name) return c.json({ error: 'name is required' }, 400);

  const id = vaultStore.createSpace(wid, {
    name: body.name,
    icon: body.icon,
    description: body.description,
  });
  const space = vaultStore.getSpace(id);
  return c.json(space, 201);
});

vaultApp.get('/:wid/spaces', (c) => {
  const wid = c.req.param('wid');
  const spaces = vaultStore.listSpaces(wid);
  return c.json(spaces);
});

vaultApp.get('/spaces/:id', (c) => {
  const space = vaultStore.getSpace(c.req.param('id'));
  if (!space) return c.json({ error: 'Space not found' }, 404);
  return c.json(space);
});

vaultApp.put('/spaces/:id', async (c) => {
  const id = c.req.param('id');
  const space = vaultStore.getSpace(id);
  if (!space) return c.json({ error: 'Space not found' }, 404);

  const body = await c.req.json();
  vaultStore.updateSpace(id, body);
  return c.json(vaultStore.getSpace(id));
});

vaultApp.delete('/spaces/:id', (c) => {
  const id = c.req.param('id');
  const space = vaultStore.getSpace(id);
  if (!space) return c.json({ error: 'Space not found' }, 404);

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
  const doc = vaultStore.getDocument(id);
  return c.json(doc, 201);
});

vaultApp.get('/documents', (c) => {
  const { workspace_id, space_id, status, category } = c.req.query();
  const docs = vaultStore.listDocuments({
    workspaceId: workspace_id,
    spaceId: space_id,
    status,
    category,
  });
  return c.json(docs);
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
  // Recalculate token count if content changed
  if (body.content && body.content !== doc.content) {
    body.token_count = Math.ceil(body.content.split(/\s+/).length / 0.75);
    body.last_updated = new Date().toISOString();
  }
  vaultStore.updateDocument(id, body);
  return c.json(vaultStore.getDocument(id));
});

vaultApp.delete('/documents/:id', (c) => {
  const id = c.req.param('id');
  const doc = vaultStore.getDocument(id);
  if (!doc) return c.json({ error: 'Document not found' }, 404);

  vaultStore.deleteDocument(id);
  return c.json({ deleted: true });
});

vaultApp.post('/documents/:id/validate', (c) => {
  const id = c.req.param('id');
  const doc = vaultStore.getDocument(id);
  if (!doc) return c.json({ error: 'Document not found' }, 404);

  vaultStore.updateDocument(id, {
    status: 'validated',
    validated_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  });
  return c.json(vaultStore.getDocument(id));
});

// ── File Upload ──

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

  // Route to parser based on extension
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

  // Compute content hash
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(parsed.content);
  const contentHash = hasher.digest('hex');

  // Estimate token count
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

// ── Text Paste ──

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

  const doc = vaultStore.getDocument(id);
  return c.json(doc, 201);
});
