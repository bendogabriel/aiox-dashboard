import { useState } from 'react';
import { Minimize2, Maximize2, FolderOpen, ArrowLeftRight, Box, Layers } from 'lucide-react';
import { CockpitCard, Badge, StatusDot } from '../ui';
import type { StatusType } from '../ui/StatusDot';
import { cn } from '../../lib/utils';

export type InvocationType = 'full-context' | 'subagent' | 'delegated';

export interface TerminalSession {
  id: string;
  agent: string;
  agentId?: string;
  status: 'working' | 'idle' | 'error' | 'connecting';
  invocationType?: InvocationType;
  parentAgentId?: string;
  dir: string;
  story: string;
  output: string[];
}

function mapStatus(status: TerminalSession['status']): StatusType {
  if (status === 'connecting') return 'idle';
  return status;
}

const invocationConfig: Record<InvocationType, {
  label: string;
  icon: typeof Layers;
  className: string;
  title: string;
}> = {
  'full-context': {
    label: 'Full',
    icon: Layers,
    className: 'bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border border-[var(--color-status-success)]/40 shadow-[0_0_6px_rgba(16,185,129,0.3)]',
    title: 'Full context — Agent persona + pipeline loaded',
  },
  'subagent': {
    label: 'Sub',
    icon: Box,
    className: 'bg-transparent text-zinc-400 border border-dashed border-zinc-500/50',
    title: 'Subagent — Lightweight isolated task, no persona',
  },
  'delegated': {
    label: 'Delegated',
    icon: ArrowLeftRight,
    className: 'bg-[var(--aiox-blue)]/20 text-[var(--aiox-blue)] border border-[var(--aiox-blue)]/40 shadow-[0_0_6px_rgba(59,130,246,0.3)]',
    title: 'Delegated — Full context, initiated by orchestrator',
  },
};

function InvocationBadge({ type, parentAgent }: { type: InvocationType; parentAgent?: string }) {
  const config = invocationConfig[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider leading-none',
        config.className,
      )}
      title={parentAgent ? `${config.title} (from ${parentAgent})` : config.title}
    >
      <Icon className="h-2.5 w-2.5" />
      {type === 'delegated' && parentAgent ? (
        <span className="truncate max-w-[60px]">{parentAgent}</span>
      ) : (
        config.label
      )}
    </span>
  );
}

interface TerminalCardProps {
  session: TerminalSession;
  listMode?: boolean;
}

export function TerminalCard({ session, listMode = false }: TerminalCardProps) {
  const [minimized, setMinimized] = useState(false);
  const isActive = session.status === 'working' || session.status === 'connecting';
  const statusType = mapStatus(session.status);

  // Show last 8 lines of output
  const visibleLines = session.output.slice(-8);

  return (
    <CockpitCard
      padding="none"
      className={cn(
        'overflow-hidden flex flex-col',
        !listMode && 'h-[280px]',
        listMode && 'h-auto',
        isActive && 'ring-1 terminal-ring-active',
      )}
      aria-label={`Terminal ${session.agent} - ${session.status}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot
            status={statusType}
            size="sm"
            glow={isActive}
            pulse={isActive}
          />
          <span className="text-sm font-semibold text-primary truncate">
            {session.agent}
          </span>
          {session.invocationType && (
            <InvocationBadge
              type={session.invocationType}
              parentAgent={session.parentAgentId}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-tertiary">
            <FolderOpen className="h-3 w-3" />
            <span className="max-w-[100px] truncate">{session.dir}</span>
          </span>
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded hover:bg-white/5 text-tertiary hover:text-secondary transition-colors"
            aria-label={minimized ? 'Maximize terminal' : 'Minimize terminal'}
          >
            {minimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal output area */}
      {!minimized && (
          <div
            className="flex-1 overflow-hidden"
          >
            <div
              className={cn(
                'bg-black/80 p-3 font-mono text-xs leading-relaxed overflow-y-auto',
                !listMode && 'h-[200px]',
                listMode && 'max-h-[160px]',
              )}
              tabIndex={0}
              role="region"
              aria-label={`Terminal ${session.agent}`}
            >
              {visibleLines.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.startsWith('$') ? (
                    <span className="terminal-prompt">{line}</span>
                  ) : line.startsWith('PASS') || line.includes('passed') ? (
                    <span className="terminal-success">{line}</span>
                  ) : line.startsWith('FAIL') || line.includes('error') || line.includes('Error') ? (
                    <span className="terminal-error">{line}</span>
                  ) : (
                    <span className="terminal-text">{line}</span>
                  )}
                </div>
              ))}
              {isActive && (
                <span className="terminal-cursor animate-pulse">_</span>
              )}
            </div>
          </div>
        )}
{/* Last output preview (when minimized) */}
      {minimized && session.output.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/5 bg-black/40">
          <p className="font-mono text-[10px] text-tertiary truncate">
            {session.output[session.output.length - 1]}
          </p>
        </div>
      )}

      {/* Footer: Story badge + activity indicator */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5">
        {session.story ? (
          <Badge variant="default" size="sm">
            {session.story}
          </Badge>
        ) : (
          <span className="text-[10px] text-tertiary">No active story</span>
        )}
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full terminal-activity-dot opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 terminal-activity-dot-bg" />
            </span>
          )}
          <span
            className={cn(
              'text-[10px] font-medium capitalize',
              isActive ? 'terminal-status-active' : 'text-tertiary',
            )}
          >
            {session.status}
          </span>
        </div>
      </div>
    </CockpitCard>
  );
}
