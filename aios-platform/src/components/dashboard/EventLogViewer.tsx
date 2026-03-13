import { useState, useMemo, useCallback } from 'react';
import {
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  useCapabilityHistoryStore,
  type HealthEvent,
} from '../../stores/capabilityHistoryStore';
import type { IntegrationId } from '../../stores/integrationStore';

// ── Constants ─────────────────────────────────────────

const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  engine: 'Engine',
  supabase: 'Supabase',
  'api-keys': 'API Keys',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  voice: 'Voice',
  'google-drive': 'G.Drive',
  'google-calendar': 'G.Cal',
};

const ALL_INTEGRATIONS: IntegrationId[] = [
  'engine',
  'supabase',
  'api-keys',
  'whatsapp',
  'telegram',
  'voice',
  'google-drive',
  'google-calendar',
];

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'all';
type EventType = 'all' | 'recovery' | 'failure';

const TIME_RANGES: { value: TimeRange; label: string; ms: number | null }[] = [
  { value: '1h', label: '1H', ms: 3_600_000 },
  { value: '6h', label: '6H', ms: 21_600_000 },
  { value: '24h', label: '24H', ms: 86_400_000 },
  { value: '7d', label: '7D', ms: 604_800_000 },
  { value: 'all', label: 'ALL', ms: null },
];

const PAGE_SIZE = 25;

// ── Helpers ─────────────────────────────────────────

function isRecoveryEvent(event: HealthEvent): boolean {
  return event.newStatus === 'connected' || event.newStatus === 'partial';
}

function isFailureEvent(event: HealthEvent): boolean {
  return (
    event.newStatus === 'disconnected' ||
    event.newStatus === 'error'
  );
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Exported filter/stats helpers (for testing) ────

export function filterEvents(
  events: HealthEvent[],
  integrationFilter: IntegrationId | 'all',
  typeFilter: EventType,
  timeRange: TimeRange,
  now?: number,
): HealthEvent[] {
  const currentTime = now ?? Date.now();
  return events.filter((event) => {
    // Integration filter
    if (integrationFilter !== 'all' && event.integrationId !== integrationFilter) {
      return false;
    }
    // Type filter
    if (typeFilter === 'recovery' && !isRecoveryEvent(event)) return false;
    if (typeFilter === 'failure' && !isFailureEvent(event)) return false;
    // Time range filter
    const rangeConfig = TIME_RANGES.find((r) => r.value === timeRange);
    if (rangeConfig?.ms != null) {
      if (event.timestamp < currentTime - rangeConfig.ms) return false;
    }
    return true;
  });
}

export function computeStats(events: HealthEvent[]) {
  const total = events.length;
  const failureCount = events.filter(isFailureEvent).length;
  const recoveryCount = events.filter(isRecoveryEvent).length;

  let avgTimeBetween = 0;
  if (events.length >= 2) {
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += sorted[i].timestamp - sorted[i - 1].timestamp;
    }
    avgTimeBetween = totalGap / (sorted.length - 1);
  }

  return { total, failureCount, recoveryCount, avgTimeBetween };
}

function formatDuration(ms: number): string {
  if (ms === 0) return '--';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  return `${(ms / 86_400_000).toFixed(1)}d`;
}

// ── Styles ──────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: 'var(--aiox-surface, #0a0a0a)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 0,
  fontFamily: 'var(--font-family-mono, monospace)',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--aiox-gray-dim, #696969)',
  fontWeight: 600,
};

const pillBaseStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '10px',
  fontFamily: 'var(--font-family-mono, monospace)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 0,
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--aiox-gray-muted, #999)',
  transition: 'all 0.15s ease',
};

const pillActiveStyle: React.CSSProperties = {
  ...pillBaseStyle,
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--aiox-cream, #E5E5E5)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
};

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 0,
  flex: 1,
  minWidth: '100px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontFamily: 'var(--font-family-display, var(--font-family-mono))',
  fontWeight: 700,
  color: 'var(--aiox-cream, #E5E5E5)',
  lineHeight: 1,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--aiox-gray-muted, #999)',
};

// ── Component ───────────────────────────────────────

export function EventLogViewer() {
  const events = useCapabilityHistoryStore((s) => s.events);

  // Filter state
  const [integrationFilter, setIntegrationFilter] = useState<IntegrationId | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EventType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [sortAsc, setSortAsc] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtered events
  const filteredEvents = useMemo(
    () => filterEvents(events, integrationFilter, typeFilter, timeRange),
    [events, integrationFilter, typeFilter, timeRange],
  );

  // Sorted events
  const sortedEvents = useMemo(() => {
    const sorted = [...filteredEvents];
    if (sortAsc) {
      sorted.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    }
    return sorted;
  }, [filteredEvents, sortAsc]);

  // Paginated events
  const visibleEvents = useMemo(
    () => sortedEvents.slice(0, visibleCount),
    [sortedEvents, visibleCount],
  );

  // Stats
  const stats = useMemo(() => computeStats(filteredEvents), [filteredEvents]);

  // Export handler
  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      filters: { integration: integrationFilter, type: typeFilter, timeRange },
      stats,
      events: filteredEvents.map((e) => ({
        ...e,
        timestampISO: new Date(e.timestamp).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aios-events-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredEvents, integrationFilter, typeFilter, timeRange, stats]);

  const hasMore = visibleCount < sortedEvents.length;

  const clearFilters = () => {
    setIntegrationFilter('all');
    setTypeFilter('all');
    setTimeRange('all');
  };

  const hasActiveFilters =
    integrationFilter !== 'all' || typeFilter !== 'all' || timeRange !== 'all';

  return (
    <div style={panelStyle} data-testid="event-log-viewer">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3
            size={14}
            style={{ color: 'var(--aiox-gray-dim, #696969)' }}
          />
          <span
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              color: 'var(--aiox-cream, #E5E5E5)',
            }}
          >
            Event Log
          </span>
          <span
            style={{
              fontSize: '9px',
              color: 'var(--aiox-gray-dim, #696969)',
              marginLeft: '4px',
            }}
          >
            ({stats.total} events)
          </span>
        </div>
        <button
          onClick={handleExport}
          data-testid="export-btn"
          disabled={filteredEvents.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 0,
            cursor: filteredEvents.length === 0 ? 'default' : 'pointer',
            padding: '4px 10px',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-family-mono, monospace)',
            color:
              filteredEvents.length === 0
                ? 'var(--aiox-gray-dim, #696969)'
                : 'var(--aiox-cream, #E5E5E5)',
            opacity: filteredEvents.length === 0 ? 0.5 : 1,
          }}
          aria-label="Export filtered events as JSON"
        >
          <Download size={10} />
          Export
        </button>
      </div>

      {/* Stats Header */}
      <div
        style={{
          display: 'flex',
          gap: '1px',
          padding: '1px',
          background: 'rgba(255,255,255,0.04)',
        }}
        data-testid="stats-header"
      >
        <div style={statCardStyle}>
          <span style={statValueStyle}>{stats.total}</span>
          <span style={statLabelStyle}>Total</span>
        </div>
        <div style={statCardStyle}>
          <span
            style={{
              ...statValueStyle,
              color:
                stats.failureCount > 0
                  ? 'var(--color-status-error, #EF4444)'
                  : 'var(--aiox-cream, #E5E5E5)',
            }}
          >
            {stats.failureCount}
          </span>
          <span style={statLabelStyle}>Failures</span>
        </div>
        <div style={statCardStyle}>
          <span
            style={{
              ...statValueStyle,
              color:
                stats.recoveryCount > 0
                  ? 'var(--color-status-success, #4ADE80)'
                  : 'var(--aiox-cream, #E5E5E5)',
            }}
          >
            {stats.recoveryCount}
          </span>
          <span style={statLabelStyle}>Recoveries</span>
        </div>
        <div style={statCardStyle}>
          <span style={statValueStyle}>
            {formatDuration(stats.avgTimeBetween)}
          </span>
          <span style={statLabelStyle}>Avg Interval</span>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        data-testid="filters-section"
      >
        {/* Filter header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter
              size={10}
              style={{ color: 'var(--aiox-gray-dim, #696969)' }}
            />
            <span style={sectionLabelStyle}>Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              data-testid="clear-filters-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '9px',
                color: 'var(--aiox-gray-muted, #999)',
                fontFamily: 'var(--font-family-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <X size={9} />
              Clear
            </button>
          )}
        </div>

        {/* Time Range pills */}
        <div>
          <span style={{ ...sectionLabelStyle, marginBottom: '6px', display: 'block' }}>
            Time Range
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  setTimeRange(range.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                data-testid={`time-range-${range.value}`}
                style={timeRange === range.value ? pillActiveStyle : pillBaseStyle}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type pills */}
        <div>
          <span style={{ ...sectionLabelStyle, marginBottom: '6px', display: 'block' }}>
            Type
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {(['all', 'recovery', 'failure'] as EventType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(type);
                  setVisibleCount(PAGE_SIZE);
                }}
                data-testid={`type-filter-${type}`}
                style={typeFilter === type ? pillActiveStyle : pillBaseStyle}
              >
                {type === 'all' && 'All'}
                {type === 'recovery' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUp size={9} /> Recovery
                  </span>
                )}
                {type === 'failure' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowDown size={9} /> Failure
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Integration dropdown */}
        <div>
          <span style={{ ...sectionLabelStyle, marginBottom: '6px', display: 'block' }}>
            Integration
          </span>
          <div style={{ position: 'relative' }}>
            <select
              value={integrationFilter}
              onChange={(e) => {
                setIntegrationFilter(e.target.value as IntegrationId | 'all');
                setVisibleCount(PAGE_SIZE);
              }}
              data-testid="integration-filter"
              style={{
                width: '100%',
                padding: '6px 28px 6px 10px',
                fontSize: '10px',
                fontFamily: 'var(--font-family-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 0,
                color: 'var(--aiox-cream, #E5E5E5)',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
              }}
              aria-label="Filter by integration"
            >
              <option value="all">All Integrations</option>
              {ALL_INTEGRATIONS.map((id) => (
                <option key={id} value={id}>
                  {INTEGRATION_LABELS[id]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--aiox-gray-dim, #696969)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sort toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <span style={sectionLabelStyle}>
          Events ({sortedEvents.length})
        </span>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          data-testid="sort-toggle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: '9px',
            color: 'var(--aiox-gray-muted, #999)',
            fontFamily: 'var(--font-family-mono, monospace)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
          aria-label={sortAsc ? 'Sort newest first' : 'Sort oldest first'}
        >
          <Clock size={9} />
          {sortAsc ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      {/* Event List */}
      <div
        style={{
          padding: '8px 0',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
        data-testid="event-list"
      >
        {visibleEvents.length === 0 && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
            data-testid="empty-state"
          >
            <AlertTriangle
              size={20}
              style={{ color: 'var(--aiox-gray-dim, #696969)' }}
            />
            <span
              style={{
                fontSize: '11px',
                color: 'var(--aiox-gray-dim, #696969)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              No events match your filters
            </span>
          </div>
        )}

        {visibleEvents.map((event) => (
          <EventLogRow key={event.id} event={event} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div
          style={{
            padding: '8px 16px 12px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            data-testid="load-more-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 24px',
              fontSize: '10px',
              fontFamily: 'var(--font-family-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--aiox-cream, #E5E5E5)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 0,
              cursor: 'pointer',
            }}
          >
            Load More ({sortedEvents.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

// ── EventLogRow ─────────────────────────────────────

function EventLogRow({ event }: { event: HealthEvent }) {
  const isRecovery = isRecoveryEvent(event);
  const color = isRecovery
    ? 'var(--color-status-success, #4ADE80)'
    : 'var(--color-status-error, #EF4444)';
  const Icon = isRecovery ? CheckCircle : AlertTriangle;

  const capTotal = event.capabilitySummary.total;
  const capFull = event.capabilitySummary.full;
  const capDegraded = event.capabilitySummary.degraded;
  const capUnavail = event.capabilitySummary.unavailable;

  return (
    <div
      data-testid="event-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        fontSize: '10px',
      }}
    >
      {/* Status icon */}
      <Icon
        size={12}
        style={{ color, flexShrink: 0 }}
      />

      {/* Timestamp */}
      <span
        style={{
          color: 'var(--aiox-gray-dim, #696969)',
          flexShrink: 0,
          fontSize: '9px',
          minWidth: '56px',
        }}
        title={formatTimestamp(event.timestamp)}
      >
        {formatTimeAgo(event.timestamp)}
      </span>

      {/* Integration name */}
      <span
        style={{
          color,
          fontWeight: 600,
          flexShrink: 0,
          minWidth: '64px',
          textTransform: 'uppercase',
          fontSize: '9px',
          letterSpacing: '0.04em',
        }}
      >
        {INTEGRATION_LABELS[event.integrationId]}
      </span>

      {/* Status transition */}
      <span
        style={{
          color: 'var(--aiox-gray-muted, #999)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          fontSize: '9px',
        }}
      >
        <span style={{ color: 'var(--aiox-gray-dim, #696969)' }}>
          {event.previousStatus}
        </span>
        <span style={{ color: 'var(--aiox-gray-dim, #696969)' }}>&rarr;</span>
        <span style={{ color }}>{event.newStatus}</span>
      </span>

      {/* Capabilities affected */}
      <span
        data-testid="capabilities-affected"
        style={{
          color: 'var(--aiox-gray-muted, #999)',
          flexShrink: 0,
          fontSize: '9px',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}
        title={`${capFull} full, ${capDegraded} degraded, ${capUnavail} unavailable`}
      >
        {event.capabilitiesAffected} caps
      </span>

      {/* Capability summary bar */}
      {capTotal > 0 && (
        <div
          data-testid="capability-bar"
          style={{
            display: 'flex',
            width: '48px',
            height: '4px',
            flexShrink: 0,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
          }}
          title={`Full: ${capFull}/${capTotal} | Degraded: ${capDegraded}/${capTotal} | Unavail: ${capUnavail}/${capTotal}`}
        >
          {capFull > 0 && (
            <div
              style={{
                width: `${(capFull / capTotal) * 100}%`,
                background: 'var(--color-status-success, #4ADE80)',
                height: '100%',
              }}
            />
          )}
          {capDegraded > 0 && (
            <div
              style={{
                width: `${(capDegraded / capTotal) * 100}%`,
                background: 'var(--aiox-warning, #f59e0b)',
                height: '100%',
              }}
            />
          )}
          {capUnavail > 0 && (
            <div
              style={{
                width: `${(capUnavail / capTotal) * 100}%`,
                background: 'var(--color-status-error, #EF4444)',
                height: '100%',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
