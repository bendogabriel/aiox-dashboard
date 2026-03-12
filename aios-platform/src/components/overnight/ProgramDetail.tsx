import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  GitBranch,
  Timer,
  Coins,
  Zap,
  Repeat,
  TrendingDown,
  FileText,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, ProgressBar, StatusDot } from '../ui';
import { useOvernightStore } from '../../stores/overnightStore';
import { cn } from '../../lib/utils';
import MetricChart from './MetricChart';
import ExperimentCard from './ExperimentCard';
import ScheduleInfo from './ScheduleInfo';
import AlertsPanel from './AlertsPanel';
import type { OvernightProgram } from '../../types/overnight';

interface ProgramDetailProps {
  program: OvernightProgram;
}

function formatDuration(ms: number): string {
  if (ms === 0) return '--';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

function formatTokens(tokens: number): string {
  if (tokens === 0) return '--';
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1)}k`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabels: Record<string, string> = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  exhausted: 'Exhausted',
};

const statusDotMap: Record<string, 'idle' | 'working' | 'waiting' | 'error' | 'success' | 'offline'> = {
  idle: 'idle',
  running: 'working',
  paused: 'waiting',
  completed: 'success',
  failed: 'error',
  exhausted: 'offline',
};

export default function ProgramDetail({ program }: ProgramDetailProps) {
  const { getExperiments, selectExperiment } = useOvernightStore();
  const experiments = getExperiments(program.id);

  const progress = program.maxIterations > 0
    ? (program.currentIteration / program.maxIterations) * 100
    : 0;

  const improvement = program.baselineMetric !== null && program.bestMetric !== null
    ? ((program.baselineMetric - program.bestMetric) / program.baselineMetric) * 100
    : null;

  const keeps = experiments.filter((e) => e.status === 'keep').length;
  const discards = experiments.filter((e) => e.status === 'discard').length;
  const errors = experiments.filter((e) => e.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusDot
              status={statusDotMap[program.status] || 'idle'}
              pulse={program.status === 'running'}
            />
            <span className="text-sm text-secondary">
              {statusLabels[program.status]}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-primary">{program.name}</h2>
          <p className="text-xs text-tertiary font-mono mt-1">{program.definitionPath}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {program.status === 'running' && (
            <>
              <GlassButton size="sm" variant="ghost" leftIcon={<Pause size={14} />}>
                Pause
              </GlassButton>
              <GlassButton size="sm" variant="danger" leftIcon={<Square size={14} />}>
                Cancel
              </GlassButton>
            </>
          )}
          {(program.status === 'idle' || program.status === 'paused') && (
            <GlassButton size="sm" variant="primary" leftIcon={<Play size={14} />}>
              {program.status === 'paused' ? 'Resume' : 'Start'}
            </GlassButton>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard padding="sm">
          <div className="flex items-center gap-2 text-tertiary text-xs mb-1">
            <Repeat size={12} />
            <span>Iterations</span>
          </div>
          <p className="text-lg font-mono font-bold text-primary">
            {program.currentIteration}
            <span className="text-xs text-tertiary font-normal">/{program.maxIterations}</span>
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center gap-2 text-tertiary text-xs mb-1">
            <TrendingDown size={12} />
            <span>Improvement</span>
          </div>
          <p className={cn(
            'text-lg font-mono font-bold',
            improvement !== null && improvement > 0 ? 'text-green-400' : 'text-primary'
          )}>
            {improvement !== null ? `-${improvement.toFixed(1)}%` : '--'}
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center gap-2 text-tertiary text-xs mb-1">
            <Timer size={12} />
            <span>Duration</span>
          </div>
          <p className="text-lg font-mono font-bold text-primary">
            {formatDuration(program.wallClockMs)}
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center gap-2 text-tertiary text-xs mb-1">
            <Coins size={12} />
            <span>Cost</span>
          </div>
          <p className="text-lg font-mono font-bold text-primary">
            ${program.estimatedCost.toFixed(2)}
          </p>
        </GlassCard>
      </div>

      {/* Progress bar */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between text-xs text-tertiary mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar
          value={progress}
          size="md"
          variant={
            program.status === 'completed' ? 'success' :
            program.status === 'failed' ? 'error' :
            program.status === 'running' ? 'info' :
            'default'
          }
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-tertiary">
          {program.branchName && (
            <span className="flex items-center gap-1">
              <GitBranch size={10} />
              <span className="font-mono">{program.branchName}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Zap size={10} />
            {formatTokens(program.tokensUsed)} tokens
          </span>
        </div>
      </GlassCard>

      {/* Metric chart */}
      {experiments.length > 0 && (
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-primary">Metric Evolution</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Baseline: {program.baselineMetric?.toFixed(1) ?? '--'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-green-400" />
                Best: {program.bestMetric?.toFixed(1) ?? '--'}
              </span>
            </div>
          </div>
          <MetricChart
            experiments={experiments}
            baseline={program.baselineMetric}
            bestMetric={program.bestMetric}
            height={140}
          />
        </GlassCard>
      )}

      {/* Schedule + Alerts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScheduleInfo program={program} />
        <AlertsPanel alerts={[]} />
      </div>

      {/* Experiment stats */}
      <div className="flex items-center gap-4">
        <h3 className="text-sm font-medium text-primary">
          Experiments ({experiments.length})
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {keeps} keeps
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            {discards} discards
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {errors} errors
          </span>
        </div>
      </div>

      {/* Experiments timeline */}
      <div className="space-y-2">
        {experiments.length === 0 ? (
          <GlassCard padding="md">
            <div className="flex flex-col items-center justify-center py-8 text-tertiary">
              <FileText size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Nenhum experimento registrado</p>
            </div>
          </GlassCard>
        ) : (
          experiments.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              onClick={() => selectExperiment(exp.id)}
            />
          ))
        )}
      </div>

      {/* Metadata */}
      <GlassCard padding="sm" variant="subtle">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-tertiary">
          <div>
            <span className="block text-[10px] uppercase tracking-wide mb-0.5">Created</span>
            <span className="text-secondary">{formatDate(program.createdAt)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wide mb-0.5">Started</span>
            <span className="text-secondary">{formatDate(program.startedAt)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wide mb-0.5">Completed</span>
            <span className="text-secondary">{formatDate(program.completedAt)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wide mb-0.5">Convergence</span>
            <span className="text-secondary">
              {program.convergenceReason?.replace(/_/g, ' ') ?? '--'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
