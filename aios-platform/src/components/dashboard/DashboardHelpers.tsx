import { type LucideIcon } from 'lucide-react';
import { CockpitCard, Badge } from '../ui';
import { ICON_SIZES } from '../../lib/icons';
import { cn } from '../../lib/utils';

export function QuickStatCard({ label, value, icon: Icon }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}) {
  return (
    <div className={cn(
      'p-4 rounded-none border',
      'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={ICON_SIZES.xl} className="text-secondary" />
        <span className="text-xs text-tertiary uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-primary">{value}</p>
    </div>
  );
}

export function HealthCard({ title, status, details }: {
  title: string;
  status: 'healthy' | 'partial' | 'error';
  details: Array<{ label: string; ok?: boolean; value?: string | number }>;
}) {
  const statusColors = {
    healthy: 'border-[var(--color-status-success)]/30 bg-[var(--color-status-success)]/5',
    partial: 'border-[var(--bb-warning)]/30 bg-[var(--bb-warning)]/5',
    error: 'border-[var(--bb-error)]/30 bg-[var(--bb-error)]/5',
  };

  return (
    <CockpitCard className={statusColors[status]}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-primary">{title}</h3>
        <Badge
          variant="status"
          status={status === 'healthy' ? 'online' : status === 'partial' ? 'warning' : 'offline'}
          size="sm"
        >
          {status === 'healthy' ? 'OK' : status === 'partial' ? 'Parcial' : 'Erro'}
        </Badge>
      </div>
      <div className="space-y-2">
        {details.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-secondary">{d.label}</span>
            {d.ok !== undefined ? (
              <span className={d.ok ? 'text-[var(--color-status-success)]' : 'text-[var(--bb-error)]'}>
                {d.ok ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="inline"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="inline"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
              </span>
            ) : (
              <span className="text-primary font-medium truncate max-w-[120px] text-right">{d.value}</span>
            )}
          </div>
        ))}
      </div>
    </CockpitCard>
  );
}

export function CostProviderRow({ name, cost, tokens, color }: {
  name: string;
  cost: number;
  tokens: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-[var(--aiox-gray-muted)]',
    green: 'bg-[var(--color-status-success)]',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-none glass-subtle">
      <div className="flex items-center gap-3">
        <div className={cn('h-3 w-3 rounded-full', colorClasses[color])} />
        <div>
          <p className="text-primary font-medium">{name}</p>
          <p className="text-xs text-tertiary">{formatNumber(tokens)} tokens</p>
        </div>
      </div>
      <p className="text-xl font-bold text-primary">${cost.toFixed(2)}</p>
    </div>
  );
}

export function ServiceHealthCard({ name, healthy, latency, error }: {
  name: string;
  healthy: boolean;
  latency?: number;
  error?: string;
}) {
  const getErrorDisplay = (err?: string): string => {
    if (!err) return 'Indisponível';
    if (err.includes('401')) return 'API key inválida';
    if (err.includes('429')) return 'Rate limit';
    return err.length > 20 ? err.slice(0, 17) + '...' : err;
  };

  return (
    <div className={cn(
      'p-4 rounded-none border',
      healthy ? 'glass-subtle border-[var(--color-status-success)]/20' : 'glass-subtle border-[var(--bb-error)]/20'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-3 w-3 rounded-full',
            healthy ? 'bg-[var(--color-status-success)]' : 'bg-[var(--bb-error)]'
          )} />
          <span className="text-primary font-medium">{name}</span>
        </div>
        {healthy && latency !== undefined && (
          <span className="text-xs text-tertiary">{latency.toFixed(0)}ms</span>
        )}
      </div>
      {!healthy && error && (
        <p className="text-xs text-[var(--bb-error)] mt-2">{getErrorDisplay(error)}</p>
      )}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
