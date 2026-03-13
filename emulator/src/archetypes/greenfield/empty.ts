// ── Archetype: Greenfield Empty ──
// Only constitution.md — absolute minimum AIOS project.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'greenfield-empty',
  archetype: 'greenfield-empty',
  description: 'Empty AIOS project with only constitution.md. Tests engine fallbacks and empty states.',
  aiosCore: {
    constitution: true,
  },
  squads: [],
  expectations: {
    hasAiosCore: true,
    squadCount: 0,
    agentCount: 0,
    workflowCount: 0,
    taskCount: 0,
    engineStarts: true,
  },
};
