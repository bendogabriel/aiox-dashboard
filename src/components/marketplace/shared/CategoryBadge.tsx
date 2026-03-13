import { getSquadType, type SquadType } from '../../../types';
import { getSquadTheme } from '../../../lib/theme';

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

const categoryLabels: Partial<Record<SquadType, string>> = {
  development: 'Development',
  engineering: 'Engineering',
  design: 'Design',
  content: 'Content',
  marketing: 'Marketing',
  copywriting: 'Copywriting',
  analytics: 'Analytics',
  creator: 'Sales',
  advisory: 'Advisory',
  orchestrator: 'Orchestration',
  default: 'Outros',
};

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const squadType = getSquadType(category);
  const theme = getSquadTheme(squadType);
  const label = categoryLabels[squadType] || category;

  return (
    <span
      className={`
        inline-flex items-center font-mono uppercase tracking-wider
        ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}
        ${theme.badge}
      `}
    >
      {label}
    </span>
  );
}
