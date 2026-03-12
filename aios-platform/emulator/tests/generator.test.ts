// ── Generator Unit Tests ──
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { generate } from '../src/generator';
import { validate } from '../src/validator';
import { getArchetype, listArchetypes } from '../src/archetypes/index';
import { join } from 'path';
import { rm, readdir, readFile, access } from 'fs/promises';

const TEST_OUTPUT = join(import.meta.dir, '..', 'output', '__test__');

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

afterAll(async () => {
  await rm(TEST_OUTPUT, { recursive: true, force: true });
});

describe('Archetype Registry', () => {
  test('has all expected archetypes', () => {
    const items = listArchetypes();
    expect(items.length).toBeGreaterThanOrEqual(12);

    const names = items.map(i => i.archetype);
    expect(names).toContain('greenfield-empty');
    expect(names).toContain('greenfield-minimal');
    expect(names).toContain('greenfield-standard');
    expect(names).toContain('greenfield-full');
    expect(names).toContain('brownfield-legacy-node');
    expect(names).toContain('brownfield-react-app');
    expect(names).toContain('brownfield-monorepo');
    expect(names).toContain('brownfield-partial');
    expect(names).toContain('edge-malformed');
    expect(names).toContain('edge-empty-dirs');
    expect(names).toContain('edge-huge');
    expect(names).toContain('edge-unicode');
  });

  test('each archetype has required fields', () => {
    const items = listArchetypes();
    for (const item of items) {
      const spec = getArchetype(item.name)!;
      expect(spec.name).toBeTruthy();
      expect(spec.archetype).toBeTruthy();
      expect(spec.description).toBeTruthy();
      expect(spec.expectations).toBeTruthy();
      expect(typeof spec.expectations.hasAiosCore).toBe('boolean');
      expect(typeof spec.expectations.engineStarts).toBe('boolean');
    }
  });
});

describe('Generator — greenfield-empty', () => {
  let projectPath: string;

  beforeAll(async () => {
    const spec = getArchetype('empty')!;
    const result = await generate(spec, TEST_OUTPUT);
    projectPath = result.projectPath;
  });

  test('creates .aios-core directory', async () => {
    expect(await exists(join(projectPath, '.aios-core'))).toBe(true);
  });

  test('creates constitution.md', async () => {
    expect(await exists(join(projectPath, '.aios-core', 'constitution.md'))).toBe(true);
  });

  test('creates core-config.yaml', async () => {
    expect(await exists(join(projectPath, '.aios-core', 'core-config.yaml'))).toBe(true);
  });

  test('has no squads directory', async () => {
    expect(await exists(join(projectPath, 'squads'))).toBe(false);
  });

  test('validates correctly', async () => {
    const result = await validate(projectPath);
    expect(result.hasAiosCore).toBe(true);
    expect(result.summary.squadCount).toBe(0);
    expect(result.summary.agentCount).toBe(0);
  });
});

describe('Generator — greenfield-minimal', () => {
  let projectPath: string;

  beforeAll(async () => {
    const spec = getArchetype('minimal')!;
    const result = await generate(spec, TEST_OUTPUT);
    projectPath = result.projectPath;
  });

  test('creates squad directory', async () => {
    expect(await exists(join(projectPath, 'squads', 'engineering'))).toBe(true);
  });

  test('creates squad.yaml', async () => {
    expect(await exists(join(projectPath, 'squads', 'engineering', 'squad.yaml'))).toBe(true);
    const content = await readFile(join(projectPath, 'squads', 'engineering', 'squad.yaml'), 'utf-8');
    expect(content).toContain('name: engineering');
    expect(content).toContain('dev-lead');
  });

  test('creates agent .md file', async () => {
    const agentPath = join(projectPath, 'squads', 'engineering', 'agents', 'dev-lead.md');
    expect(await exists(agentPath)).toBe(true);
    const content = await readFile(agentPath, 'utf-8');
    expect(content).toContain('# dev-lead');
    expect(content).toContain('Lead Software Engineer');
  });

  test('agent file has role in first 10 lines', async () => {
    const content = await readFile(
      join(projectPath, 'squads', 'engineering', 'agents', 'dev-lead.md'),
      'utf-8'
    );
    const first10 = content.split('\n').slice(0, 10).join('\n');
    // Engine scans first 10 lines for role
    expect(first10).toMatch(/Lead Software Engineer/i);
  });

  test('creates core task', async () => {
    expect(await exists(join(projectPath, '.aios-core', 'development', 'tasks', 'setup-project.md'))).toBe(true);
  });

  test('creates squad task', async () => {
    expect(await exists(join(projectPath, 'squads', 'engineering', 'tasks', 'implement-feature.md'))).toBe(true);
  });

  test('validates against expectations', async () => {
    const result = await validate(projectPath);
    expect(result.hasAiosCore).toBe(true);
    expect(result.summary.squadCount).toBe(1);
    expect(result.summary.agentCount).toBe(1);
  });
});

describe('Generator — greenfield-standard', () => {
  let projectPath: string;

  beforeAll(async () => {
    const spec = getArchetype('standard')!;
    const result = await generate(spec, TEST_OUTPUT);
    projectPath = result.projectPath;
  });

  test('creates 3 squad directories', async () => {
    const squadsDir = join(projectPath, 'squads');
    const entries = await readdir(squadsDir);
    expect(entries.filter(e => !e.startsWith('.')).length).toBe(3);
  });

  test('creates core agents', async () => {
    expect(await exists(join(projectPath, '.aios-core', 'development', 'agents', 'architect.md'))).toBe(true);
    expect(await exists(join(projectPath, '.aios-core', 'development', 'agents', 'pm.md'))).toBe(true);
  });

  test('creates workflow YAML', async () => {
    const wfPath = join(projectPath, '.aios-core', 'development', 'workflows', 'story-development-cycle.yaml');
    expect(await exists(wfPath)).toBe(true);
    const content = await readFile(wfPath, 'utf-8');
    expect(content).toContain('story-development-cycle');
    expect(content).toContain('phases');
  });

  test('creates squad workflow', async () => {
    const wfPath = join(projectPath, 'squads', 'engineering', 'workflows', 'feature-development.yaml');
    expect(await exists(wfPath)).toBe(true);
  });

  test('validates against expectations', async () => {
    const result = await validate(projectPath);
    expect(result.hasAiosCore).toBe(true);
    expect(result.summary.squadCount).toBe(3);
    // 2 core + 4 eng + 3 design + 2 analytics = 11
    expect(result.summary.agentCount).toBe(11);
  });
});

describe('Generator — brownfield-legacy-node', () => {
  let projectPath: string;

  beforeAll(async () => {
    const spec = getArchetype('legacy-node')!;
    const result = await generate(spec, TEST_OUTPUT);
    projectPath = result.projectPath;
  });

  test('has no .aios-core', async () => {
    expect(await exists(join(projectPath, '.aios-core'))).toBe(false);
  });

  test('has package.json with legacy deps', async () => {
    const pkg = JSON.parse(await readFile(join(projectPath, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('legacy-api');
    expect(pkg.dependencies.express).toBeTruthy();
  });

  test('has source files', async () => {
    expect(await exists(join(projectPath, 'src', 'index.js'))).toBe(true);
  });

  test('validates as no-AIOS project', async () => {
    const result = await validate(projectPath);
    expect(result.hasAiosCore).toBe(false);
    expect(result.summary.squadCount).toBe(0);
  });
});

describe('Generator — edge-huge', () => {
  let projectPath: string;

  beforeAll(async () => {
    const spec = getArchetype('huge')!;
    const result = await generate(spec, TEST_OUTPUT);
    projectPath = result.projectPath;
  });

  test('creates 50 squad directories', async () => {
    const squadsDir = join(projectPath, 'squads');
    const entries = await readdir(squadsDir);
    expect(entries.length).toBe(50);
  });

  test('creates 200 agent files', async () => {
    let totalAgents = 0;
    const squadsDir = join(projectPath, 'squads');
    const squads = await readdir(squadsDir);
    for (const squad of squads) {
      const agentsDir = join(squadsDir, squad, 'agents');
      if (await exists(agentsDir)) {
        const agents = await readdir(agentsDir);
        totalAgents += agents.filter(a => a.endsWith('.md')).length;
      }
    }
    expect(totalAgents).toBe(200);
  });
});

describe('Generator — edge-unicode', () => {
  let projectPath: string;

  beforeAll(async () => {
    const spec = getArchetype('unicode')!;
    const result = await generate(spec, TEST_OUTPUT);
    projectPath = result.projectPath;
  });

  test('creates squad with Portuguese name', async () => {
    expect(await exists(join(projectPath, 'squads', 'desenvolvimento'))).toBe(true);
  });

  test('agent file contains Portuguese content', async () => {
    const content = await readFile(
      join(projectPath, 'squads', 'desenvolvimento', 'agents', 'desenvolvedor-senior.md'),
      'utf-8'
    );
    expect(content).toContain('Engenheiro de Software Senior');
  });
});
