import { ResponsiveContainer } from 'recharts';
import { isValidElement, type ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  empty?: boolean;
  /** Set to true for custom HTML children (FunnelChart, HeatmapChart) that are not recharts elements */
  raw?: boolean;
  children: ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  height = 300,
  loading = false,
  empty = false,
  raw = false,
  children,
}: ChartContainerProps) {
  return (
    <div
      style={{
        background: 'var(--aiox-surface)',
        border: '1px solid rgba(156, 156, 156, 0.12)',
        padding: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.55rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--aiox-lime)',
            display: 'block',
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              color: 'var(--aiox-gray-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginTop: '0.15rem',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center" style={{ height }}>
          <div
            className="w-6 h-6 border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--aiox-lime)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && empty && (
        <div className="flex items-center justify-center" style={{ height }}>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.6rem',
              color: 'var(--aiox-gray-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Sem dados para o periodo
          </span>
        </div>
      )}

      {/* Chart — raw mode skips ResponsiveContainer for custom HTML components */}
      {!loading && !empty && (
        raw ? (
          <div style={{ width: '100%', height }}>{children}</div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {children as React.ReactElement}
          </ResponsiveContainer>
        )
      )}
    </div>
  );
}
