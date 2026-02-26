import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { StatusDot, StatusType } from '../ui/StatusDot';

export type SquadType = 'operations' | 'product' | 'content' | 'data' | 'sales' | 'default';

export interface Squad {
  id: string;
  name: string;
  type?: SquadType;
  description?: string;
  capabilities?: string[];
  agentCount?: number;
  status?: StatusType;
}

const squadThemes: Record<SquadType, { gradient: string; indicator: string; border: string }> = {
  operations: {
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    indicator: 'bg-cyan-500',
    border: 'border-cyan-500/30',
  },
  product: {
    gradient: 'from-purple-500/20 to-purple-600/10',
    indicator: 'bg-purple-500',
    border: 'border-purple-500/30',
  },
  content: {
    gradient: 'from-orange-500/20 to-orange-600/10',
    indicator: 'bg-orange-500',
    border: 'border-orange-500/30',
  },
  data: {
    gradient: 'from-blue-500/20 to-blue-600/10',
    indicator: 'bg-blue-500',
    border: 'border-blue-500/30',
  },
  sales: {
    gradient: 'from-green-500/20 to-green-600/10',
    indicator: 'bg-green-500',
    border: 'border-green-500/30',
  },
  default: {
    gradient: 'from-gray-500/20 to-gray-600/10',
    indicator: 'bg-gray-500',
    border: 'border-gray-500/30',
  },
};

export interface SquadCardProps {
  squad: Squad;
  selected?: boolean;
  onClick?: () => void;
}

export function SquadCard({ squad, selected, onClick }: SquadCardProps) {
  const type = squad.type ?? 'default';
  const theme = squadThemes[type];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard
        interactive
        onClick={onClick}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'bg-gradient-to-br',
          theme.gradient,
          theme.border,
          selected && 'ring-2 ring-blue-500/50'
        )}
      >
        {/* Status indicator */}
        <div className={cn(
          'absolute top-3 right-3 h-2 w-2 rounded-full',
          theme.indicator,
          'animate-pulse'
        )} />

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{squad.name}</h3>
            {squad.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                {squad.description}
              </p>
            )}
          </div>

          {/* Capabilities */}
          {squad.capabilities && squad.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {squad.capabilities.slice(0, 4).map((cap) => (
                <span
                  key={cap}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md',
                    theme.gradient,
                    theme.border,
                    'border'
                  )}
                >
                  {cap}
                </span>
              ))}
              {squad.capabilities.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{squad.capabilities.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-muted-foreground text-xs">
              {squad.agentCount ?? 0} agents
            </span>
            {squad.status && (
              <StatusDot status={squad.status} label={squad.status === 'working' ? 'Active' : undefined} size="sm" />
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export { squadThemes };
