import { useMemo } from 'react';
import { Activity, ArrowUp, ArrowDown, Clock, Circle, Radio, WifiOff } from 'lucide-react';
import { useCapabilities } from '../../hooks/useCapabilities';
import { useIntegrationStore, type IntegrationId, type IntegrationStatus } from '../../stores/integrationStore';
import { useCapabilityHistoryStore, type HealthEvent } from '../../stores/capabilityHistoryStore';
import { useHealthMonitorStore } from '../../stores/healthMonitorStore';
import { HealthSparkline } from './HealthSparkline';

// ── Integration label map ────────────────────────────────

const LABELS: Record<IntegrationId, string> = {
  engine: 'Engine',
  supabase: 'Supabase',
  'api-keys': 'API Keys',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  voice: 'Voice',
  'google-drive': 'G.Drive',
  'google-calendar': 'G.Cal',
};

const STATUS_COLORS: Record<IntegrationStatus, string> = {
  connected: 'var(--aiox-lime, #D1FF00)',
  partial: 'var(--aiox-warning, #f59e0b)',
  checking: 'var(--aiox-blue, #0099FF)',
  disconnected: 'var(--aiox-gray-dim, #696969)',
  error: 'var(--color-status-error, #EF4444)',
};

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

/**
 * Health Card — shows integration status grid with sparklines,
 * uptime percentages, capability summary, polling controls,
 * and recent health events timeline.
 */
export function HealthCard() {
  const integrations = useIntegrationStore((s) => s.integrations);
  const { summary } = useCapabilities();
  const events = useCapabilityHistoryStore((s) => s.events);
  const monitorEnabled = useHealthMonitorStore((s) => s.enabled);
  const intervalSeconds = useHealthMonitorStore((s) => s.intervalSeconds);
  const lastPoll = useHealthMonitorStore((s) => s.lastPollTimestamp);
  const setEnabled = useHealthMonitorStore((s) => s.setEnabled);
  const setInterval = useHealthMonitorStore((s) => s.setInterval);
  const getUptime = useHealthMonitorStore((s) => s.getUptimePercent);
  const getSparkline = useHealthMonitorStore((s) => s.getSparklineData);

  const recentEvents = useMemo(() => events.slice(0, 8), [events]);

  const connectedCount = Object.values(integrations).filter(
    (i) => i.status === 'connected' || i.status === 'partial',
  ).length;
  const totalCount = Object.keys(integrations).length;
  const allHealthy = connectedCount === totalCount;

  return (
    <div style={{
      background: 'var(--aiox-surface, #0a0a0a)',
      border: `1px solid ${allHealthy ? 'rgba(209, 255, 0, 0.12)' : 'rgba(239, 68, 68, 0.15)'}`,
      fontFamily: 'var(--font-family-mono, monospace)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} style={{ color: allHealthy ? 'var(--aiox-lime)' : 'var(--color-status-error)' }} />
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            color: 'var(--aiox-cream, #E5E5E5)',
          }}>
            System Health
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Polling indicator */}
          {monitorEnabled && (
            <span style={{
              fontSize: '9px',
              color: 'var(--aiox-lime, #D1FF00)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Radio size={9} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              {intervalSeconds}s
            </span>
          )}
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-family-display, var(--font-family-mono))',
            fontWeight: 700,
            color: allHealthy ? 'var(--aiox-lime)' : 'var(--color-status-error)',
          }}>
            {connectedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Integration Status Grid with Sparklines */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        padding: '1px',
        background: 'rgba(255,255,255,0.04)',
      }}>
        {(Object.entries(integrations) as [IntegrationId, typeof integrations[IntegrationId]][]).map(([id, entry]) => {
          const uptime = getUptime(id);
          const sparkData = getSparkline(id);
          return (
            <div
              key={id}
              title={`${LABELS[id]}: ${entry.status}${entry.message ? ` — ${entry.message}` : ''}\nUptime: ${uptime}%`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '8px 6px 6px',
                background: 'var(--aiox-surface, #0a0a0a)',
              }}
            >
              <Circle
                size={8}
                fill={STATUS_COLORS[entry.status]}
                stroke="none"
                style={entry.status === 'checking' ? { animation: 'pulse 1.5s ease-in-out infinite' } : undefined}
              />
              <span style={{
                fontSize: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: STATUS_COLORS[entry.status],
                textAlign: 'center',
                lineHeight: '1.2',
              }}>
                {LABELS[id]}
              </span>
              {/* Sparkline */}
              <HealthSparkline data={sparkData} width={56} height={8} maxPoints={20} />
              {/* Uptime % */}
              {sparkData.length > 0 && (
                <span style={{
                  fontSize: '7px',
                  color: uptime >= 95
                    ? 'var(--aiox-lime, #D1FF00)'
                    : uptime >= 70
                      ? 'var(--aiox-warning, #f59e0b)'
                      : 'var(--color-status-error, #EF4444)',
                  fontWeight: 600,
                }}>
                  {uptime}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Capability Summary */}
      <div style={{
        display: 'flex',
        gap: '1px',
        padding: '1px 0',
        background: 'rgba(255,255,255,0.04)',
      }}>
        <CapStat label="Full" value={summary.full} total={summary.total} color="var(--aiox-lime, #D1FF00)" />
        <CapStat label="Degraded" value={summary.degraded} total={summary.total} color="var(--aiox-warning, #f59e0b)" />
        <CapStat label="Unavail" value={summary.unavailable} total={summary.total} color="var(--color-status-error, #EF4444)" />
      </div>

      {/* Polling Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <button
          onClick={() => setEnabled(!monitorEnabled)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
            color: monitorEnabled ? 'var(--aiox-lime, #D1FF00)' : 'var(--aiox-gray-dim, #696969)',
          }}
          aria-label={monitorEnabled ? 'Disable auto-monitoring' : 'Enable auto-monitoring'}
        >
          {monitorEnabled ? <Radio size={10} /> : <WifiOff size={10} />}
          {monitorEnabled ? 'Monitoring' : 'Monitor Off'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Interval selector */}
          <select
            value={intervalSeconds}
            onChange={(e) => setInterval(Number(e.target.value))}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--aiox-gray-muted, #999)',
              fontSize: '9px',
              fontFamily: 'inherit',
              padding: '2px 4px',
              cursor: 'pointer',
            }}
            aria-label="Polling interval"
          >
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
            <option value={120}>2m</option>
            <option value={300}>5m</option>
          </select>

          {/* Last poll time */}
          {lastPoll && (
            <span style={{ fontSize: '8px', color: 'var(--aiox-gray-dim, #696969)' }}>
              {formatTimeAgo(lastPoll)} ago
            </span>
          )}
        </div>
      </div>

      {/* Recent Events Timeline */}
      {recentEvents.length > 0 && (
        <div style={{
          padding: '10px 14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{
            display: 'block',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--aiox-gray-dim, #696969)',
            marginBottom: '8px',
          }}>
            Recent Events
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {recentEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {recentEvents.length === 0 && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          textAlign: 'center',
          fontSize: '10px',
          color: 'var(--aiox-gray-dim, #696969)',
        }}>
          No health events recorded yet
        </div>
      )}

      {/* Inline pulse animation */}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function CapStat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      padding: '8px 6px',
      background: 'var(--aiox-surface, #0a0a0a)',
    }}>
      <span style={{
        fontSize: '16px',
        fontFamily: 'var(--font-family-display, var(--font-family-mono))',
        fontWeight: 700,
        color: value > 0 ? color : 'var(--aiox-gray-dim)',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--aiox-gray-muted, #999)',
      }}>
        {label} ({pct}%)
      </span>
    </div>
  );
}

function EventRow({ event }: { event: HealthEvent }) {
  const isRecovery = event.newStatus === 'connected' || event.newStatus === 'partial';
  const color = isRecovery ? 'var(--aiox-lime, #D1FF00)' : 'var(--color-status-error, #EF4444)';
  const Icon = isRecovery ? ArrowUp : ArrowDown;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '9px',
    }}>
      <Icon size={9} style={{ color, flexShrink: 0 }} />
      <span style={{ color, fontWeight: 500 }}>
        {LABELS[event.integrationId]}
      </span>
      <span style={{ color: 'var(--aiox-gray-dim)', flex: 1 }}>
        {event.previousStatus} → {event.newStatus}
      </span>
      <span style={{ color: 'var(--aiox-gray-dim)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Clock size={8} />
        {formatTimeAgo(event.timestamp)}
      </span>
    </div>
  );
}
