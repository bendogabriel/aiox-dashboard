// ── Archetype: Brownfield Monorepo ──
// Multi-package monorepo without AIOS.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'brownfield-monorepo',
  archetype: 'brownfield-monorepo',
  description: 'Complex monorepo with multiple packages, no AIOS structure.',
  squads: [],
  extraFiles: {
    'package.json': JSON.stringify({
      name: 'acme-monorepo',
      private: true,
      workspaces: ['packages/*', 'apps/*'],
      scripts: { build: 'turbo build', test: 'turbo test' },
      devDependencies: { turbo: '^2.0.0' },
    }, null, 2),
    'turbo.json': JSON.stringify({
      $schema: 'https://turbo.build/schema.json',
      pipeline: { build: { dependsOn: ['^build'] }, test: {} },
    }, null, 2),
    'packages/ui/package.json': JSON.stringify({ name: '@acme/ui', version: '1.0.0' }, null, 2),
    'packages/ui/src/Button.tsx': `export function Button({ children }: { children: React.ReactNode }) {\n  return <button>{children}</button>;\n}\n`,
    'packages/utils/package.json': JSON.stringify({ name: '@acme/utils', version: '1.0.0' }, null, 2),
    'packages/utils/src/format.ts': `export function formatDate(d: Date): string {\n  return d.toISOString().split('T')[0];\n}\n`,
    'apps/web/package.json': JSON.stringify({ name: '@acme/web', version: '1.0.0', dependencies: { '@acme/ui': '*', '@acme/utils': '*' } }, null, 2),
    'apps/web/src/index.tsx': `import { Button } from '@acme/ui';\nexport default function Home() { return <Button>Click</Button>; }\n`,
    'apps/api/package.json': JSON.stringify({ name: '@acme/api', version: '1.0.0' }, null, 2),
    'apps/api/src/server.ts': `Bun.serve({ port: 3001, fetch: () => new Response('ok') });\n`,
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
