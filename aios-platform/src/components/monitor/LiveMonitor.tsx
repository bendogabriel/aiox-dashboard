import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Trash2,
  Terminal,
  MessageSquare,
  AlertTriangle,
  Settings2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassButton, StatusDot, SectionLabel } from '../ui';
import { useMonitorStore } from '../../stores/monitorStore';
import type { MonitorEvent } from '../../stores/monitorStore';
import { cn } from '../../lib/utils';

// Event type config — icon, colors, label
const eventTypeConfig: Record<
  MonitorEvent['type'],
  { icon: typeof Activity; label: string; color: string; badgeClass: string }
> = {
  tool_call: {
    icon: Terminal,
    label: 'Tool',
    color: 'text-blue-400',
    badgeClass: 'bg-blue-500/15 text-blue-400',
  },
  message: {
    icon: MessageSquare,
    label: 'Message',
    color: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/15 text-cyan-400',
  },
  error: {
    icon: AlertTriangle,
    label: 'Error',
    color: 'text-red-400',
    badgeClass: 'bg-red-500/15 text-red-400',
  },
  system: {
    icon: Settings2,
    label: 'System',
    color: 'text-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-400',
  },
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

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
    <GlassCard padding="sm" variant="subtle" className="flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">
              Executing: {tool.name}
            </span>
            <span className="text-xs text-green-400 font-mono w-8">
              {dots.padEnd(3, '\u00A0')}
            </span>
          </div>
          <span className="text-[10px] text-tertiary">
            Running for {formatDuration(elapsed)}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

/** Single event row */
function EventRow({ event }: { event: MonitorEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors',
        event.type === 'error' && 'bg-red-500/5',
      )}
    >
      {/* Timestamp */}
      <span className="text-[10px] text-tertiary font-mono whitespace-nowrap pt-0.5">
        {formatTime(event.timestamp)}
      </span>

      {/* Type badge */}
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md whitespace-nowrap',
          config.badgeClass,
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>

      {/* Agent */}
      <span className="text-xs font-medium text-secondary whitespace-nowrap">
        {event.agent}
      </span>

      {/* Description */}
      <span className="text-xs text-tertiary flex-1 min-w-0 truncate">
        {event.description}
      </span>

      {/* Duration */}
      {event.duration !== undefined && (
        <span className="text-[10px] text-tertiary font-mono whitespace-nowrap">
          {formatDuration(event.duration)}
        </span>
      )}

      {/* Success/fail indicator */}
      {event.success !== undefined && (
        event.success ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
        )
      )}
    </motion.div>
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

export default function LiveMonitor() {
  const { connected, events, currentTool, stats, clearEvents, connectToMonitor, disconnectFromMonitor } =
    useMonitorStore();

  const feedRef = useRef<HTMLDivElement>(null);

  // Connect to the Monitor Server on mount
  useEffect(() => {
    connectToMonitor();
    return () => disconnectFromMonitor();
  }, [connectToMonitor, disconnectFromMonitor]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events.length]);

  // Reversed to show newest first in the feed
  const reversedEvents = [...events].reverse();

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-primary">Live Monitor</h1>
          <StatusDot
            status={connected ? 'working' : 'offline'}
            size="md"
            glow={connected}
            pulse={connected}
            label={connected ? 'Connected' : 'Disconnected'}
          />
        </div>

        <GlassButton
          size="sm"
          variant="ghost"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={clearEvents}
        >
          Clear
        </GlassButton>
      </div>

      {/* Current tool indicator */}
      {currentTool && <CurrentToolIndicator tool={currentTool} />}

      {/* Activity feed */}
      <SectionLabel count={events.length}>Activity Feed</SectionLabel>

      <GlassCard padding="none" className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto divide-y divide-white/5"
        >
          <AnimatePresence initial={false}>
            {reversedEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </AnimatePresence>

          {events.length === 0 && (
            <div className="flex items-center justify-center h-32 text-tertiary text-sm">
              No events recorded
            </div>
          )}
        </div>
      </GlassCard>

      {/* Stats footer */}
      <GlassCard padding="sm" variant="subtle" className="flex-shrink-0">
        <div className="grid grid-cols-4 gap-4">
          <StatBlock
            icon={Activity}
            label="Total Events"
            value={stats.total}
            color="text-blue-400"
          />
          <StatBlock
            icon={CheckCircle2}
            label="Success Rate"
            value={`${stats.successRate}%`}
            color="text-green-400"
          />
          <StatBlock
            icon={AlertCircle}
            label="Errors"
            value={stats.errorCount}
            color="text-red-400"
          />
          <StatBlock
            icon={Wifi}
            label="Sessions"
            value={stats.activeSessions}
            color="text-cyan-400"
          />
        </div>
      </GlassCard>
    </div>
  );
}
