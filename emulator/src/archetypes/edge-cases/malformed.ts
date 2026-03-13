// ── Archetype: Edge Case — Malformed ──
// Broken YAML, invalid references — engine must NOT crash.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'edge-malformed',
  archetype: 'edge-malformed',
  description: 'Malformed YAML and invalid references. Engine must not crash.',
  aiosCore: {
    constitution: true,
  },
  squads: [
    {
      id: 'valid-squad',
      name: 'valid-squad',
      displayName: 'Valid Squad',
      description: 'One valid squad to ensure partial discovery works',
      domain: 'development',
      agents: [
        { id: 'valid-agent', name: 'Valid Agent', role: 'Developer', description: 'A valid agent', tier: 2 },
      ],
    },
    {
      id: 'broken-squad',
      name: 'broken-squad',
      displayName: 'Broken Squad',
      description: 'Squad with broken config',
      domain: 'broken',
      agents: [],
    },
  ],
  extraFiles: {
    // Broken squad.yaml — invalid YAML syntax
    'squads/broken-squad/squad.yaml': `metadata:\n  name: broken-squad\n  display_name: "Broken Squad\n  version: not-closed-quote\nagents:\n  - id: ghost-agent\n    name: [invalid yaml\n    role: "broken\n`,
    // Agent file with no header structure
    'squads/broken-squad/agents/no-header.md': `This agent file has no proper header.\nJust plain text without any role or name structure.\n`,
    // Agent file that's completely empty
    'squads/broken-squad/agents/empty-agent.md': '',
    // Broken workflow YAML
    '.aios-core/development/workflows/broken-workflow.yaml': `workflow:\n  id: broken\n  phases:\n    - id: [invalid\n      name: "unclosed\n`,
  },
  expectations: {
    hasAiosCore: true,
    squadCount: 2,
    agentCount: 1, // Only valid-agent should be reliably discovered
    workflowCount: 0, // Broken workflow shouldn't count
    taskCount: 0,
    engineStarts: true,
    expectedWarnings: ['yaml', 'parse', 'malformed'],
  },
};
