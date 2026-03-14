import { cn } from '../../../lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { SparklineChart } from '../charts';

export interface MarketingKpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
  className?: string;
  compact?: boolean;
  sparkline?: number[];
}

export function MarketingKpiCard({
  label,
  value,
  change,
  changeValue,
  trend: trendProp,
  icon: Icon,
  prefix,
  suffix,
  className,
  compact = false,
  sparkline,
}: MarketingKpiCardProps) {
  // Auto-detect trend from changeValue if not explicitly set
  const trend = trendProp ?? (changeValue != null ? (changeValue > 0 ? 'up' : changeValue < 0 ? 'down' : 'neutral') : 'neutral');

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const trendColor = {
    up: 'var(--aiox-lime)',
    down: 'var(--color-status-error)',
    neutral: 'var(--aiox-gray-dim)',
  }[trend];

  return (
    <div
      className={cn('group relative', className)}
      style={{
        padding: compact ? '0.75rem 1rem' : '1.25rem',
        background: 'var(--aiox-surface)',
        border: '1px solid rgba(156, 156, 156, 0.12)',
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? '0.75rem' : '0.5rem',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Icon */}
      {Icon && !compact && (
        <span
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(209, 255, 0, 0.06)',
            border: '1px solid rgba(209, 255, 0, 0.12)',
          }}
        >
          <Icon size={14} style={{ color: 'var(--aiox-lime)' }} />
        </span>
      )}

      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: compact ? '0.6rem' : '0.5rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--aiox-gray-muted)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: compact ? '1.25rem' : '1.75rem',
          fontWeight: 700,
          color: 'var(--aiox-cream)',
          lineHeight: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          flex: compact ? 1 : undefined,
        }}
      >
        {prefix}{value}{suffix}
      </span>

      {/* Trend + Sparkline row */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        {change && (
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.6rem',
              color: trendColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <TrendIcon size={10} />
            {change}
          </span>
        )}
        {sparkline && sparkline.length > 1 && (
          <SparklineChart data={sparkline} trend={trend} width={56} height={22} />
        )}
      </div>
    </div>
  );
}
