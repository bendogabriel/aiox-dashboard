import { Hono } from 'hono';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { parse as parseYaml } from 'yaml';
import { getProjectPaths, aiosCorePath, squadsPath } from '../lib/config';
import { log } from '../lib/logger';

// ============================================================
// /registry — Project registry routes (squads, agents, workflows, resources)
// Makes the engine the single data gateway for any connected project.
// ============================================================

export const registry = new Hono();

// ── Types ──────────────────────────────────────────────────

interface SquadInfo {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  agentCount: number;
  taskCount: number;
  workflowCount: number;
  checklistCount: number;
  templateCount: number;
  dataCount: number;
  protocolCount: number;
  configCount: number;
  docCount: number;
  scriptCount: number;
  ruleCount: number;
  mindCount: number;
  skillCount: number;
  hasConfig: boolean;
}

interface AgentInfo {
  id: string;
  name: string;
  squadId: string;
  role?: string;
  description?: string;
  filePath: string;
}

interface TaskInfo {
  id: string;
  name: string;
  squadId: string;
  command?: string;
  agent?: string;
  purpose?: string;
  file: string;
}

interface WorkflowInfo {
  id: string;
  name: string;
  squadId: string;
  description: string;
  phases: number;
  file: string;
}

interface CommandInfo {
  id: string;
  name: string;
  squadId: string;
  agentId?: string;
  command: string;
  purpose?: string;
  file: string;
}

// Resource types that can be discovered from squad/core folders
type ResourceType = 'checklists' | 'templates' | 'data' | 'protocols' | 'config' | 'docs' | 'scripts' | 'rules' | 'minds' | 'skills';

const RESOURCE_TYPES: ResourceType[] = ['checklists', 'templates', 'data', 'protocols', 'config', 'docs', 'scripts', 'rules', 'minds', 'skills'];

interface ResourceInfo {
  id: string;
  name: string;
  squadId: string;
  type: ResourceType;
  file: string;
  filePath: string;
  description?: string;
  format: string;           // 'md' | 'yaml' | 'json' | 'js' | 'py' | 'cjs' | 'directory' | etc.
  // Type-specific metadata
  checkboxTotal?: number;   // checklists: total checkbox items
  checkboxChecked?: number; // checklists: checked items
  runtime?: string;         // scripts: 'node' | 'python' | 'bash'
  subItems?: number;        // minds: number of heuristic/artifact files inside
}

// ── GET /registry/squads ───────────────────────────────────

registry.get('/squads', (c) => {
  try {
    const squads = discoverSquads();
    return c.json({ squads, count: squads.length, projectRoot: getProjectPaths().projectRoot });
  } catch (err) {
    log.error('Failed to discover squads', { error: (err as Error).message });
    return c.json({ squads: [], count: 0, error: (err as Error).message }, 500);
  }
});

// ── GET /registry/agents ──────────────────────────────────

registry.get('/agents', (c) => {
  const squadFilter = c.req.query('squad');
  try {
    const agents = discoverAgents(squadFilter);
    return c.json({ agents, count: agents.length });
  } catch (err) {
    log.error('Failed to discover agents', { error: (err as Error).message });
    return c.json({ agents: [], count: 0, error: (err as Error).message }, 500);
  }
});

// ── GET /registry/agents/:squadId/:agentId ────────────────

registry.get('/agents/:squadId/:agentId', (c) => {
  const { squadId, agentId } = c.req.param();
  try {
    const agent = loadAgentDetail(squadId, agentId);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    return c.json(agent);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /registry/workflows ───────────────────────────────

registry.get('/workflows', (c) => {
  const squadFilter = c.req.query('squad');
  try {
    const workflows = discoverWorkflows(squadFilter);
    return c.json({ workflows, count: workflows.length });
  } catch (err) {
    return c.json({ workflows: [], count: 0, error: (err as Error).message }, 500);
  }
});

// ── GET /registry/tasks ───────────────────────────────────

registry.get('/tasks', (c) => {
  const squadFilter = c.req.query('squad');
  try {
    const tasks = discoverTasks(squadFilter);
    return c.json({ tasks, count: tasks.length });
  } catch (err) {
    return c.json({ tasks: [], count: 0, error: (err as Error).message }, 500);
  }
});

// ── GET /registry/commands ────────────────────────────────

registry.get('/commands', (c) => {
  const squadFilter = c.req.query('squad');
  try {
    const commands = discoverCommands(squadFilter);
    return c.json({ commands, count: commands.length });
  } catch (err) {
    return c.json({ commands: [], count: 0, error: (err as Error).message }, 500);
  }
});

// ── GET /registry/resources?type=X&squad=Y ────────────────

registry.get('/resources', (c) => {
  const typeFilter = c.req.query('type') as ResourceType | undefined;
  const squadFilter = c.req.query('squad');
  try {
    if (typeFilter && !RESOURCE_TYPES.includes(typeFilter)) {
      return c.json({ error: `Invalid type. Valid: ${RESOURCE_TYPES.join(', ')}` }, 400);
    }
    const types = typeFilter ? [typeFilter] : RESOURCE_TYPES;
    const resources: ResourceInfo[] = [];
    for (const t of types) {
      resources.push(...discoverResources(t, squadFilter));
    }
    return c.json({ resources, count: resources.length, types: typeFilter ? [typeFilter] : RESOURCE_TYPES });
  } catch (err) {
    log.error('Failed to discover resources', { error: (err as Error).message });
    return c.json({ resources: [], count: 0, error: (err as Error).message }, 500);
  }
});

// ── GET /registry/resources/:type/:squadId/:id ────────────

registry.get('/resources/:type/:squadId/:id', (c) => {
  const { type, squadId, id } = c.req.param();
  if (!RESOURCE_TYPES.includes(type as ResourceType)) {
    return c.json({ error: `Invalid type. Valid: ${RESOURCE_TYPES.join(', ')}` }, 400);
  }
  try {
    const detail = loadResourceDetail(type as ResourceType, squadId, id);
    if (!detail) {
      return c.json({ error: 'Resource not found' }, 404);
    }
    return c.json(detail);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /registry/resource-types ──────────────────────────

registry.get('/resource-types', (c) => {
  return c.json({ types: RESOURCE_TYPES });
});

// ── GET /registry/project ─────────────────────────────────

registry.get('/project', (c) => {
  const paths = getProjectPaths();
  return c.json({
    projectRoot: paths.projectRoot,
    aiosCore: paths.aiosCore,
    squads: paths.squads,
    rules: paths.rules,
    engineRoot: paths.engineRoot,
    hasAiosCore: existsSync(paths.aiosCore),
    hasSquads: existsSync(paths.squads),
    hasRules: existsSync(paths.rules),
  });
});

// ============================================================
// Discovery Logic
// ============================================================

function discoverSquads(): SquadInfo[] {
  const squads: SquadInfo[] = [];

  // 1. Try SQUAD-REGISTRY.yaml first (fast path)
  const registryPath = aiosCorePath('SQUAD-REGISTRY.yaml');
  if (existsSync(registryPath)) {
    try {
      const raw = readFileSync(registryPath, 'utf-8');
      const parsed = parseYaml(raw) as Record<string, unknown>;
      const squadsData = (parsed as Record<string, Record<string, unknown>[]>).squads || [];
      for (const s of squadsData) {
        squads.push({
          id: String(s.id || s.name || ''),
          name: formatName(String(s.name || s.id || '')),
          description: s.description ? String(s.description) : undefined,
          domain: s.domain ? String(s.domain) : undefined,
          agentCount: Array.isArray(s.agents) ? s.agents.length : 0,
          taskCount: 0,
          workflowCount: 0,
          checklistCount: 0,
          templateCount: 0,
          dataCount: 0,
          protocolCount: 0,
          configCount: 0,
          docCount: 0,
          scriptCount: 0,
          ruleCount: 0,
          mindCount: 0,
          skillCount: 0,
          hasConfig: true,
        });
      }
      if (squads.length > 0) return squads;
    } catch { /* fall through to directory scan */ }
  }

  // 2. Scan squads/ directory
  const squadsDir = getProjectPaths().squads;
  if (!existsSync(squadsDir)) return squads;

  const entries = readdirSync(squadsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const squadDir = resolve(squadsDir, entry.name);
    const configPath = resolve(squadDir, 'squad.yaml');
    const altConfigPath = resolve(squadDir, 'config.yaml');
    const hasConfig = existsSync(configPath) || existsSync(altConfigPath);

    let name = formatName(entry.name);
    let description: string | undefined;
    let domain: string | undefined;

    if (hasConfig) {
      try {
        const raw = readFileSync(existsSync(configPath) ? configPath : altConfigPath, 'utf-8');
        const parsed = parseYaml(raw) as Record<string, string>;
        name = parsed.name || name;
        description = parsed.description;
        domain = parsed.domain;
      } catch { /* use defaults */ }
    }

    const agentsDir = resolve(squadDir, 'agents');
    const tasksDir = resolve(squadDir, 'tasks');
    const workflowsDir = resolve(squadDir, 'workflows');

    squads.push({
      id: entry.name,
      name,
      description,
      domain,
      agentCount: countMdFiles(agentsDir),
      taskCount: countMdFiles(tasksDir),
      workflowCount: countYamlFiles(workflowsDir),
      checklistCount: countMdFiles(resolve(squadDir, 'checklists')),
      templateCount: countAllFiles(resolve(squadDir, 'templates')),
      dataCount: countAllFiles(resolve(squadDir, 'data')),
      protocolCount: countMdFiles(resolve(squadDir, 'protocols')),
      configCount: countAllFiles(resolve(squadDir, 'config')),
      docCount: countMdFiles(resolve(squadDir, 'docs')),
      scriptCount: countScriptFiles(resolve(squadDir, 'scripts')),
      ruleCount: countMdFiles(resolve(squadDir, 'rules')),
      mindCount: countSubDirs(resolve(squadDir, 'minds')),
      skillCount: countMdFiles(resolve(squadDir, 'skills')),
      hasConfig,
    });
  }

  return squads;
}

function discoverAgents(squadFilter?: string): AgentInfo[] {
  const agents: AgentInfo[] = [];

  // 1. Core agents from .aios-core/development/agents/
  const coreAgentsDir = aiosCorePath('development', 'agents');
  if (existsSync(coreAgentsDir)) {
    const files = readdirSync(coreAgentsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const id = basename(file, '.md');
      if (squadFilter && squadFilter !== 'core') continue;
      const filePath = resolve(coreAgentsDir, file);
      const { role, description } = parseAgentHeader(filePath);
      agents.push({ id, name: formatName(id), squadId: 'core', role, description, filePath });
    }
  }

  // 2. Squad-specific agents from squads/{id}/agents/
  const squadsDir = getProjectPaths().squads;
  if (existsSync(squadsDir)) {
    const squadDirs = readdirSync(squadsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const squad of squadDirs) {
      if (squadFilter && squadFilter !== squad.name) continue;
      const agentsDir = resolve(squadsDir, squad.name, 'agents');
      if (!existsSync(agentsDir)) continue;

      const files = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const id = basename(file, '.md');
        const filePath = resolve(agentsDir, file);
        const { role, description } = parseAgentHeader(filePath);
        agents.push({ id, name: formatName(id), squadId: squad.name, role, description, filePath });
      }
    }
  }

  return agents;
}

function loadAgentDetail(squadId: string, agentId: string): Record<string, unknown> | null {
  const paths = [
    squadsPath(squadId, 'agents', `${agentId}.md`),
    aiosCorePath('development', 'agents', `${agentId}.md`),
  ];

  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf-8');
    const { role, description } = parseAgentHeader(p);
    return { id: agentId, squadId, name: formatName(agentId), role, description, content, filePath: p };
  }

  return null;
}

function discoverWorkflows(squadFilter?: string): WorkflowInfo[] {
  const workflows: WorkflowInfo[] = [];

  // 1. Core workflows from .aios-core/development/workflows/
  if (!squadFilter || squadFilter === 'core') {
    const coreDir = aiosCorePath('development', 'workflows');
    if (existsSync(coreDir)) {
      scanWorkflowDir(coreDir, 'core', workflows);
    }
  }

  // 2. Squad-specific workflows from squads/{id}/workflows/
  const squadsDir = getProjectPaths().squads;
  if (existsSync(squadsDir)) {
    const squadDirs = readdirSync(squadsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const squad of squadDirs) {
      if (squadFilter && squadFilter !== squad.name) continue;
      const wfDir = resolve(squadsDir, squad.name, 'workflows');
      if (!existsSync(wfDir)) continue;
      scanWorkflowDir(wfDir, squad.name, workflows);
    }
  }

  return workflows;
}

function scanWorkflowDir(dir: string, squadId: string, out: WorkflowInfo[]) {
  const files = readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  for (const file of files) {
    try {
      const raw = readFileSync(resolve(dir, file), 'utf-8');
      const parsed = parseYaml(raw) as Record<string, unknown>;
      // Support nested workflow key (workflow.name) or top-level (name)
      const wf = (parsed.workflow || parsed) as Record<string, unknown>;
      out.push({
        id: basename(file, extname(file)),
        name: String(wf.name || parsed.name || formatName(basename(file, extname(file)))),
        squadId,
        description: String(wf.description || parsed.description || ''),
        phases: Array.isArray(wf.phases || parsed.phases)
          ? (wf.phases as unknown[] || parsed.phases as unknown[]).length
          : 0,
        file,
      });
    } catch { /* skip broken files */ }
  }
}

function discoverTasks(squadFilter?: string): TaskInfo[] {
  const tasks: TaskInfo[] = [];

  // 1. Core tasks from .aios-core/development/tasks/
  if (!squadFilter || squadFilter === 'core') {
    const coreDir = aiosCorePath('development', 'tasks');
    if (existsSync(coreDir)) {
      scanTaskDir(coreDir, 'core', tasks);
    }
  }

  // 2. Squad-specific tasks from squads/{id}/tasks/
  const squadsDir = getProjectPaths().squads;
  if (existsSync(squadsDir)) {
    const squadDirs = readdirSync(squadsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const squad of squadDirs) {
      if (squadFilter && squadFilter !== squad.name) continue;
      const taskDir = resolve(squadsDir, squad.name, 'tasks');
      if (!existsSync(taskDir)) continue;
      scanTaskDir(taskDir, squad.name, tasks);
    }
  }

  return tasks;
}

function scanTaskDir(dir: string, squadId: string, out: TaskInfo[]) {
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const id = basename(file, '.md');
    const filePath = resolve(dir, file);
    const header = parseTaskHeader(filePath);
    out.push({
      id,
      name: header.name || formatName(id),
      squadId,
      command: header.command,
      agent: header.agent,
      purpose: header.purpose,
      file,
    });
  }
}

function parseTaskHeader(filePath: string): { name?: string; command?: string; agent?: string; purpose?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 10);
    let name: string | undefined;
    let command: string | undefined;
    let agent: string | undefined;
    let purpose: string | undefined;

    for (const line of lines) {
      // # Task: task-name
      const titleMatch = line.match(/^#\s+(?:Task:\s*)?(.+)/i);
      if (titleMatch && !name) name = titleMatch[1].trim();
      // **Command:** `*command-name {args}`
      const cmdMatch = line.match(/\*\*Command\*\*:\s*`([^`]+)`/i);
      if (cmdMatch) command = cmdMatch[1].trim();
      // **Agent:** Agent Name
      const agentMatch = line.match(/\*\*Agent\*\*:\s*(.+)/i);
      if (agentMatch) agent = agentMatch[1].trim();
      // **Purpose:** description
      const purposeMatch = line.match(/\*\*Purpose\*\*:\s*(.+)/i);
      if (purposeMatch) purpose = purposeMatch[1].trim();
    }

    return { name, command, agent, purpose };
  } catch { return {}; }
}

function discoverCommands(squadFilter?: string): CommandInfo[] {
  const commands: CommandInfo[] = [];

  // Extract commands from task definitions (tasks contain command metadata)
  const tasks = discoverTasks(squadFilter);
  for (const task of tasks) {
    if (task.command) {
      commands.push({
        id: task.id,
        name: task.name,
        squadId: task.squadId,
        agentId: task.agent ? slugify(task.agent) : undefined,
        command: task.command,
        purpose: task.purpose,
        file: task.file,
      });
    }
  }

  return commands;
}

// ============================================================
// Resource Discovery (checklists, templates, data, protocols,
// config, docs, scripts, rules, minds, skills)
// ============================================================

// Core path mapping: where each resource type lives in .aios-core
const CORE_RESOURCE_PATHS: Partial<Record<ResourceType, string[]>> = {
  checklists: ['development/checklists', 'product/checklists'],
  templates: ['development/templates', 'product/templates', 'infrastructure/templates'],
  data: ['development/data', 'product/data', 'data'],
  scripts: ['development/scripts', 'scripts', 'infrastructure/scripts'],
};

function discoverResources(resourceType: ResourceType, squadFilter?: string): ResourceInfo[] {
  const resources: ResourceInfo[] = [];

  // 1. Core resources from .aios-core
  if (!squadFilter || squadFilter === 'core') {
    const corePaths = CORE_RESOURCE_PATHS[resourceType] || [];
    for (const subPath of corePaths) {
      const dir = aiosCorePath(...subPath.split('/'));
      if (!existsSync(dir)) continue;
      scanResourceDir(dir, 'core', resourceType, resources);
    }
  }

  // 2. Squad-specific resources from squads/{id}/{resourceType}/
  const squadsDir = getProjectPaths().squads;
  if (existsSync(squadsDir)) {
    const squadDirs = readdirSync(squadsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const squad of squadDirs) {
      if (squadFilter && squadFilter !== squad.name) continue;
      const resDir = resolve(squadsDir, squad.name, resourceType);
      if (!existsSync(resDir)) continue;
      scanResourceDir(resDir, squad.name, resourceType, resources);
    }
  }

  return resources;
}

function scanResourceDir(dir: string, squadId: string, resourceType: ResourceType, out: ResourceInfo[]) {
  // Minds are special: each subdirectory is a "mind"
  if (resourceType === 'minds') {
    scanMindDir(dir, squadId, out);
    return;
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    // For scripts, recurse into subdirectories
    if (entry.isDirectory() && resourceType === 'scripts') {
      const subDir = resolve(dir, entry.name);
      scanResourceDir(subDir, squadId, resourceType, out);
      continue;
    }

    if (!entry.isFile()) continue;

    const filePath = resolve(dir, entry.name);
    const ext = extname(entry.name).slice(1).toLowerCase(); // 'md', 'yaml', etc.
    const id = basename(entry.name, extname(entry.name));

    // Filter by expected extensions per type
    if (!isValidExtForType(ext, resourceType)) continue;

    const resource: ResourceInfo = {
      id,
      name: formatName(id),
      squadId,
      type: resourceType,
      file: entry.name,
      filePath,
      format: ext || 'unknown',
    };

    // Type-specific parsing
    if (resourceType === 'checklists') {
      const { total, checked, description } = parseChecklistHeader(filePath);
      resource.checkboxTotal = total;
      resource.checkboxChecked = checked;
      resource.description = description;
    } else if (resourceType === 'scripts') {
      resource.runtime = detectScriptRuntime(ext, filePath);
      resource.description = extractFirstComment(filePath, ext);
    } else if (resourceType === 'templates' && (ext === 'yaml' || ext === 'yml')) {
      resource.description = parseYamlDescription(filePath);
    } else {
      resource.description = extractMdDescription(filePath);
    }

    out.push(resource);
  }
}

function scanMindDir(dir: string, squadId: string, out: ResourceInfo[]) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const mindDir = resolve(dir, entry.name);
    // Count all files recursively inside this mind directory
    const subItems = countFilesRecursive(mindDir);

    out.push({
      id: entry.name,
      name: formatName(entry.name),
      squadId,
      type: 'minds',
      file: entry.name,
      filePath: mindDir,
      format: 'directory',
      subItems,
      description: `Mind with ${subItems} file${subItems !== 1 ? 's' : ''}`,
    });
  }
}

function loadResourceDetail(resourceType: ResourceType, squadId: string, id: string): Record<string, unknown> | null {
  // Build candidate paths
  const candidates: string[] = [];

  if (squadId === 'core') {
    const corePaths = CORE_RESOURCE_PATHS[resourceType] || [];
    for (const subPath of corePaths) {
      const dir = aiosCorePath(...subPath.split('/'));
      candidates.push(...getResourceCandidates(dir, id, resourceType));
    }
  } else {
    const dir = squadsPath(squadId, resourceType);
    candidates.push(...getResourceCandidates(dir, id, resourceType));
  }

  for (const p of candidates) {
    if (!existsSync(p)) continue;

    const stat = statSync(p);
    if (stat.isDirectory()) {
      // minds: return listing of files inside
      const files = listFilesRecursive(p);
      return { id, squadId, type: resourceType, name: formatName(id), format: 'directory', files, filePath: p };
    }

    const content = readFileSync(p, 'utf-8');
    const ext = extname(p).slice(1).toLowerCase();
    return {
      id,
      squadId,
      type: resourceType,
      name: formatName(id),
      format: ext,
      content,
      filePath: p,
    };
  }

  return null;
}

function getResourceCandidates(dir: string, id: string, resourceType: ResourceType): string[] {
  if (resourceType === 'minds') {
    return [resolve(dir, id)];
  }
  // Try common extensions
  const exts = getValidExtensions(resourceType);
  return exts.map(ext => resolve(dir, `${id}.${ext}`));
}

// ── Helpers ────────────────────────────────────────────────

function countMdFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter(f => f.endsWith('.md')).length;
  } catch { return 0; }
}

function countYamlFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
  } catch { return 0; }
}

function countAllFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter(f => !f.startsWith('.')).length;
  } catch { return 0; }
}

function countScriptFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  try {
    return countFilesRecursive(dir);
  } catch { return 0; }
}

function countSubDirs(dir: string): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).length;
  } catch { return 0; }
}

function countFilesRecursive(dir: string): number {
  let count = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      if (e.isFile()) count++;
      else if (e.isDirectory()) count += countFilesRecursive(resolve(dir, e.name));
    }
  } catch { /* skip */ }
  return count;
}

function listFilesRecursive(dir: string, prefix = ''): Array<{ path: string; name: string }> {
  const files: Array<{ path: string; name: string }> = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isFile()) files.push({ path: rel, name: e.name });
      else if (e.isDirectory()) files.push(...listFilesRecursive(resolve(dir, e.name), rel));
    }
  } catch { /* skip */ }
  return files;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatName(slug: string): string {
  return slug
    .replace(/\.(md|yaml|yml|json|cjs|js|py|ts|sh)$/i, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseAgentHeader(filePath: string): { role?: string; description?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 10);
    let role: string | undefined;
    let description: string | undefined;

    for (const line of lines) {
      if (line.startsWith('# ')) continue; // skip title
      if (!description && line.trim() && !line.startsWith('#')) {
        description = line.trim().slice(0, 200);
      }
      const roleMatch = line.match(/role:\s*(.+)/i) || line.match(/\*\*Role\*\*:\s*(.+)/i);
      if (roleMatch) role = roleMatch[1].trim();
    }

    return { role, description };
  } catch { return {}; }
}

// ── Resource parsing helpers ──────────────────────────────

const VALID_EXTENSIONS: Record<ResourceType, string[]> = {
  checklists: ['md'],
  templates: ['md', 'yaml', 'yml', 'json', 'css', 'html'],
  data: ['md', 'yaml', 'yml', 'json'],
  protocols: ['md'],
  config: ['md', 'yaml', 'yml', 'json'],
  docs: ['md'],
  scripts: ['js', 'cjs', 'mjs', 'ts', 'py', 'sh', 'bash'],
  rules: ['md'],
  minds: [], // minds are directories, not files
  skills: ['md', 'yaml', 'yml'],
};

function getValidExtensions(resourceType: ResourceType): string[] {
  return VALID_EXTENSIONS[resourceType] || ['md', 'yaml', 'yml', 'json'];
}

function isValidExtForType(ext: string, resourceType: ResourceType): boolean {
  const valid = VALID_EXTENSIONS[resourceType];
  if (!valid || valid.length === 0) return true; // minds: accept all
  return valid.includes(ext);
}

function parseChecklistHeader(filePath: string): { total: number; checked: number; description?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const unchecked = (content.match(/- \[ \]/g) || []).length;
    const checked = (content.match(/- \[x\]/gi) || []).length;

    // Extract description from first non-title, non-empty line
    const lines = content.split('\n').slice(0, 10);
    let description: string | undefined;
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      if (line.startsWith('>')) {
        description = line.replace(/^>\s*/, '').trim().slice(0, 200);
        break;
      }
      if (!description && line.trim() && !line.startsWith('-')) {
        description = line.trim().slice(0, 200);
        break;
      }
    }

    return { total: unchecked + checked, checked, description };
  } catch { return { total: 0, checked: 0 }; }
}

function detectScriptRuntime(ext: string, _filePath: string): string {
  switch (ext) {
    case 'js': case 'cjs': case 'mjs': case 'ts': return 'node';
    case 'py': return 'python';
    case 'sh': case 'bash': return 'bash';
    default: return 'unknown';
  }
}

function extractFirstComment(filePath: string, ext: string): string | undefined {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 15);

    for (const line of lines) {
      // JS/TS single-line comments
      if (['js', 'cjs', 'mjs', 'ts'].includes(ext)) {
        const m = line.match(/^\/\/\s*(.+)/);
        if (m) return m[1].trim().slice(0, 200);
        const m2 = line.match(/^\s*\*\s+(.+)/);
        if (m2 && !m2[1].startsWith('@')) return m2[1].trim().slice(0, 200);
      }
      // Python comments
      if (ext === 'py') {
        const m = line.match(/^#\s*(.+)/);
        if (m && !m[1].startsWith('!')) return m[1].trim().slice(0, 200);
      }
      // Bash comments
      if (['sh', 'bash'].includes(ext)) {
        const m = line.match(/^#\s*(.+)/);
        if (m && !m[1].startsWith('!')) return m[1].trim().slice(0, 200);
      }
    }
    return undefined;
  } catch { return undefined; }
}

function extractMdDescription(filePath: string): string | undefined {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 15);
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      if (line.startsWith('>')) return line.replace(/^>\s*/, '').trim().slice(0, 200);
      if (line.trim() && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('|')) {
        return line.trim().slice(0, 200);
      }
    }
    return undefined;
  } catch { return undefined; }
}

function parseYamlDescription(filePath: string): string | undefined {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parseYaml(raw) as Record<string, unknown>;
    if (parsed.description && typeof parsed.description === 'string') return parsed.description.slice(0, 200);
    if (parsed.name && typeof parsed.name === 'string') return parsed.name;
    return undefined;
  } catch { return undefined; }
}
