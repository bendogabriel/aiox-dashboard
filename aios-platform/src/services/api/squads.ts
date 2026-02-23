import { apiClient } from './client';
import type { Squad, SquadDetail, SquadStats, EcosystemOverview, getSquadType } from '../../types';

export interface SquadsParams {
  domain?: string;
  [key: string]: string | number | undefined;
}

export const squadsApi = {
  // Get all squads
  // GET /api/squads
  getSquads: async (params?: SquadsParams): Promise<Squad[]> => {
    const response = await apiClient.get<{ squads: Squad[]; total: number }>('/squads', params);
    return response.squads || [];
  },

  // Get squad by ID with agents
  // GET /api/squads/:squadId
  getSquad: async (squadId: string): Promise<SquadDetail> => {
    const response = await apiClient.get<{ squad: SquadDetail }>(`/squads/${squadId}`);
    return response.squad;
  },

  // Get squad statistics
  // GET /api/squads/:squadId/stats
  getSquadStats: async (squadId: string): Promise<SquadStats> => {
    return apiClient.get<SquadStats>(`/squads/${squadId}/stats`);
  },

  // Get ecosystem overview (all squads summary)
  // GET /api/squads/ecosystem/overview
  getEcosystemOverview: async (): Promise<EcosystemOverview> => {
    return apiClient.get<EcosystemOverview>('/squads/ecosystem/overview');
  },
};

// Mock data for development
export const mockSquads: Squad[] = [
  {
    id: 'copywriting',
    name: 'Copywriting',
    description: 'Especialistas em criação de conteúdo, textos persuasivos e comunicação.',
    domain: 'content',
    icon: '✍️',
    agentCount: 17,
    type: 'copywriting',
  },
  {
    id: 'full-stack-dev',
    name: 'Full Stack Dev',
    description: 'Desenvolvimento de software, arquitetura e boas práticas.',
    domain: 'engineering',
    icon: '💻',
    agentCount: 11,
    type: 'creator',
  },
  {
    id: 'design-system',
    name: 'Design System',
    description: 'UI/UX, componentes e sistemas de design.',
    domain: 'design',
    icon: '🎨',
    agentCount: 9,
    type: 'design',
  },
  {
    id: 'youtube-content',
    name: 'YouTube Content',
    description: 'Produção de conteúdo para YouTube.',
    domain: 'video',
    icon: '🎬',
    agentCount: 8,
    type: 'creator',
  },
  {
    id: 'data-analytics',
    name: 'Data Analytics',
    description: 'Análise de dados, métricas e insights.',
    domain: 'analytics',
    icon: '📊',
    agentCount: 11,
    type: 'orchestrator',
  },
  {
    id: 'orquestrador-global',
    name: 'Orquestrador Global',
    description: 'Coordenação entre squads e workflows complexos.',
    domain: 'orchestration',
    icon: '🎯',
    agentCount: 4,
    type: 'orchestrator',
  },
];
