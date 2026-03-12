// ── Archetype: Brownfield Legacy Node ──
// Existing Node.js project without any AIOS structure.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'brownfield-legacy-node',
  archetype: 'brownfield-legacy-node',
  description: 'Legacy Node.js project with no AIOS structure. Tests empty state and discovery fallbacks.',
  squads: [],
  extraFiles: {
    'package.json': JSON.stringify({
      name: 'legacy-api',
      version: '3.2.1',
      main: 'src/index.js',
      scripts: { start: 'node src/index.js', test: 'jest' },
      dependencies: { express: '^4.18.0', mongoose: '^7.0.0' },
    }, null, 2),
    'src/index.js': `const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.json({ status: 'ok' }));\napp.listen(3000);\n`,
    'src/routes/users.js': `module.exports = (router) => {\n  router.get('/users', (req, res) => res.json([]));\n};\n`,
    'README.md': '# Legacy API\n\nA legacy Node.js REST API.\n',
  },
  expectations: {
    hasAiosCore: false,
    squadCount: 0,
    agentCount: 0,
    workflowCount: 0,
    taskCount: 0,
    engineStarts: true,
  },
};
