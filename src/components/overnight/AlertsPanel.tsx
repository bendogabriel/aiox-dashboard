import { Bell, AlertTriangle, Info, XCircle, Zap } from 'lucide-react';
import { CockpitCard, Badge } from '../ui';
import { cn } from '../../lib/utils';

// ── Types (mirrors engine alert-dispatcher) ──

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  programId: string;
  programName: string;
  title: string;
  message: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  maxVisible?: number;
}

const severityConfig: Record<AlertSeverity, {
  icon: typeof Info;
  color: string;
  bg: string;
  border: string;
}> = {
  info: { icon: Info, color: 'text-[var(--aiox-blue)]', bg: 'bg-[var(--aiox-blue)]/5', border: 'border-[var(--aiox-blue)]/20' },
  warning: { icon: AlertTriangle, color: 'text-[var(--bb-warning)]', bg: 'bg-[var(--bb-warning)]/5', border: 'border-[var(--bb-warning)]/20' },
  error: { icon: XCircle, color: 'text-[var(--bb-error)]', bg: 'bg-[var(--bb-error)]/5', border: 'border-[var(--bb-error)]/20' },
  critical: { icon: Zap, color: 'text-[var(--bb-error)]', bg: 'bg-[var(--bb-error)]/10', border: 'border-[var(--bb-error)]/30' },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AlertsPanel({ alerts, maxVisible = 10 }: AlertsPanelProps) {
  const visibleAlerts = alerts.slice(-maxVisible).reverse();

  if (visibleAlerts.length === 0) {
    return (
      <CockpitCard padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} className="text-tertiary" />
          <h3 className="text-sm font-medium text-primary">Alerts</h3>
        </div>
        <p className="text-xs text-tertiary text-center py-4">No alerts</p>
      </CockpitCard>
    );
  }

  return (
    <CockpitCard padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-tertiary" />
          <h3 className="text-sm font-medium text-primary">Alerts</h3>
        </div>
        <Badge variant="subtle" size="sm">{alerts.length}</Badge>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto glass-scrollbar">
        {visibleAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
              >
                <div className={cn(
                  'p-2.5 rounded-lg border',
                  config.bg, config.border
                )}>
                  <div className="flex items-start gap-2">
                    <Icon size={14} className={cn('flex-shrink-0 mt-0.5', config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary truncate">
                        {alert.title}
                      </p>
                      <p className="text-[11px] text-tertiary mt-0.5 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-tertiary mt-1">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
</div>
    </CockpitCard>
  );
}
