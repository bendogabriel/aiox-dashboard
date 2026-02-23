import { apiClient } from './client';
import type { Agent, AgentSummary, AgentCommand, SearchFilters, getSquadType } from '../../types';

export interface AgentsParams {
  squad?: string;
  tier?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

export const agentsApi = {
  // Get all agents
  // GET /api/agents
  getAgents: async (params?: AgentsParams): Promise<AgentSummary[]> => {
    const response = await apiClient.get<{ agents: AgentSummary[]; total: number }>('/agents', params);
    return response.agents || [];
  },

  // Search agents
  // GET /api/agents/search?q=query
  searchAgents: async (filters: SearchFilters): Promise<AgentSummary[]> => {
    const params: Record<string, string | number | undefined> = {
      q: filters.query,
      limit: filters.limit,
    };
    const response = await apiClient.get<{ results: AgentSummary[]; query: string; total: number }>(
      '/agents/search',
      params
    );
    return response.results || [];
  },

  // Get agents by squad
  // GET /api/agents/squad/:squadId
  getAgentsBySquad: async (squadId: string): Promise<AgentSummary[]> => {
    const response = await apiClient.get<{ squad: string; agents: AgentSummary[]; total: number }>(
      `/agents/squad/${squadId}`
    );
    return response.agents || [];
  },

  // Get agent by ID (requires squadId)
  // GET /api/agents/:squadId/:agentId
  getAgent: async (squadId: string, agentId: string): Promise<Agent> => {
    const response = await apiClient.get<{ agent: Agent }>(`/agents/${squadId}/${agentId}`);
    return response.agent;
  },

  // Get agent commands
  // GET /api/agents/:squadId/:agentId/commands
  getAgentCommands: async (squadId: string, agentId: string): Promise<AgentCommand[]> => {
    const response = await apiClient.get<{ agentId: string; commands: AgentCommand[] }>(
      `/agents/${squadId}/${agentId}/commands`
    );
    return response.commands || [];
  },
};

// Mock data for development (matching backend agent format)
// Named export for convenience
export const searchAgents = agentsApi.searchAgents;

export const mockAgents: AgentSummary[] = [
  // Full Stack Dev Squad
  {
    id: 'dev-chief',
    name: 'Dev Chief',
    title: 'Architecture Lead',
    icon: '👨‍💼',
    tier: 0,
    squad: 'full-stack-dev',
    description: 'Coordena decisões arquiteturais e roteia para especialistas.',
    whenToUse: 'Quando precisar de revisão arquitetural ou não souber qual especialista usar.',
  },
  {
    id: 'uncle-bob',
    name: 'Uncle Bob',
    title: 'Clean Code Master',
    icon: '🧹',
    tier: 1,
    squad: 'full-stack-dev',
    description: 'Especialista em Clean Code, SOLID e Clean Architecture.',
    whenToUse: 'Para refatoração, code review e aplicação de princípios SOLID.',
  },
  {
    id: 'eric-evans',
    name: 'Eric Evans',
    title: 'DDD Expert',
    icon: '🏛️',
    tier: 1,
    squad: 'full-stack-dev',
    description: 'Domain-Driven Design, bounded contexts e modelagem de domínio.',
    whenToUse: 'Para modelagem de domínio e design estratégico.',
  },
  {
    id: 'kent-beck',
    name: 'Kent Beck',
    title: 'TDD Pioneer',
    icon: '🧪',
    tier: 1,
    squad: 'full-stack-dev',
    description: 'Test-Driven Development e Extreme Programming.',
    whenToUse: 'Para estratégias de teste e práticas XP.',
  },

  // Copywriting Squad
  {
    id: 'jon-benson',
    name: 'Jon Benson',
    title: 'VSL Master',
    icon: '📹',
    tier: 1,
    squad: 'copywriting',
    description: 'Criador do formato VSL. Especialista em vídeos de vendas.',
    whenToUse: 'Para criar VSLs e emails de alta conversão.',
  },
  {
    id: 'stefan-georgi',
    name: 'Stefan Georgi',
    title: 'RMBC Expert',
    icon: '📝',
    tier: 1,
    squad: 'copywriting',
    description: 'Método RMBC para copy de alta performance.',
    whenToUse: 'Para estruturar copy usando Research-Mechanism-Brief-Copy.',
  },
  {
    id: 'david-ogilvy',
    name: 'David Ogilvy',
    title: 'Big Idea Finder',
    icon: '💡',
    tier: 1,
    squad: 'copywriting',
    description: 'O pai da publicidade moderna. Foco em Big Ideas.',
    whenToUse: 'Para descobrir a Big Idea de uma campanha.',
  },
  {
    id: 'gary-halbert',
    name: 'Gary Halbert',
    title: 'Direct Mail Legend',
    icon: '✉️',
    tier: 1,
    squad: 'copywriting',
    description: 'Mestre do direct mail. Boron Letters.',
    whenToUse: 'Para copy direto, persuasivo e pessoal.',
  },

  // Design System Squad
  {
    id: 'design-lead',
    name: 'Design Lead',
    title: 'System Architect',
    icon: '🎨',
    tier: 0,
    squad: 'design-system',
    description: 'Coordena o sistema de design e padrões visuais.',
    whenToUse: 'Para decisões de design system e componentes.',
  },

  // YouTube Content Squad
  {
    id: 'youtube-strategist',
    name: 'YouTube Strategist',
    title: 'Content Planner',
    icon: '📺',
    tier: 0,
    squad: 'content-ecosystem',
    description: 'Estratégia de conteúdo para YouTube.',
    whenToUse: 'Para planejar séries, formatos e calendário.',
  },

  // Orchestrator Squad
  {
    id: 'maestro',
    name: 'Maestro',
    title: 'Global Orchestrator',
    icon: '🎯',
    tier: 0,
    squad: 'orquestrador-global',
    description: 'Coordena workflows entre múltiplos squads.',
    whenToUse: 'Para tarefas complexas que envolvem múltiplos squads.',
  },

  // Data Analytics Squad
  {
    id: 'data-chief',
    name: 'Data Chief',
    title: 'Analytics Lead',
    icon: '📊',
    tier: 0,
    squad: 'data-analytics',
    description: 'Coordena análises de dados e métricas.',
    whenToUse: 'Para decisões baseadas em dados e análises complexas.',
  },
  {
    id: 'metrics-specialist',
    name: 'Metrics Specialist',
    title: 'KPI Expert',
    icon: '📈',
    tier: 2,
    squad: 'data-analytics',
    description: 'Especialista em definição e tracking de KPIs.',
    whenToUse: 'Para criar dashboards e definir métricas de sucesso.',
  },

  // More Copywriting agents
  {
    id: 'copy-chief',
    name: 'Copy Chief',
    title: 'Content Orchestrator',
    icon: '✍️',
    tier: 0,
    squad: 'copywriting',
    description: 'Coordena estratégia de conteúdo e delega para especialistas.',
    whenToUse: 'Quando não souber qual copywriter usar ou para projetos complexos.',
  },
  {
    id: 'headline-hunter',
    name: 'Headline Hunter',
    title: 'Headline Specialist',
    icon: '🎯',
    tier: 2,
    squad: 'copywriting',
    description: 'Especialista em headlines que capturam atenção.',
    whenToUse: 'Para criar títulos, subject lines e hooks.',
  },

  // More Design System agents
  {
    id: 'color-master',
    name: 'Color Master',
    title: 'Color Theory Expert',
    icon: '🌈',
    tier: 2,
    squad: 'design-system',
    description: 'Especialista em paletas de cores e teoria das cores.',
    whenToUse: 'Para definir paletas e garantir acessibilidade visual.',
  },
  {
    id: 'component-architect',
    name: 'Component Architect',
    title: 'UI Component Expert',
    icon: '🧩',
    tier: 1,
    squad: 'design-system',
    description: 'Arquiteto de componentes reutilizáveis.',
    whenToUse: 'Para criar componentes escaláveis e consistentes.',
  },

  // More YouTube Content agents
  {
    id: 'thumbnail-pro',
    name: 'Thumbnail Pro',
    title: 'Visual Hook Expert',
    icon: '🖼️',
    tier: 2,
    squad: 'content-ecosystem',
    description: 'Especialista em thumbnails que geram cliques.',
    whenToUse: 'Para criar thumbnails de alta conversão.',
  },
  {
    id: 'script-writer',
    name: 'Script Writer',
    title: 'Video Script Expert',
    icon: '📝',
    tier: 1,
    squad: 'content-ecosystem',
    description: 'Escritor de roteiros para vídeos engajantes.',
    whenToUse: 'Para criar roteiros estruturados e cativantes.',
  },
];
