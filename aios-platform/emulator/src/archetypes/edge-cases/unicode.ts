// ── Archetype: Edge Case — Unicode ──
// Unicode characters in names, descriptions, and content.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'edge-unicode',
  archetype: 'edge-unicode',
  description: 'Unicode names, accents, emoji in agent/squad names and content.',
  aiosCore: {
    constitution: true,
  },
  squads: [
    {
      id: 'desenvolvimento',
      name: 'desenvolvimento',
      displayName: 'Desenvolvimento Squad',
      description: 'Squad de desenvolvimento com nomes em portugues e acentuacao',
      domain: 'desenvolvimento',
      icon: '🇧🇷',
      agents: [
        {
          id: 'desenvolvedor-senior',
          name: 'Desenvolvedor Senior',
          role: 'Engenheiro de Software Senior',
          description: 'Responsavel por arquitetura e implementacao de features complexas',
          tier: 'orchestrator',
          icon: '👨‍💻',
        },
        {
          id: 'analista-qualidade',
          name: 'Analista de Qualidade',
          role: 'Analista de Qualidade de Software',
          description: 'Garantia de qualidade e testes automatizados',
          tier: 2,
          icon: '🧪',
        },
      ],
    },
    {
      id: 'kreativ-team',
      name: 'kreativ-team',
      displayName: 'Kreativ Team',
      description: 'Kreatives Team mit deutschen Umlauten und Sonderzeichen',
      domain: 'kreativ',
      icon: '🇩🇪',
      agents: [
        {
          id: 'designer-chef',
          name: 'Designer Chef',
          role: 'Leitender Designer',
          description: 'Verantwortlich fuer das gesamte Design-System',
          tier: 'orchestrator',
          icon: '🎨',
        },
        {
          id: 'frontend-entwickler',
          name: 'Frontend Entwickler',
          role: 'Frontend-Entwickler',
          description: 'Spezialist fuer React und TypeScript Entwicklung',
          tier: 2,
          icon: '💻',
        },
      ],
    },
  ],
  expectations: {
    hasAiosCore: true,
    squadCount: 2,
    agentCount: 4,
    workflowCount: 0,
    taskCount: 0,
    engineStarts: true,
  },
};
