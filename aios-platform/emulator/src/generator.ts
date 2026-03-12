// ── Project Generator ──
// Reads a ProjectSpec and writes a synthetic project to disk.

import { mkdir, writeFile, rm } from 'fs/promises';
import { join, dirname } from 'path';
import type { ProjectSpec, GenerateResult, AgentSpec, SquadSpec, TaskSpec, WorkflowSpec } from './types';

const OUTPUT_DIR = join(import.meta.dir, '..', 'output');

// ── Template Rendering ──

function render(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

async function loadTemplate(name: string): Promise<string> {
  const path = join(import.meta.dir, '..', 'templates', name);
  return Bun.file(path).text();
}

// ── File Writers ──

async function writeProjectFile(projectPath: string, relativePath: string, content: string): Promise<void> {
  const fullPath = join(projectPath, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

function generateConstitution(): string {
  return `# AIOS Constitution

## Article I — Purpose
This project is managed by AIOS, an AI-Orchestrated System for Full Stack Development.

## Article II — Agents
All agents operate under the authority of the AIOS framework and must follow established workflows.

## Article III — Quality
All code must pass quality gates before being considered complete.

## Article IV — No Invention
Every implementation must trace to documented requirements. No invented features.

## Article V — Governance
The @aios-master agent has final authority over framework governance decisions.
`;
}

function generateSquadYaml(squad: SquadSpec): string {
  const agentEntries = squad.agents
    .map(a => `  - id: ${a.id}\n    name: ${a.name}\n    role: "${a.role}"\n    file: agents/${a.id}.md\n    tier: ${a.tier}\n    description: "${a.description}"`)
    .join('\n');

  const taskEntries = (squad.tasks || [])
    .map(t => `  - id: ${t.id}\n    file: tasks/${t.id}.md\n    description: "${t.description}"`)
    .join('\n');

  const workflowEntries = (squad.workflows || [])
    .map(w => `  - id: ${w.id}\n    name: ${w.name}\n    file: workflows/${w.id}.yaml\n    trigger: manual\n    description: "${w.description}"`)
    .join('\n');

  return `metadata:
  name: ${squad.id}
  display_name: "${squad.displayName}"
  version: "${squad.version || '1.0.0'}"
  domain: ${squad.domain}
  status: active

description: |
  ${squad.description}

agents:
${agentEntries}
${taskEntries ? `\ntasks:\n${taskEntries}` : ''}
${workflowEntries ? `\nworkflows:\n${workflowEntries}` : ''}

tags:
  - emulated
  - ${squad.domain}
`;
}

function generateSquadConfig(squad: SquadSpec): string {
  const agentIds = squad.agents.map(a => `  - ${a.id}`).join('\n');
  return `name: ${squad.id}
version: ${squad.version || '1.0.0'}
title: ${squad.displayName}
description: ${squad.description}
icon: ${squad.icon || '🔧'}
type: specialist
entry_agent: ${squad.agents[0]?.id || squad.id}

agents:
${agentIds}

tags:
  - emulated
`;
}

function generateAgentMd(agent: AgentSpec, squadId: string): string {
  return `# ${agent.id}

> **${agent.name}** - ${agent.role}
> ${agent.description}

## Agent Definition

\`\`\`yaml
metadata:
  version: "1.0"
  tier: ${agent.tier}
  created: "${new Date().toISOString().split('T')[0]}"
  squad_source: "squads/${squadId}"

agent:
  name: ${agent.name}
  id: ${agent.id}
  title: ${agent.role}
  icon: ${agent.icon || '🤖'}
  tier: ${agent.tier}

persona:
  role: ${agent.role}
  style: Professional and focused
  identity: Expert ${agent.role.toLowerCase()}
  focus: Executing assigned tasks with precision
\`\`\`
`;
}

function generateTaskMd(task: TaskSpec): string {
  return `# ${task.name}

## Purpose
${task.description}

## Execution
${task.agents?.length ? `### Assigned Agents\n${task.agents.map(a => `- @${a}`).join('\n')}` : ''}

### Steps
1. Analyze requirements
2. Execute implementation
3. Validate results
4. Report completion

## Acceptance Criteria
- [ ] Task completed successfully
- [ ] Output validated
- [ ] No errors in execution
`;
}

function generateWorkflowYaml(workflow: WorkflowSpec): string {
  const phasesYaml = workflow.phases
    .map(p => `    - id: ${p.id}\n      name: "${p.name}"${p.tasks?.length ? `\n      tasks:\n${p.tasks.map(t => `        - ${t}`).join('\n')}` : ''}`)
    .join('\n');

  return `workflow:
  id: ${workflow.id}
  name: "${workflow.name}"
  description: "${workflow.description}"
  version: "1.0.0"

  phases:
${phasesYaml}
`;
}

function generateCoreConfig(): string {
  return `project:
  name: "Emulated AIOS Project"
  version: "1.0.0"
  framework: aios-core
  status: active

settings:
  debug: false
  logLevel: info
`;
}

// ── Main Generator ──

export async function generate(spec: ProjectSpec, outputDir?: string): Promise<GenerateResult> {
  const startTime = performance.now();
  const projectPath = join(outputDir || OUTPUT_DIR, spec.name);
  let filesCreated = 0;
  let dirsCreated = 0;

  // Clean previous output
  try {
    await rm(projectPath, { recursive: true, force: true });
  } catch {}

  await mkdir(projectPath, { recursive: true });
  dirsCreated++;

  // .aios-core/ structure
  if (spec.aiosCore) {
    await mkdir(join(projectPath, '.aios-core', 'development', 'agents'), { recursive: true });
    await mkdir(join(projectPath, '.aios-core', 'development', 'workflows'), { recursive: true });
    await mkdir(join(projectPath, '.aios-core', 'development', 'tasks'), { recursive: true });
    await mkdir(join(projectPath, '.aios-core', 'development', 'templates'), { recursive: true });
    dirsCreated += 4;

    // Constitution
    if (spec.aiosCore.constitution !== false) {
      await writeProjectFile(projectPath, '.aios-core/constitution.md', generateConstitution());
      filesCreated++;
    }

    // Core config
    await writeProjectFile(projectPath, '.aios-core/core-config.yaml', generateCoreConfig());
    filesCreated++;

    // Core agents
    if (spec.aiosCore.coreAgents) {
      for (const agent of spec.aiosCore.coreAgents) {
        await writeProjectFile(
          projectPath,
          `.aios-core/development/agents/${agent.id}.md`,
          generateAgentMd(agent, 'core')
        );
        filesCreated++;
      }
    }

    // Core workflows
    if (spec.aiosCore.workflows) {
      for (const workflow of spec.aiosCore.workflows) {
        await writeProjectFile(
          projectPath,
          `.aios-core/development/workflows/${workflow.id}.yaml`,
          generateWorkflowYaml(workflow)
        );
        filesCreated++;
      }
    }

    // Core tasks
    if (spec.aiosCore.tasks) {
      for (const task of spec.aiosCore.tasks) {
        await writeProjectFile(
          projectPath,
          `.aios-core/development/tasks/${task.id}.md`,
          generateTaskMd(task)
        );
        filesCreated++;
      }
    }
  }

  // Squads
  for (const squad of spec.squads) {
    const squadDir = `squads/${squad.id}`;

    await mkdir(join(projectPath, squadDir, 'agents'), { recursive: true });
    await mkdir(join(projectPath, squadDir, 'tasks'), { recursive: true });
    await mkdir(join(projectPath, squadDir, 'workflows'), { recursive: true });
    dirsCreated += 3;

    // squad.yaml
    await writeProjectFile(projectPath, `${squadDir}/squad.yaml`, generateSquadYaml(squad));
    filesCreated++;

    // config.yaml
    await writeProjectFile(projectPath, `${squadDir}/config.yaml`, generateSquadConfig(squad));
    filesCreated++;

    // Agents
    for (const agent of squad.agents) {
      await writeProjectFile(
        projectPath,
        `${squadDir}/agents/${agent.id}.md`,
        generateAgentMd(agent, squad.id)
      );
      filesCreated++;
    }

    // Tasks
    if (squad.tasks) {
      for (const task of squad.tasks) {
        await writeProjectFile(
          projectPath,
          `${squadDir}/tasks/${task.id}.md`,
          generateTaskMd(task)
        );
        filesCreated++;
      }
    }

    // Workflows
    if (squad.workflows) {
      for (const workflow of squad.workflows) {
        await writeProjectFile(
          projectPath,
          `${squadDir}/workflows/${workflow.id}.yaml`,
          generateWorkflowYaml(workflow)
        );
        filesCreated++;
      }
    }
  }

  // Extra files
  if (spec.extraFiles) {
    for (const [relativePath, content] of Object.entries(spec.extraFiles)) {
      await writeProjectFile(projectPath, relativePath, content);
      filesCreated++;
    }
  }

  const duration = performance.now() - startTime;

  return {
    projectPath,
    filesCreated,
    dirsCreated,
    archetype: spec.archetype,
    duration,
  };
}

export { OUTPUT_DIR };
