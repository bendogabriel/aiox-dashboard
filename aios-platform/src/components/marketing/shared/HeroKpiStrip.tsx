import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SparklineChart } from '../charts';

export interface HeroKpi {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface HeroKpiStripProps {
  kpis: HeroKpi[];
  /** Optional sparkline data arrays, one per KPI (same order) */
  sparklines?: number[][];
}

export function HeroKpiStrip({ kpis, sparklines }: HeroKpiStripProps) {
  return (
    <div
      className="flex overflow-x-auto gap-0"
      style={{
        border: '1px solid rgba(156, 156, 156, 0.12)',
        background: 'var(--aiox-surface)',
        marginBottom: '2rem',
      }}
    >
      {kpis.map((kpi, i) => {
        const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
        const trendColor =
          kpi.trend === 'up' ? 'var(--aiox-lime)' : kpi.trend === 'down' ? 'var(--color-status-error)' : 'var(--aiox-gray-dim)';

        return (
          <div
            key={kpi.label}
            className="flex-1 min-w-[120px]"
            style={{
              padding: '1rem 1.25rem',
              borderRight: i < kpis.length - 1 ? '1px solid rgba(156, 156, 156, 0.08)' : undefined,
            }}
          >
            {/* Label */}
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.5rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--aiox-gray-muted)',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              {kpi.label}
            </span>
            {/* Value */}
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--aiox-cream)',
                lineHeight: 1,
                display: 'block',
              }}
            >
              {kpi.value}
            </span>
            {/* Trend + Sparkline */}
            <div className="flex items-center gap-2" style={{ marginTop: '0.3rem' }}>
              {kpi.change && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.55rem',
                    color: trendColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <TrendIcon size={9} />
                  {kpi.change}
                </span>
              )}
              {sparklines?.[i] && sparklines[i].length > 1 && (
                <SparklineChart data={sparklines[i]} trend={kpi.trend} width={48} height={20} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
