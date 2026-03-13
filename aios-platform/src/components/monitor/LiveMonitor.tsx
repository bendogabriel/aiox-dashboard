import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Trash2,
  Terminal,
} from 'lucide-react';
import { CockpitCard, CockpitButton } from '../ui';
import { useMonitorStore } from '../../stores/monitorStore';
import { cn } from '../../lib/utils';
import { useMonitorSSE } from '../../hooks/useMonitorSSE';
import MetricsPanel from './MetricsPanel';
import EventList from './EventList';
import AgentStatusCards from './AgentStatusCards';
import AlertBanner from './AlertBanner';
import ConnectionStatus from './ConnectionStatus';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Running duration display with animated dots */
function CurrentToolIndicator({
  tool,
}: {
  tool: { name: string; startedAt: string };
}) {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const start = new Date(tool.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [tool.startedAt]);

  return (
    <CockpitCard padding="sm" variant="subtle" className="flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Terminal className="h-4 w-4 text-[var(--color-status-success)]" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-status-success)] animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">
              Executing: {tool.name}
            </span>
            <span className="text-xs text-[var(--color-status-success)] font-mono w-8">
              {dots.padEnd(3, '\u00A0')}
            </span>
          </div>
          <span className="text-[10px] text-tertiary">
            Running for {formatDuration(elapsed)}
          </span>
        </div>
      </div>
    </CockpitCard>
  );
}

/** Mini stat block */
function StatBlock({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={cn('h-4 w-4', color)} />
      <span className="text-sm font-bold text-primary">{value}</span>
      <span className="text-[10px] text-tertiary">{label}</span>
    </div>
  );
}

export default function LiveMonitor({ viewToggle }: { viewToggle?: React.ReactNode }) {
  const { currentTool, stats, clearEvents, alerts } =
    useMonitorStore();

  // Connect via SSE -> WS fallback -> demo data fallback
  useMonitorSSE();

  const hasActiveAlerts = alerts.some((a) => !a.dismissed);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
      {/* Header with title + ConnectionStatus + Clear button */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="heading-display text-xl font-semibold text-primary type-h2">Monitor</h1>
          {viewToggle}
          <ConnectionStatus />
        </div>

        <CockpitButton
          size="sm"
          variant="ghost"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={clearEvents}
        >
          Clear
        </CockpitButton>
      </div>

      {/* AlertBanner (if alerts exist) */}
      {hasActiveAlerts && <AlertBanner />}

      {/* MetricsPanel */}
      <MetricsPanel />

      {/* AgentStatusCards */}
      <AgentStatusCards />

      {/* Current tool indicator */}
      {currentTool && <CurrentToolIndicator tool={currentTool} />}

      {/* EventList (replaces inline event rendering) */}
      <EventList />

      {/* Stats footer */}
      <CockpitCard padding="sm" variant="subtle" className="flex-shrink-0">
        <div className="grid grid-cols-4 gap-4">
          <StatBlock
            icon={Activity}
            label="Total Events"
            value={stats.total}
            color="text-[var(--aiox-blue)]"
          />
          <StatBlock
            icon={CheckCircle2}
            label="Success Rate"
            value={`${stats.successRate}%`}
            color="text-[var(--color-status-success)]"
          />
          <StatBlock
            icon={AlertCircle}
            label="Errors"
            value={stats.errorCount}
            color="text-[var(--bb-error)]"
          />
          <StatBlock
            icon={Wifi}
            label="Sessions"
            value={stats.activeSessions}
            color="text-[var(--aiox-blue)]"
          />
        </div>
      </CockpitCard>
    </div>
  );
}
