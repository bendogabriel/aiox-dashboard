import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Bot,
  RefreshCw,
} from 'lucide-react';
import {
  GlassCard,
  GlassButton,
  Badge,
  StatusDot,
  ProgressBar,
  SectionLabel,
} from '../ui';
import { useBobStore } from '../../stores/bobStore';
import type { Pipeline, PipelinePhase, BobAgent, BobDecision, BobError } from '../../stores/bobStore';
import { cn } from '../../lib/utils';

// ---------- Mock data hook ----------
function useBobMock() {
  const mockPipeline: Pipeline = {
    status: 'active',
    currentPhase: 'implementation',
    phases: [
      { id: 'analysis', label: 'Analysis', status: 'completed', duration: '45s' },
      { id: 'planning', label: 'Planning', status: 'completed', duration: '1m 20s' },
      { id: 'implementation', label: 'Implementation', status: 'in_progress', progress: 45 },
      { id: 'testing', label: 'Testing', status: 'pending' },
      { id: 'review', label: 'Review', status: 'pending' },
    ],
    agents: [
      { id: 'dev', name: 'AIOS Dev', task: 'Implementing feature', status: 'working' },
      { id: 'architect', name: 'AIOS Architect', task: 'Architecture review', status: 'completed' },
    ],
    errors: [],
    decisions: [
      {
        id: '1',
        message: 'Use SSE instead of WebSocket for real-time updates?',
        severity: 'info',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return { mockPipeline };
}

// ---------- Phase Step ----------
function PhaseStep({ phase, index, total }: { phase: PipelinePhase; index: number; total: number }) {
  const isLast = index === total - 1;

  const statusIcon = (() => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/20">
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </span>
        );
    }
  })();

  return (
    <div className="flex items-center gap-0 flex-1 min-w-0">
      {/* Step circle + label */}
      <div className="flex flex-col items-center gap-1 min-w-[72px]">
        <div
          className={cn(
            'flex items-center justify-center h-9 w-9 rounded-full',
            phase.status === 'completed' && 'bg-green-500/15',
            phase.status === 'in_progress' && 'bg-blue-500/15 ring-2 ring-blue-500/30',
            phase.status === 'failed' && 'bg-red-500/15',
            phase.status === 'pending' && 'bg-white/5',
          )}
        >
          {statusIcon}
        </div>
        <span
          className={cn(
            'text-[11px] font-medium text-center leading-tight',
            phase.status === 'in_progress' ? 'text-blue-400' : 'text-secondary',
            phase.status === 'completed' && 'text-green-400',
          )}
        >
          {phase.label}
        </span>
        {phase.duration && (
          <span className="text-[10px] text-tertiary">{phase.duration}</span>
        )}
        {phase.status === 'in_progress' && phase.progress !== undefined && (
          <span className="text-[10px] text-blue-400 font-medium">{phase.progress}%</span>
        )}
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className="flex-1 h-0.5 mx-1 mt-[-24px]">
          <div
            className={cn(
              'h-full rounded-full',
              phase.status === 'completed' ? 'bg-green-500/40' : 'bg-white/10',
            )}
          />
        </div>
      )}
    </div>
  );
}

// ---------- Agent Row ----------
function AgentRow({ agent }: { agent: BobAgent }) {
  const statusMap: Record<BobAgent['status'], { dot: 'working' | 'success' | 'waiting' | 'error'; label: string }> = {
    working: { dot: 'working', label: 'Working' },
    completed: { dot: 'success', label: 'Done' },
    waiting: { dot: 'waiting', label: 'Waiting' },
    failed: { dot: 'error', label: 'Failed' },
  };

  const mapped = statusMap[agent.status];

  return (
    <div className="flex items-center justify-between py-2 px-3 glass-subtle rounded-xl">
      <div className="flex items-center gap-2 min-w-0">
        <Bot className="h-4 w-4 text-tertiary flex-shrink-0" />
        <span className="text-sm font-medium text-primary truncate">{agent.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-secondary truncate max-w-[160px] hidden sm:inline">
          {agent.task}
        </span>
        <StatusDot status={mapped.dot} size="sm" glow={agent.status === 'working'} pulse={agent.status === 'working'} label={mapped.label} />
      </div>
    </div>
  );
}

// ---------- Decision Card ----------
function DecisionCard({ decision, onResolve }: { decision: BobDecision; onResolve: (id: string) => void }) {
  const severityBorder: Record<BobDecision['severity'], string> = {
    info: 'border-blue-500/30',
    warning: 'border-yellow-500/40',
    error: 'border-red-500/40',
  };

  const severityIcon: Record<BobDecision['severity'], React.ReactNode> = {
    info: <AlertTriangle className="h-4 w-4 text-blue-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
    error: <AlertTriangle className="h-4 w-4 text-red-400" />,
  };

  if (decision.resolved) return null;

  return (
    <GlassCard
      padding="sm"
      className={cn('border', severityBorder[decision.severity])}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{severityIcon[decision.severity]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-primary">{decision.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <GlassButton size="sm" variant="primary" onClick={() => onResolve(decision.id)}>
              Acknowledge
            </GlassButton>
            <span className="text-[10px] text-tertiary">
              {new Date(decision.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ---------- Error Card ----------
function ErrorCard({ error }: { error: BobError }) {
  return (
    <GlassCard padding="sm" className="border border-red-500/40">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm text-red-400 font-medium">{error.message}</p>
          <p className="text-[10px] text-tertiary mt-1">
            Source: {error.source} | {new Date(error.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ---------- Inactive State ----------
function InactiveState({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl glass-subtle mx-auto mb-4">
          <Cpu className="h-8 w-8 text-tertiary" />
        </div>
        <h2 className="text-lg font-semibold text-primary mb-1">Bob is inactive</h2>
        <p className="text-sm text-secondary mb-4">
          Start a task to activate Bob orchestration
        </p>
        <GlassButton variant="primary" leftIcon={<Play className="h-4 w-4" />} onClick={onActivate}>
          Load Demo Pipeline
        </GlassButton>
      </motion.div>
    </div>
  );
}

// ---------- Active State ----------
function ActiveState({ pipeline, onResolveDecision }: { pipeline: Pipeline; onResolveDecision: (id: string) => void }) {
  const unresolvedDecisions = pipeline.decisions.filter((d) => !d.resolved);

  return (
    <div className="flex flex-col gap-6">
      {/* Pipeline Progress */}
      <section>
        <SectionLabel>Pipeline Progress</SectionLabel>
        <GlassCard padding="md">
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {pipeline.phases.map((phase, i) => (
              <PhaseStep
                key={phase.id}
                phase={phase}
                index={i}
                total={pipeline.phases.length}
              />
            ))}
          </div>
          {/* Overall progress */}
          {pipeline.status === 'active' && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <ProgressBar
                value={
                  (pipeline.phases.filter((p) => p.status === 'completed').length /
                    pipeline.phases.length) *
                  100
                }
                size="sm"
                variant="info"
                showLabel
                label="Overall progress"
              />
            </div>
          )}
        </GlassCard>
      </section>

      {/* Agent Activity */}
      <section>
        <SectionLabel count={pipeline.agents.length}>Agent Activity</SectionLabel>
        <div className="flex flex-col gap-2">
          {pipeline.agents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AgentRow agent={agent} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Surface Alerts (decisions) */}
      {unresolvedDecisions.length > 0 && (
        <section>
          <SectionLabel count={unresolvedDecisions.length}>
            Decisions Needed
          </SectionLabel>
          <div className="flex flex-col gap-3">
            {unresolvedDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onResolve={onResolveDecision}
              />
            ))}
          </div>
        </section>
      )}

      {/* Errors */}
      {pipeline.errors.length > 0 && (
        <section>
          <SectionLabel count={pipeline.errors.length}>Errors</SectionLabel>
          <div className="flex flex-col gap-3">
            {pipeline.errors.map((error) => (
              <ErrorCard key={error.id} error={error} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- Main Component ----------
export default function BobOrchestration() {
  const { isActive, pipeline, setPipeline, resolveDecision } = useBobStore();
  const { mockPipeline } = useBobMock();

  const handleActivateDemo = () => {
    setPipeline(mockPipeline);
  };

  const handleReset = () => {
    setPipeline(null);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6">
      {/* Header (only when active) */}
      {isActive && pipeline && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl font-bold text-primary">Bob Orchestration</h1>
            <Badge
              variant="status"
              status={pipeline.status === 'active' ? 'online' : pipeline.status === 'failed' ? 'error' : 'offline'}
              size="sm"
            >
              {pipeline.status}
            </Badge>
          </div>
          <GlassButton
            size="sm"
            variant="ghost"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={handleReset}
          >
            Reset
          </GlassButton>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {!isActive || !pipeline ? (
          <motion.div
            key="inactive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <InactiveState onActivate={handleActivateDemo} />
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ActiveState pipeline={pipeline} onResolveDecision={resolveDecision} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
