// ── Archetype: Greenfield Minimal ──
// 1 squad, 1 agent, 1 task — minimum viable AIOS project.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'greenfield-minimal',
  archetype: 'greenfield-minimal',
  description: 'Minimal viable AIOS project: 1 squad, 1 agent, 1 task.',
  aiosCore: {
    constitution: true,
    tasks: [
      {
        id: 'setup-project',
        name: 'Setup Project',
        description: 'Initial project setup and configuration',
      },
    ],
  },
  squads: [
    {
      id: 'engineering',
      name: 'engineering',
      displayName: 'Engineering Squad',
      description: 'Core engineering squad for development tasks',
      domain: 'development',
      icon: '⚙️',
      agents: [
        {
          id: 'dev-lead',
          name: 'Dev Lead',
          role: 'Lead Software Engineer',
          description: 'Leads development tasks and code reviews',
          tier: 'orchestrator',
          icon: '👨‍💻',
        },
      ],
      tasks: [
        {
          id: 'implement-feature',
          name: 'Implement Feature',
          description: 'Standard feature implementation task',
          agents: ['dev-lead'],
        },
      ],
    },
  ],
  expectations: {
    hasAiosCore: true,
    squadCount: 1,
    agentCount: 1,
    workflowCount: 0,
    taskCount: 2, // 1 core + 1 squad
    engineStarts: true,
  },
};
