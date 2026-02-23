import { motion } from 'framer-motion';
import { GlassCard, Badge } from '../ui';
import { cn, squadLabels } from '../../lib/utils';
import type { Squad } from '../../types';

interface SquadCardProps {
  squad: Squad;
  selected?: boolean;
  onClick?: () => void;
}

export function SquadCard({ squad, selected, onClick }: SquadCardProps) {
  const squadColorClasses = {
    copywriting: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    design: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    creator: 'from-green-500/20 to-green-600/10 border-green-500/30',
    orchestrator: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    default: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
  };

  const indicatorColors = {
    copywriting: 'bg-orange-500',
    design: 'bg-purple-500',
    creator: 'bg-green-500',
    orchestrator: 'bg-cyan-500',
    default: 'bg-gray-500',
  };

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
          squadColorClasses[squad.type || 'default'],
          selected && 'ring-2 ring-blue-500/50'
        )}
      >
        {/* Status indicator */}
        <div
          className={cn(
            'absolute top-3 right-3 h-2 w-2 rounded-full',
            indicatorColors[squad.type || 'default'],
            'animate-pulse-soft'
          )}
        />

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="text-primary font-semibold text-lg">
              {squad.name || squadLabels[squad.type || 'default']}
            </h3>
            <p className="text-secondary text-sm line-clamp-2 mt-1">
              {squad.description}
            </p>
          </div>

          {/* Capabilities */}
          {squad.capabilities && squad.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {squad.capabilities.slice(0, 4).map((cap) => (
                <Badge key={cap} variant="squad" squadType={squad.type || 'default'} size="sm">
                  {cap}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-secondary text-xs">
              {squad.agentCount} agents
            </span>
            <Badge variant="status" status="online" size="sm">
              Ativo
            </Badge>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
