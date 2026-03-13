// ── Project Validator ──
// Validates a generated (or real) project structure against what the engine expects.

import { readdir, stat, access } from 'fs/promises';
import { join } from 'path';

export interface ValidationResult {
  valid: boolean;
  hasAiosCore: boolean;
  hasSquads: boolean;
  issues: ValidationIssue[];
  summary: {
    squadCount: number;
    agentCount: number;
    workflowCount: number;
    taskCount: number;
  };
}

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  path: string;
  message: string;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function countMdFiles(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir);
    return entries.filter(e => e.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

async function countYamlFiles(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir);
    return entries.filter(e => e.endsWith('.yaml') || e.endsWith('.yml')).length;
  } catch {
    return 0;
  }
}

export async function validate(projectPath: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  let squadCount = 0;
  let agentCount = 0;
  let workflowCount = 0;
  let taskCount = 0;

  // Check .aios-core/
  const aiosCoreDir = join(projectPath, '.aios-core');
  const hasAiosCore = await exists(aiosCoreDir);

  if (!hasAiosCore) {
    issues.push({ level: 'warning', path: '.aios-core/', message: 'No .aios-core directory found' });
  } else {
    // Check constitution
    if (!(await exists(join(aiosCoreDir, 'constitution.md')))) {
      issues.push({ level: 'info', path: '.aios-core/constitution.md', message: 'No constitution.md found' });
    }

    // Count core agents
    const coreAgentsDir = join(aiosCoreDir, 'development', 'agents');
    const coreAgentCount = await countMdFiles(coreAgentsDir);
    agentCount += coreAgentCount;

    // Count core workflows
    const coreWorkflowsDir = join(aiosCoreDir, 'development', 'workflows');
    workflowCount += await countYamlFiles(coreWorkflowsDir);

    // Count core tasks
    const coreTasksDir = join(aiosCoreDir, 'development', 'tasks');
    taskCount += await countMdFiles(coreTasksDir);
  }

  // Check squads/
  const squadsDir = join(projectPath, 'squads');
  const hasSquads = await exists(squadsDir);

  if (!hasSquads) {
    issues.push({ level: 'info', path: 'squads/', message: 'No squads directory found' });
  } else {
    const squadEntries = await readdir(squadsDir);
    for (const entry of squadEntries) {
      if (entry.startsWith('.')) continue;

      const squadPath = join(squadsDir, entry);
      const squadStat = await stat(squadPath);
      if (!squadStat.isDirectory()) continue;

      squadCount++;

      // Check for squad.yaml or config.yaml
      const hasSquadYaml = await exists(join(squadPath, 'squad.yaml'));
      const hasConfigYaml = await exists(join(squadPath, 'config.yaml'));

      if (!hasSquadYaml && !hasConfigYaml) {
        issues.push({
          level: 'warning',
          path: `squads/${entry}/`,
          message: 'No squad.yaml or config.yaml found',
        });
      }

      // Count agents
      const squadAgentCount = await countMdFiles(join(squadPath, 'agents'));
      agentCount += squadAgentCount;

      if (squadAgentCount === 0) {
        issues.push({
          level: 'info',
          path: `squads/${entry}/agents/`,
          message: 'No agent files found in squad',
        });
      }

      // Count tasks
      taskCount += await countMdFiles(join(squadPath, 'tasks'));

      // Count workflows
      workflowCount += await countYamlFiles(join(squadPath, 'workflows'));
    }
  }

  const valid = issues.filter(i => i.level === 'error').length === 0;

  return {
    valid,
    hasAiosCore,
    hasSquads,
    issues,
    summary: { squadCount, agentCount, workflowCount, taskCount },
  };
}
