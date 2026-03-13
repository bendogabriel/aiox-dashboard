import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  GitBranch,
  Repeat,
  Timer,
  Coins,
} from 'lucide-react';
import { CockpitCard, Badge, ProgressBar, StatusDot } from '../ui';
import { cn } from '../../lib/utils';
import type { OvernightProgram } from '../../types/overnight';

interface ProgramListProps {
  programs: OvernightProgram[];
  searchQuery: string;
  onSelectProgram: (id: string) => void;
}

const statusConfig: Record<string, {
  label: string;
  dotStatus: 'idle' | 'working' | 'waiting' | 'error' | 'success' | 'offline';
  icon: typeof Play;
  color: string;
}> = {
  idle: { label: 'Idle', dotStatus: 'idle', icon: Clock, color: 'text-white/40' },
  running: { label: 'Running', dotStatus: 'working', icon: Play, color: 'text-[var(--aiox-blue)]' },
  paused: { label: 'Paused', dotStatus: 'waiting', icon: Pause, color: 'text-[var(--bb-warning)]' },
  completed: { label: 'Completed', dotStatus: 'success', icon: CheckCircle2, color: 'text-[var(--color-status-success)]' },
  failed: { label: 'Failed', dotStatus: 'error', icon: AlertTriangle, color: 'text-[var(--bb-error)]' },
  exhausted: { label: 'Exhausted', dotStatus: 'offline', icon: Zap, color: 'text-[var(--bb-flare)]' },
};

const typeLabels: Record<string, string> = {
  'code-optimize': 'Code Optimize',
  'qa-sweep': 'QA Sweep',
  'content-generate': 'Content Gen',
  'research': 'Research',
  'vault-enrich': 'Vault Enrich',
  'security-audit': 'Security Audit',
  'custom': 'Custom',
};

function formatDuration(ms: number): string {
  if (ms === 0) return '--';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

function formatCost(cost: number): string {
  if (cost === 0) return '--';
  return `$${cost.toFixed(2)}`;
}

function formatSchedule(schedule: string | null): string {
  if (!schedule) return 'Manual';
  // Simple cron-to-human for common patterns
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, , , dow] = parts;
  const days = dow === '*' ? 'daily' : dow === '1-5' ? 'Mon-Fri' : dow === '0' ? 'Sunday' : dow;
  return `${hour}:${min.padStart(2, '0')} ${days}`;
}

export default function ProgramList({ programs, searchQuery, onSelectProgram }: ProgramListProps) {
  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-tertiary">
        <Clock size={40} className="mb-3 opacity-40" />
        <p className="text-sm">Nenhum programa encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((program, i) => {
        const config = statusConfig[program.status] || statusConfig.idle;
        const progress = program.maxIterations > 0
          ? (program.currentIteration / program.maxIterations) * 100
          : 0;

        const improvement = program.baselineMetric !== null && program.bestMetric !== null
          ? ((program.baselineMetric - program.bestMetric) / program.baselineMetric) * 100
          : null;

        return (
          <div
            key={program.id}
          >
            <CockpitCard
              interactive
              padding="md"
              className="cursor-pointer group"
              onClick={() => onSelectProgram(program.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot
                      status={config.dotStatus}
                      size="sm"
                      pulse={program.status === 'running'}
                    />
                    <h3 className="text-sm font-medium text-primary truncate">
                      {program.name}
                    </h3>
                  </div>
                  <Badge variant="subtle" size="sm">
                    {typeLabels[program.type] || program.type}
                  </Badge>
                </div>

                {improvement !== null && improvement > 0 && (
                  <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-mono font-bold text-[var(--color-status-success)]">
                      -{improvement.toFixed(1)}%
                    </span>
                    <p className="type-micro text-tertiary">improvement</p>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-tertiary mb-1">
                  <span className="flex items-center gap-1">
                    <Repeat size={10} />
                    {program.currentIteration}/{program.maxIterations}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <ProgressBar
                  value={progress}
                  size="sm"
                  variant={
                    program.status === 'completed' ? 'success' :
                    program.status === 'failed' ? 'error' :
                    program.status === 'running' ? 'info' :
                    'default'
                  }
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-tertiary">
                <span className="flex items-center gap-1">
                  <Timer size={10} />
                  {formatDuration(program.wallClockMs)}
                </span>
                <span className="flex items-center gap-1">
                  <Coins size={10} />
                  {formatCost(program.estimatedCost)}
                </span>
                {program.branchName && (
                  <span className="flex items-center gap-1 truncate">
                    <GitBranch size={10} />
                    <span className="font-mono truncate max-w-[120px]">
                      {program.branchName.split('/').pop()}
                    </span>
                  </span>
                )}
              </div>

              {/* Schedule */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-tertiary">
                <span>{formatSchedule(program.schedule)}</span>
                {program.convergenceReason && (
                  <Badge variant="subtle" size="sm">
                    {program.convergenceReason.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
            </CockpitCard>
          </div>
        );
      })}
    </div>
  );
}
