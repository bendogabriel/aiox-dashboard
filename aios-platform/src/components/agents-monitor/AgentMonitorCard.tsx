import { Bot, Clock } from 'lucide-react';
import { GlassCard, Badge, StatusDot, ProgressBar } from '../ui';
import type { StatusType } from '../ui/StatusDot';
import { cn } from '../../lib/utils';

export interface AgentMonitorData {
  id: string;
  name: string;
  status: 'working' | 'waiting' | 'idle';
  phase: string;
  progress: number;
  story: string;
  lastActivity: string;
  model: string;
}

const phaseColors: Record<string, string> = {
  coding: 'text-green-400',
  testing: 'text-purple-400',
  reviewing: 'text-orange-400',
  planning: 'text-blue-400',
  deploying: 'text-yellow-400',
};

const modelBadgeStyle: Record<string, string> = {
  opus: 'bg-purple-500/15 text-purple-400',
  sonnet: 'bg-blue-500/15 text-blue-400',
  haiku: 'bg-green-500/15 text-green-400',
};

function mapStatus(status: AgentMonitorData['status']): StatusType {
  return status;
}

export function AgentMonitorCard({ agent }: { agent: AgentMonitorData }) {
  const isActive = agent.status === 'working';
  const statusType = mapStatus(agent.status);

  return (
    <GlassCard
      padding="md"
      className={cn(
        'glass-card relative overflow-hidden',
        isActive && 'ring-1 ring-green-500/20',
      )}
      aria-label={`Agent ${agent.name} - ${agent.status}`}
    >
      {/* Header: name + status + model */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot
            status={statusType}
            size="md"
            glow={isActive}
            pulse={isActive}
          />
          <span className="text-sm font-semibold text-primary truncate">
            {agent.name}
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md',
            modelBadgeStyle[agent.model] ?? 'bg-gray-500/15 text-gray-400',
          )}
        >
          {agent.model}
        </span>
      </div>

      {/* Phase */}
      {agent.phase && (
        <div className="flex items-center gap-1.5 mb-3">
          <Bot className="h-3.5 w-3.5 text-tertiary flex-shrink-0" />
          <span
            className={cn(
              'text-xs font-medium capitalize',
              phaseColors[agent.phase] ?? 'text-secondary',
            )}
          >
            {agent.phase}
          </span>
        </div>
      )}

      {/* Progress bar (only when working) */}
      {isActive && agent.progress > 0 && (
        <ProgressBar
          value={agent.progress}
          size="sm"
          variant="success"
          glow
          showLabel
          className="mb-3"
        />
      )}

      {/* Footer: story + last activity */}
      <div className="flex items-center justify-between">
        {agent.story ? (
          <Badge variant="default" size="sm">
            {agent.story}
          </Badge>
        ) : (
          <span className="text-[10px] text-tertiary">No active story</span>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] text-tertiary">
          <Clock className="h-3 w-3" />
          {agent.lastActivity}
        </span>
      </div>
    </GlassCard>
  );
}
