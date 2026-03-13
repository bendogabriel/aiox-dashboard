// ── Archetype: Edge Case — Empty Dirs ──
// Squad directories exist but have no agents inside.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'edge-empty-dirs',
  archetype: 'edge-empty-dirs',
  description: 'Squad directories with configs but no agent files. Tests empty squad handling.',
  aiosCore: {
    constitution: true,
  },
  squads: [
    {
      id: 'ghost-squad-1',
      name: 'ghost-squad-1',
      displayName: 'Ghost Squad 1',
      description: 'Squad with config but zero agents',
      domain: 'ghost',
      agents: [],
    },
    {
      id: 'ghost-squad-2',
      name: 'ghost-squad-2',
      displayName: 'Ghost Squad 2',
      description: 'Another empty squad',
      domain: 'ghost',
      agents: [],
    },
    {
      id: 'ghost-squad-3',
      name: 'ghost-squad-3',
      displayName: 'Ghost Squad 3',
      description: 'Third empty squad for good measure',
      domain: 'ghost',
      agents: [],
    },
  ],
  expectations: {
    hasAiosCore: true,
    squadCount: 3,
    agentCount: 0,
    workflowCount: 0,
    taskCount: 0,
    engineStarts: true,
  },
};
