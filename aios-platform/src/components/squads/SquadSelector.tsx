import { useMemo, useState } from 'react';
import { Badge } from '../ui';
import { useSquads } from '../../hooks/useSquads';
import { useUIStore } from '../../stores/uiStore';
import { cn, getSquadTheme } from '../../lib/utils';
import type { Squad, SquadType } from '../../types';

// Use centralized theme system
const getSquadColors = (squadType: SquadType) => {
  const theme = getSquadTheme(squadType);
  return {
    text: theme.text,
    bg: theme.bg,
    gradient: theme.gradient,
    dot: theme.dot,
  };
};

// Human-readable labels for each SquadType
const squadTypeLabels: Record<SquadType, string> = {
  copywriting: 'Marketing & Copy',
  design: 'Design & Criação',
  creator: 'Criação & Produção',
  orchestrator: 'Sistema & Orquestração',
  content: 'Conteúdo & Mídia',
  development: 'Desenvolvimento',
  engineering: 'Engenharia',
  analytics: 'Dados & Analytics',
  marketing: 'Outreach & Growth',
  advisory: 'Estratégia & Conselho',
  default: 'Outros',
};

// Sort order for categories (lower = higher in list)
const squadTypeSortOrder: Record<SquadType, number> = {
  orchestrator: 0,
  engineering: 1,
  development: 2,
  design: 3,
  content: 4,
  creator: 5,
  analytics: 6,
  copywriting: 7,
  marketing: 8,
  advisory: 9,
  default: 10,
};

// Chevron icon component
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Category icon based on SquadType — generic enough for any squad
function CategoryIcon({ squadType }: { squadType: SquadType }) {
  const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  switch (squadType) {
    case 'orchestrator':
      return <svg {...iconProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9H21a2 2 0 0 1 0 4h-.09" /></svg>;
    case 'engineering':
    case 'development':
      return <svg {...iconProps}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
    case 'design':
      return <svg {...iconProps}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" /></svg>;
    case 'content':
    case 'creator':
      return <svg {...iconProps}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>;
    case 'analytics':
      return <svg {...iconProps}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
    case 'copywriting':
    case 'marketing':
      return <svg {...iconProps}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>;
    case 'advisory':
      return <svg {...iconProps}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
    default:
      return <svg {...iconProps}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
  }
}

interface DynamicCategory {
  squadType: SquadType;
  label: string;
  squads: Squad[];
}

export function SquadSelector() {
  const { data: squads, isLoading } = useSquads();
  const { selectedSquadId, setSelectedSquadId } = useUIStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Build categories dynamically from squad types
  const dynamicCategories = useMemo((): DynamicCategory[] => {
    if (!squads?.length) return [];

    const groupMap = new Map<SquadType, Squad[]>();
    for (const squad of squads) {
      const type = squad.type || 'default';
      const list = groupMap.get(type) || [];
      list.push(squad);
      groupMap.set(type, list);
    }

    return Array.from(groupMap.entries())
      .map(([squadType, groupSquads]) => ({
        squadType,
        label: squadTypeLabels[squadType] || capitalizeFirst(squadType),
        squads: groupSquads.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      }))
      .sort((a, b) => {
        const orderA = squadTypeSortOrder[a.squadType] ?? 99;
        const orderB = squadTypeSortOrder[b.squadType] ?? 99;
        return orderA - orderB;
      });
  }, [squads]);

  if (isLoading) {
    return <SquadSelectorSkeleton />;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
          Squads
        </h3>
        <Badge variant="count">{squads?.length || 0}</Badge>
      </div>

      {/* All Squads button */}
      <button
        onClick={() => setSelectedSquadId(null)}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          'flex items-center gap-2',
          selectedSquadId === null
            ? 'glass-card-active text-white'
            : 'hover:bg-white/5 text-secondary hover:text-primary'
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span className="flex-1 text-left">Todos os Squads</span>
        <span className="text-xs opacity-60">{squads?.length || 0}</span>
      </button>

      {/* Dynamic category accordions */}
      <div className="space-y-1 mt-2">
        {dynamicCategories.map((group) => {
          if (group.squads.length === 0) return null;

          const isExpanded = expandedCategories.has(group.squadType);
          const hasSelectedSquad = group.squads.some((s) => s.id === selectedSquadId);
          const colors = getSquadColors(group.squadType);

          return (
            <div key={group.squadType} className="rounded-lg overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(group.squadType)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'flex items-center gap-2',
                  hasSelectedSquad
                    ? 'bg-white/10 text-primary'
                    : 'hover:bg-white/5 text-secondary hover:text-primary'
                )}
              >
                <span className="text-[var(--aiox-gray-muted)]">
                  <CategoryIcon squadType={group.squadType} />
                </span>
                <span className="flex-1 text-left">{group.label}</span>
                <span className="text-xs opacity-60 mr-1">{group.squads.length}</span>
                <ChevronIcon isOpen={isExpanded} />
              </button>

              {/* Category content */}
              {isExpanded && (
                <div className="overflow-hidden">
                  <div className="pl-4 pr-1 py-1 space-y-0.5">
                    {group.squads.map((squad) => (
                      <button
                        key={squad.id}
                        onClick={() => setSelectedSquadId(squad.id)}
                        className={cn(
                          'w-full px-3 py-1.5 rounded-md text-xs transition-all duration-200',
                          'flex items-center gap-2',
                          selectedSquadId === squad.id
                            ? 'bg-[var(--aiox-lime)]/10 text-[var(--aiox-lime)] shadow-sm'
                            : 'hover:bg-white/5 text-secondary hover:text-primary'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            selectedSquadId === squad.id ? 'bg-[var(--aiox-lime)]' : 'bg-[var(--aiox-gray-dim)]'
                          )}
                        />
                        <span className="flex-1 text-left truncate">
                          {squad.name}
                        </span>
                        <span className={cn(
                          'text-[10px]',
                          selectedSquadId === squad.id ? 'text-white/70' : 'opacity-50'
                        )}>
                          {squad.agentCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function SquadSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-16 rounded shimmer" />
      <div className="space-y-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 rounded-lg shimmer" />
        ))}
      </div>
    </div>
  );
}
