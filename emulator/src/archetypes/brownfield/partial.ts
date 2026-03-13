// ── Archetype: Brownfield Partial ──
// Partially adopted AIOS project — 1-2 squads alongside existing code.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'brownfield-partial',
  archetype: 'brownfield-partial',
  description: 'Partial AIOS adoption: existing project with 1 squad and 2 agents added.',
  aiosCore: {
    constitution: true,
  },
  squads: [
    {
      id: 'development',
      name: 'development',
      displayName: 'Development Squad',
      description: 'Initial development squad for AIOS adoption',
      domain: 'development',
      icon: '💻',
      agents: [
        { id: 'dev', name: 'Developer', role: 'Full Stack Developer', description: 'General development tasks', tier: 'orchestrator', icon: '👨‍💻' },
        { id: 'reviewer', name: 'Code Reviewer', role: 'Code Review Specialist', description: 'Reviews code for quality and consistency', tier: 2, icon: '🔍' },
      ],
    },
  ],
  extraFiles: {
    'package.json': JSON.stringify({
      name: 'existing-saas',
      version: '2.5.0',
      scripts: { dev: 'next dev', build: 'next build' },
      dependencies: { next: '^14.0.0', react: '^18.2.0' },
    }, null, 2),
    'src/app/page.tsx': `export default function Home() {\n  return <main>Existing SaaS App</main>;\n}\n`,
    'src/app/layout.tsx': `export default function Layout({ children }: { children: React.ReactNode }) {\n  return <html><body>{children}</body></html>;\n}\n`,
  },
  expectations: {
    hasAiosCore: true,
    squadCount: 1,
    agentCount: 2,
    workflowCount: 0,
    taskCount: 0,
    engineStarts: true,
  },
};
