import type { OutputType } from '../stores/brainstormStore';

export interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  suggestedOutputTypes: OutputType[];
  color: string;
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'blank',
    name: 'Em Branco',
    description: 'Sala livre, sem estrutura pre-definida',
    icon: 'plus',
    suggestedOutputTypes: [],
    color: 'var(--aiox-gray-muted, #999)',
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Planeje o proximo sprint com tarefas priorizadas',
    icon: 'calendar-check',
    suggestedOutputTypes: ['action-plan', 'story'],
    color: 'var(--aiox-lime)',
  },
  {
    id: 'retrospective',
    name: 'Retrospectiva',
    description: 'O que foi bem, o que melhorar, acoes',
    icon: 'rotate-ccw',
    suggestedOutputTypes: ['action-plan'],
    color: '#4ADE80',
  },
  {
    id: 'feature-discovery',
    name: 'Feature Discovery',
    description: 'Explore e valide novas features do produto',
    icon: 'search',
    suggestedOutputTypes: ['prd', 'requirements', 'story'],
    color: 'var(--aiox-blue)',
  },
  {
    id: 'brainstorm-to-prd',
    name: 'Brainstorm to PRD',
    description: 'Transforme ideias brutas em documento de requisitos',
    icon: 'file-text',
    suggestedOutputTypes: ['prd', 'requirements'],
    color: '#ED4609',
  },
  {
    id: 'technical-spike',
    name: 'Technical Spike',
    description: 'Investigacao tecnica e decisoes de arquitetura',
    icon: 'cpu',
    suggestedOutputTypes: ['action-plan', 'requirements'],
    color: '#f59e0b',
  },
  {
    id: 'epic-planning',
    name: 'Epic Planning',
    description: 'Desmembre um objetivo grande em stories e waves',
    icon: 'layers',
    suggestedOutputTypes: ['epic', 'story'],
    color: '#8B5CF6',
  },
];
