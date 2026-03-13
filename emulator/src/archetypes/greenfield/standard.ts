// ── Archetype: Greenfield Standard ──
// 3 squads, ~11 agents, workflows — typical AIOS project.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'greenfield-standard',
  archetype: 'greenfield-standard',
  description: '3 squads (engineering, design, analytics) with ~11 agents and workflows.',
  aiosCore: {
    constitution: true,
    coreAgents: [
      { id: 'architect', name: 'Architect', role: 'System Architect', description: 'Designs system architecture and makes technology decisions', tier: 1, icon: '🏗️' },
      { id: 'pm', name: 'Product Manager', role: 'Product Manager', description: 'Manages product requirements and roadmap', tier: 1, icon: '📋' },
    ],
    workflows: [
      {
        id: 'story-development-cycle',
        name: 'Story Development Cycle',
        description: 'Full 4-phase workflow for all development work',
        phases: [
          { id: 'create', name: 'Create Story', tasks: ['create-story'] },
          { id: 'validate', name: 'Validate Story', tasks: ['validate-story'] },
          { id: 'implement', name: 'Implement', tasks: ['develop-story'] },
          { id: 'qa-gate', name: 'QA Gate', tasks: ['qa-review'] },
        ],
      },
    ],
    tasks: [
      { id: 'create-story', name: 'Create Story', description: 'Create a new development story from epic' },
      { id: 'validate-story', name: 'Validate Story', description: 'Validate story against 10-point checklist' },
      { id: 'develop-story', name: 'Develop Story', description: 'Implement the story tasks' },
      { id: 'qa-review', name: 'QA Review', description: 'Quality assurance review gate' },
    ],
  },
  squads: [
    {
      id: 'engineering',
      name: 'engineering',
      displayName: 'Engineering Squad',
      description: 'Full-stack development squad handling core implementation',
      domain: 'development',
      icon: '⚙️',
      agents: [
        { id: 'dev-lead', name: 'Dev Lead', role: 'Lead Software Engineer', description: 'Leads development and code architecture', tier: 'orchestrator', icon: '👨‍💻' },
        { id: 'frontend-dev', name: 'Frontend Dev', role: 'Frontend Developer', description: 'React/TypeScript frontend specialist', tier: 2, icon: '🎨' },
        { id: 'backend-dev', name: 'Backend Dev', role: 'Backend Developer', description: 'API and server-side development', tier: 2, icon: '🔧' },
        { id: 'qa-engineer', name: 'QA Engineer', role: 'Quality Assurance Engineer', description: 'Testing and quality validation', tier: 2, icon: '🧪' },
      ],
      tasks: [
        { id: 'code-review', name: 'Code Review', description: 'Review code changes', agents: ['dev-lead'] },
        { id: 'unit-testing', name: 'Unit Testing', description: 'Write and run unit tests', agents: ['qa-engineer'] },
      ],
      workflows: [
        {
          id: 'feature-development',
          name: 'Feature Development',
          description: 'Standard feature development workflow',
          phases: [
            { id: 'plan', name: 'Planning' },
            { id: 'implement', name: 'Implementation' },
            { id: 'review', name: 'Review' },
            { id: 'deploy', name: 'Deploy' },
          ],
        },
      ],
    },
    {
      id: 'design',
      name: 'design',
      displayName: 'Design System Squad',
      description: 'Design system management and UI/UX patterns',
      domain: 'design-system',
      icon: '🎨',
      agents: [
        { id: 'design-chief', name: 'Design Chief', role: 'Design System Architect', description: 'Manages design tokens and component library', tier: 'orchestrator', icon: '🎨' },
        { id: 'ui-specialist', name: 'UI Specialist', role: 'UI Component Developer', description: 'Creates and maintains UI components', tier: 2, icon: '🖌️' },
        { id: 'ux-researcher', name: 'UX Researcher', role: 'UX Research Analyst', description: 'User experience research and validation', tier: 2, icon: '🔍' },
      ],
      tasks: [
        { id: 'component-audit', name: 'Component Audit', description: 'Audit existing UI components', agents: ['design-chief'] },
      ],
    },
    {
      id: 'analytics',
      name: 'analytics',
      displayName: 'Analytics Squad',
      description: 'Data analysis and metrics tracking',
      domain: 'analytics',
      icon: '📊',
      agents: [
        { id: 'data-lead', name: 'Data Lead', role: 'Data Analytics Lead', description: 'Leads data analysis and reporting', tier: 'orchestrator', icon: '📊' },
        { id: 'metrics-analyst', name: 'Metrics Analyst', role: 'Metrics Analyst', description: 'Tracks and analyzes project metrics', tier: 2, icon: '📈' },
      ],
      tasks: [
        { id: 'metrics-report', name: 'Metrics Report', description: 'Generate metrics report', agents: ['data-lead', 'metrics-analyst'] },
      ],
    },
  ],
  expectations: {
    hasAiosCore: true,
    squadCount: 3,
    agentCount: 11, // 2 core + 4 eng + 3 design + 2 analytics
    workflowCount: 2, // 1 core + 1 eng
    taskCount: 8, // 4 core + 2 eng + 1 design + 1 analytics
    engineStarts: true,
  },
};
