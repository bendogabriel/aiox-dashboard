/**
 * CategoryNav — Horizontal category pills with count
 * Story 2.4
 */
import { memo } from 'react';
import { useCategoryCounts } from '../../../hooks/useMarketplace';
import { useMarketplaceStore } from '../../../stores/marketplaceStore';
import { getSquadTheme } from '../../../lib/theme';
import type { SquadType } from '../../../types';
import type { MarketplaceCategory } from '../../../types/marketplace';

type CategoryCounts = Record<string, number>;

const CATEGORY_ORDER: { key: MarketplaceCategory; label: string }[] = [
  { key: 'development', label: 'Development' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'design', label: 'Design' },
  { key: 'content', label: 'Content' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'copywriting', label: 'Copywriting' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'creator', label: 'Sales' },
  { key: 'advisory', label: 'Advisory' },
  { key: 'orchestrator', label: 'Orchestration' },
];

export const CategoryNav = memo(function CategoryNav() {
  const { filters, setCategory } = useMarketplaceStore();
  const { data: counts } = useCategoryCounts();

  const activeCategory = filters.category;

  const handleClick = (key: MarketplaceCategory | undefined) => {
    setCategory(key === activeCategory ? undefined : key);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* All */}
      <button
        type="button"
        onClick={() => handleClick(undefined)}
        className={`
          shrink-0 px-3 py-1.5 font-mono text-xs uppercase tracking-wider
          border transition-colors
          ${!activeCategory
            ? 'bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)] border-[var(--aiox-lime,#D1FF00)] font-semibold'
            : 'bg-transparent text-[var(--color-text-secondary,#999)] border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)]'
          }
        `}
      >
        Todos
      </button>

      {CATEGORY_ORDER.map(({ key, label }) => {
        const theme = getSquadTheme(key as SquadType);
        const count = (counts as CategoryCounts)?.[key] ?? 0;
        const isActive = activeCategory === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key)}
            className={`
              shrink-0 px-3 py-1.5 font-mono text-xs uppercase tracking-wider
              border transition-colors flex items-center gap-1.5
              ${isActive
                ? `${theme.bgSubtle} ${theme.text} ${theme.border} font-semibold`
                : `bg-transparent text-[var(--color-text-secondary,#999)] border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)]`
              }
            `}
          >
            <span>{label}</span>
            {count > 0 && (
              <span className={`
                text-[10px] font-mono
                ${isActive ? 'opacity-80' : 'text-[var(--color-text-muted,#666)]'}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
