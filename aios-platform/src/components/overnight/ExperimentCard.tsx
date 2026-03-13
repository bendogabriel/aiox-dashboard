import { GitCommit, AlertTriangle, Check, X, ArrowDown, ArrowUp } from 'lucide-react';
import { CockpitCard, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { Experiment } from '../../types/overnight';

interface ExperimentCardProps {
  experiment: Experiment;
  onClick?: () => void;
}

const statusConfig = {
  keep: { label: 'Keep', color: 'text-[var(--color-status-success)]', bg: 'bg-[var(--color-status-success)]/10', icon: Check },
  discard: { label: 'Discard', color: 'text-[var(--bb-warning)]', bg: 'bg-[var(--bb-warning)]/10', icon: X },
  error: { label: 'Error', color: 'text-[var(--bb-error)]', bg: 'bg-[var(--bb-error)]/10', icon: AlertTriangle },
  skipped: { label: 'Skipped', color: 'text-white/40', bg: 'bg-white/5', icon: X },
};

export default function ExperimentCard({ experiment, onClick }: ExperimentCardProps) {
  const config = statusConfig[experiment.status];
  const StatusIcon = config.icon;

  const deltaFormatted = experiment.delta !== null
    ? `${experiment.delta > 0 ? '+' : ''}${experiment.delta.toFixed(1)}`
    : null;

  const deltaPctFormatted = experiment.deltaPct !== null
    ? `${experiment.deltaPct > 0 ? '+' : ''}${experiment.deltaPct.toFixed(1)}%`
    : null;

  const isImprovement = experiment.delta !== null && experiment.delta < 0;

  return (
    <div
    >
      <CockpitCard
        interactive={!!onClick}
        padding="sm"
        className={cn('cursor-pointer', onClick && 'hover:border-white/20')}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Iteration number */}
          <div className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold',
            config.bg, config.color
          )}>
            {experiment.iteration}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary truncate">
              {experiment.hypothesis ?? 'No hypothesis'}
            </p>

            <div className="flex items-center gap-3 mt-1.5">
              {/* Status badge */}
              <div className={cn('flex items-center gap-1 text-xs', config.color)}>
                <StatusIcon size={12} />
                <span>{config.label}</span>
              </div>

              {/* Delta */}
              {deltaFormatted && (
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-mono',
                  isImprovement ? 'text-[var(--color-status-success)]' : 'text-[var(--bb-error)]'
                )}>
                  {isImprovement ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                  <span>{deltaFormatted}</span>
                  {deltaPctFormatted && (
                    <span className="text-tertiary ml-0.5">({deltaPctFormatted})</span>
                  )}
                </div>
              )}

              {/* Commit */}
              {experiment.commitSha && (
                <div className="flex items-center gap-1 text-xs text-tertiary">
                  <GitCommit size={10} />
                  <span className="font-mono">{experiment.commitSha.slice(0, 7)}</span>
                </div>
              )}

              {/* Error message */}
              {experiment.errorMessage && (
                <span className="text-xs text-[var(--bb-error)] truncate max-w-[200px]">
                  {experiment.errorMessage}
                </span>
              )}
            </div>

            {/* Files modified */}
            {experiment.filesModified.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {experiment.filesModified.map((file) => (
                  <Badge key={file} variant="subtle" size="sm">
                    {file.split('/').pop()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Metric values */}
          <div className="flex-shrink-0 text-right">
            {experiment.metricAfter !== null && (
              <span className="text-sm font-mono text-primary">
                {experiment.metricAfter.toFixed(1)}
              </span>
            )}
            {experiment.metricBefore !== null && (
              <span className="block text-xs font-mono text-tertiary">
                from {experiment.metricBefore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </CockpitCard>
    </div>
  );
}
