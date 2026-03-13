import type { SquadType } from '../types';

export interface DomainInfo {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

export const domainTaxonomy: Record<SquadType, DomainInfo> = {
  copywriting: {
    label: 'Copywriting',
    icon: 'PenTool',
    color: 'text-[var(--bb-flare)]',
    bgColor: 'bg-[var(--bb-flare)]/15',
    description: 'Redação publicitária e persuasiva',
  },
  design: {
    label: 'Design',
    icon: 'Palette',
    color: 'text-[var(--aiox-gray-muted)]',
    bgColor: 'bg-[var(--aiox-gray-muted)]/15',
    description: 'Design visual, UI/UX e assets criativos',
  },
  creator: {
    label: 'Creator',
    icon: 'Clapperboard',
    color: 'text-[var(--color-status-success)]',
    bgColor: 'bg-[var(--color-status-success)]/15',
    description: 'Criação de conteúdo e vendas',
  },
  orchestrator: {
    label: 'Orchestrator',
    icon: 'RefreshCw',
    color: 'text-[var(--aiox-blue)]',
    bgColor: 'bg-[var(--aiox-blue)]/15',
    description: 'Orquestração e gerenciamento de sistema',
  },
  content: {
    label: 'Content',
    icon: 'Tv',
    color: 'text-[var(--bb-error)]',
    bgColor: 'bg-[var(--bb-error)]/15',
    description: 'Conteúdo e ecossistema de mídia',
  },
  development: {
    label: 'Development',
    icon: 'Wrench',
    color: 'text-[var(--aiox-blue)]',
    bgColor: 'bg-[var(--aiox-blue)]/15',
    description: 'Desenvolvimento de software e ferramentas',
  },
  engineering: {
    label: 'Engineering',
    icon: 'Cog',
    color: 'text-[var(--aiox-blue)]',
    bgColor: 'bg-[var(--aiox-blue)]/15',
    description: 'Engenharia de software e infraestrutura',
  },
  analytics: {
    label: 'Analytics',
    icon: 'BarChart3',
    color: 'text-[var(--aiox-blue)]',
    bgColor: 'bg-[var(--aiox-blue)]/15',
    description: 'Dados, análise e pesquisa',
  },
  marketing: {
    label: 'Marketing',
    icon: 'Megaphone',
    color: 'text-[var(--bb-flare)]',
    bgColor: 'bg-[var(--bb-flare)]/15',
    description: 'Marketing, scraping e outreach',
  },
  advisory: {
    label: 'Advisory',
    icon: 'BookOpen',
    color: 'text-[var(--bb-warning)]',
    bgColor: 'bg-[var(--bb-warning)]/15',
    description: 'Consultoria e estratégia',
  },
  default: {
    label: 'Default',
    icon: 'Package',
    color: 'text-[var(--aiox-gray-dim)]',
    bgColor: 'bg-[var(--aiox-gray-dim)]/15',
    description: 'Squad padrão',
  },
};

export function getDomainInfo(squadType: SquadType): DomainInfo {
  return domainTaxonomy[squadType] || domainTaxonomy.default;
}

