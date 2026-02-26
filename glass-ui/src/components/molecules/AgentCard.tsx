import { memo } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { StatusDot, StatusType } from '../ui/StatusDot';

// Types
export type AgentTier = 0 | 1 | 2;
export type SquadType = 'copywriting' | 'design' | 'creator' | 'orchestrator' | 'default';

export interface Agent {
  id: string;
  name: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  squad?: string;
  tier?: AgentTier;
  commandCount?: number;
  status?: StatusType;
}

// Tier themes
const tierThemes: Record<AgentTier, { gradient: string; badge: string; label: string }> = {
  0: {
    gradient: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    label: 'Core',
  },
  1: {
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    label: 'Pro',
  },
  2: {
    gradient: 'from-gray-400 to-gray-600',
    badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    label: 'Basic',
  },
};

// Star icon
const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Avatar component (simplified inline)
function AgentAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={cn(
      'rounded-xl flex items-center justify-center font-semibold',
      'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
      sizes[size]
    )}>
      {initials}
    </div>
  );
}

export interface AgentCardProps {
  agent: Agent;
  selected?: boolean;
  compact?: boolean;
  showTier?: boolean;
  favorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
}

export const AgentCard = memo(function AgentCard({
  agent,
  selected,
  compact = false,
  showTier = true,
  favorite = false,
  onFavoriteToggle,
  onClick,
}: AgentCardProps) {
  const tier = agent.tier ?? 2;
  const theme = tierThemes[tier];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={cn(
          'group glass-subtle glass-border rounded-xl p-3 cursor-pointer transition-all duration-200',
          'hover:glass-shadow-hover',
          selected && 'ring-2 ring-blue-500/50 bg-blue-500/10'
        )}
      >
        <div className="flex items-center gap-3">
          {agent.icon ? (
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center text-lg',
              `bg-gradient-to-br ${theme.gradient}`
            )}>
              {agent.icon}
            </div>
          ) : (
            <AgentAvatar name={agent.name} size="md" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{agent.name}</h4>
              {showTier && (
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', theme.badge)}>
                  T{tier}
                </span>
              )}
              {agent.status && <StatusDot status={agent.status} size="sm" />}
            </div>
            <p className="text-muted-foreground text-xs truncate">{agent.title || agent.description}</p>
          </div>
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                favorite
                  ? 'text-yellow-500 opacity-100'
                  : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-500'
              )}
            >
              <StarIcon filled={favorite} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <GlassCard
        interactive
        className={cn(
          'transition-all duration-200',
          selected && 'ring-2 ring-blue-500/50 bg-blue-500/10'
        )}
      >
        <div className="flex items-start gap-4">
          {agent.icon ? (
            <div className={cn(
              'h-14 w-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
              `bg-gradient-to-br ${theme.gradient}`
            )}>
              {agent.icon}
            </div>
          ) : (
            <AgentAvatar name={agent.name} size="lg" />
          )}

          <div className="flex-1 min-w-0 space-y-2">
            <div className="relative">
              {onFavoriteToggle && (
                <button
                  onClick={handleFavoriteClick}
                  className={cn(
                    'absolute -top-1 -right-1 p-1.5 rounded-lg transition-all z-10',
                    favorite
                      ? 'text-yellow-500 opacity-100'
                      : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-500'
                  )}
                >
                  <StarIcon filled={favorite} />
                </button>
              )}
              <div className="flex items-center gap-2 flex-wrap pr-8">
                <h3 className="font-semibold">{agent.name}</h3>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', theme.badge)}>
                  {theme.label}
                </span>
                {agent.status && <StatusDot status={agent.status} size="sm" glow />}
              </div>
              <p className="text-muted-foreground text-sm">{agent.title}</p>
            </div>

            {agent.description && (
              <p className="text-muted-foreground text-sm line-clamp-2">{agent.description}</p>
            )}

            {agent.commandCount !== undefined && agent.commandCount > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500">
                  {agent.commandCount} commands
                </span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
});

export { tierThemes, AgentAvatar };
