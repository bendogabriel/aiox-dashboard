// ── Archetype: Brownfield React App ──
// React application without AIOS — dashboard should suggest setup.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'brownfield-react-app',
  archetype: 'brownfield-react-app',
  description: 'React app without AIOS. Tests suggestion of AIOS setup.',
  squads: [],
  extraFiles: {
    'package.json': JSON.stringify({
      name: 'react-dashboard',
      version: '1.0.0',
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
      devDependencies: { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' },
    }, null, 2),
    'src/App.tsx': `export default function App() {\n  return <div>Hello World</div>;\n}\n`,
    'src/main.tsx': `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n`,
    'index.html': '<!DOCTYPE html>\n<html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
    'vite.config.ts': `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n`,
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
