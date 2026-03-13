import { useState, useEffect, memo } from 'react';
import {
  Loader2,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import type { TaskState, SquadSelection } from './orchestration-types';
import { getSquadColor, phases } from './orchestration-types';

/**
 * Pre-defined phase color map.
 * Dynamic Tailwind classes like `bg-${color}-500/20` do NOT work with JIT —
 * we use inline style objects instead.
 */
const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  analyzing:         { bg: 'var(--color-accent-subtle, #D1FF0033)', border: 'color-mix(in srgb, var(--color-accent, #D1FF00) 40%, transparent)', text: 'var(--color-accent, #D1FF00)' },
  planning:          { bg: 'color-mix(in srgb, var(--aiox-blue, #0099FF) 20%, transparent)', border: 'color-mix(in srgb, var(--aiox-blue, #0099FF) 40%, transparent)', text: 'var(--aiox-blue, #0099FF)' },
  awaiting_approval: { bg: 'color-mix(in srgb, var(--color-status-warning, #FFB800) 20%, transparent)', border: 'color-mix(in srgb, var(--color-status-warning, #FFB800) 40%, transparent)', text: 'var(--color-status-warning, #FFB800)' },
  executing:         { bg: 'var(--color-accent-subtle, #D1FF0033)', border: 'color-mix(in srgb, var(--color-accent, #D1FF00) 40%, transparent)', text: 'var(--color-accent, #D1FF00)' },
  completed:         { bg: 'var(--color-accent-subtle, #D1FF0033)', border: 'color-mix(in srgb, var(--color-accent, #D1FF00) 40%, transparent)', text: 'var(--color-accent, #D1FF00)' },
  failed:            { bg: 'color-mix(in srgb, var(--color-status-error, #FF3B30) 20%, transparent)', border: 'color-mix(in srgb, var(--color-status-error, #FF3B30) 40%, transparent)', text: 'var(--color-status-error, #FF3B30)' },
};

const PHASE_COLORS_DEFAULT = { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)' };

function getPhaseColor(phaseId: string) {
  return PHASE_COLORS[phaseId] ?? PHASE_COLORS_DEFAULT;
}

export const LiveMetrics = memo(function LiveMetrics({ state }: { state: TaskState }) {
  const [elapsed, setElapsed] = useState(() =>
    state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0
  );

  useEffect(() => {
    if (state.status === 'idle' || !state.startTime) {
      queueMicrotask(() => setElapsed(0));
      return;
    }

    // When completed/failed, set final elapsed time and stop
    if (state.status === 'completed' || state.status === 'failed') {
      setElapsed(Math.floor((Date.now() - state.startTime) / 1000));
      return;
    }

    const startTime = state.startTime;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [state.status, state.startTime]);

  const totalTokens = state.agentOutputs.reduce(
    (sum, o) => sum + (o.llmMetadata?.inputTokens || 0) + (o.llmMetadata?.outputTokens || 0),
    0
  );

  const estimatedCost = (totalTokens / 1000000) * 3;

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-6">
      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10">
        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--aiox-blue)]" />
        <span className="text-xs md:text-sm font-mono text-white/80">
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:
          {(elapsed % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10 hidden sm:flex">
        <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--aiox-gray-muted)]" />
        <span className="text-xs md:text-sm font-mono text-white/80">
          {totalTokens.toLocaleString()} tok
        </span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10 hidden md:flex">
        <Coins className="w-4 h-4 text-[var(--bb-warning)]" />
        <span className="text-sm font-mono text-white/80">
          ${estimatedCost.toFixed(4)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10">
        <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--color-status-success)]" />
        <span className="text-xs md:text-sm font-mono text-white/80">
          {state.agentOutputs.length + state.streamingOutputs.size} agentes
        </span>
      </div>
    </div>
  );
});

export const PhaseProgress = memo(function PhaseProgress({ currentStatus }: { currentStatus: TaskState['status'] }) {
  const currentPhaseIndex = phases.findIndex(p => p.id === currentStatus);

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {phases.map((phase, index) => {
        const isActive = phase.id === currentStatus;
        const isCompleted = currentPhaseIndex > index || currentStatus === 'completed';
        const isFailed = currentStatus === 'failed';
        const Icon = phase.icon;
        const colors = getPhaseColor(phase.id);

        // Determine styles: completed (green), active (phase color with border-left accent), inactive (muted)
        const completedStyle = {
          backgroundColor: 'color-mix(in srgb, var(--color-status-success, #4ADE80) 10%, transparent)',
          borderColor: 'color-mix(in srgb, var(--color-status-success, #4ADE80) 30%, transparent)',
          borderLeftWidth: '3px',
          borderLeftColor: 'var(--color-status-success, #4ADE80)',
        };
        const activeStyle = {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderLeftWidth: '3px',
          borderLeftColor: colors.text,
        };
        const inactiveStyle = {
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(255,255,255,0.1)',
        };

        const itemStyle = isCompleted
          ? completedStyle
          : isActive
          ? activeStyle
          : inactiveStyle;

        return (
          <div key={phase.id} className="flex items-center">
            <div
              className="relative flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 border transition-all duration-200"
              style={itemStyle}
            >
              <div className="relative">
                {isActive && !isFailed && !isCompleted ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.text }} />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-status-success)]" />
                ) : (
                  <Icon className="w-4 h-4 text-white/40" />
                )}
              </div>
              <span
                className="text-xs md:text-sm font-medium hidden sm:inline"
                style={{
                  color: isCompleted ? 'var(--color-status-success, #4ADE80)' : isActive ? colors.text : 'rgba(255,255,255,0.4)',
                }}
              >
                {phase.label}
              </span>
            </div>
            {index < phases.length - 1 && (
              <div
                className="w-4 md:w-8 h-0.5 origin-left hidden sm:block transition-transform duration-200"
                style={{
                  backgroundColor: 'var(--color-status-success, #4ADE80)',
                  transform: currentPhaseIndex > index ? 'scaleX(1)' : 'scaleX(0)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

export const SquadCard = memo(function SquadCard({ selection, isActive }: { selection: SquadSelection; isActive: boolean }) {
  const color = getSquadColor(selection.squadId);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative p-4 border transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: color.bg,
        borderColor: color.border,
        borderLeftWidth: isActive ? '3px' : '1px',
        borderLeftColor: isActive ? color.text : color.border,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
            >
              <Layers className="w-5 h-5" style={{ color: color.text }} />
            </div>
            <div>
              <h2 className="font-semibold text-white">{selection.squadId}</h2>
              <p className="text-xs text-white/50">Chief: {selection.chief}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 text-xs font-medium"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {selection.agentCount} agentes
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="transition-opacity duration-200">
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                {selection.agents.map((agent) => (
                  <span
                    key={agent.id}
                    className="px-3 py-1.5 text-xs font-medium bg-black/20 text-white/80"
                  >
                    {agent.name || agent.id}
                  </span>
                ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
});
