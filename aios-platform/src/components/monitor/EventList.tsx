import { useEffect, useRef } from 'react';
import {
  Terminal,
  MessageSquare,
  AlertTriangle,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { CockpitCard, CockpitButton, SectionLabel } from '../ui';
import { useMonitorStore } from '../../stores/monitorStore';
import type { MonitorEvent } from '../../stores/monitorStore';
import { cn } from '../../lib/utils';

const eventTypeConfig: Record<
  MonitorEvent['type'],
  { icon: typeof Activity; label: string; badgeClass: string }
> = {
  tool_call: {
    icon: Terminal,
    label: 'Tool',
    badgeClass: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  },
  message: {
    icon: MessageSquare,
    label: 'Message',
    badgeClass: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  },
  error: {
    icon: AlertTriangle,
    label: 'Error',
    badgeClass: 'bg-[var(--bb-error)]/15 text-[var(--bb-error)]',
  },
  system: {
    icon: Settings2,
    label: 'System',
    badgeClass: 'bg-[var(--aiox-gray-muted)]/15 text-[var(--aiox-gray-muted)]',
  },
};

const filterTypes: MonitorEvent['type'][] = ['tool_call', 'message', 'error', 'system'];

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--:--';
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

function EventRow({ event }: { event: MonitorEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors',
        event.type === 'error' && 'bg-[var(--bb-error)]/5',
      )}
    >
      <span className="text-[10px] text-tertiary font-mono whitespace-nowrap pt-0.5">
        {formatTime(event.timestamp)}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md whitespace-nowrap',
          config.badgeClass,
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
      <span className="text-xs font-medium text-secondary whitespace-nowrap">
        {event.agent}
      </span>
      <span className="text-xs text-tertiary flex-1 min-w-0 truncate">
        {event.description}
      </span>
      {event.duration !== undefined && (
        <span className="text-[10px] text-tertiary font-mono whitespace-nowrap">
          {formatDuration(event.duration)}
        </span>
      )}
      {event.success !== undefined &&
        (event.success ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-status-success)] flex-shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-[var(--bb-error)] flex-shrink-0" />
        ))}
    </div>
  );
}

export default function EventList() {
  const events = useMonitorStore((s) => s.events);
  const eventFilters = useMonitorStore((s) => s.eventFilters);
  const getFilteredEvents = useMonitorStore((s) => s.getFilteredEvents);
  const toggleEventFilter = useMonitorStore((s) => s.toggleEventFilter);

  const feedRef = useRef<HTMLDivElement>(null);
  const filteredEvents = getFilteredEvents();
  const reversedEvents = [...filteredEvents].reverse();

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [filteredEvents.length]);

  return (
    <>
      <SectionLabel count={filteredEvents.length}>
        Activity Feed
      </SectionLabel>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        {filterTypes.map((type) => {
          const config = eventTypeConfig[type];
          const Icon = config.icon;
          const isActive = eventFilters.size === 0 || eventFilters.has(type);

          return (
            <CockpitButton
              key={type}
              size="sm"
              variant="ghost"
              className={cn(
                'text-xs',
                !isActive && 'opacity-40',
              )}
              leftIcon={<Icon className="h-3 w-3" />}
              onClick={() => toggleEventFilter(type)}
            >
              {config.label}
            </CockpitButton>
          );
        })}
      </div>

      <CockpitCard padding="none" className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto divide-y divide-white/5"
          tabIndex={0}
          role="region"
          aria-label="Feed de eventos"
        >
          {reversedEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
{filteredEvents.length === 0 && (
            <div className="flex items-center justify-center h-32 text-tertiary text-sm">
              {events.length === 0
                ? 'No events recorded'
                : 'No events match the selected filters'}
            </div>
          )}
        </div>
      </CockpitCard>
    </>
  );
}
