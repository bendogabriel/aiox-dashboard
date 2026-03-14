import { TrendingUp, TrendingDown } from 'lucide-react';

interface PlatformData {
  name: string;
  investment: string;
  roas: string;
  roasTrend: 'up' | 'down';
  percentage: number;
  color: string;
}

interface PlatformDistributionProps {
  platforms: PlatformData[];
}

const DEFAULT_PLATFORMS: PlatformData[] = [
  { name: 'META ADS', investment: 'R$ 8.200', roas: '4.8x', roasTrend: 'up', percentage: 66, color: '#0099FF' },
  { name: 'GOOGLE ADS', investment: 'R$ 3.100', roas: '3.6x', roasTrend: 'up', percentage: 25, color: '#D1FF00' },
  { name: 'TIKTOK ADS', investment: 'R$ 1.150', roas: '2.1x', roasTrend: 'down', percentage: 9, color: '#ED4609' },
];

export function PlatformDistribution({ platforms = DEFAULT_PLATFORMS }: PlatformDistributionProps) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      {platforms.map((p) => {
        const TrendIcon = p.roasTrend === 'up' ? TrendingUp : TrendingDown;
        const trendColor = p.roasTrend === 'up' ? 'var(--aiox-lime)' : 'var(--color-status-error)';

        return (
          <div
            key={p.name}
            style={{
              padding: '1.25rem',
              background: 'var(--aiox-surface)',
              border: '1px solid rgba(156, 156, 156, 0.12)',
              borderLeft: `3px solid ${p.color}`,
            }}
          >
            {/* Platform name + percentage */}
            <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: p.color,
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--aiox-cream)',
                }}
              >
                {p.percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 3,
                background: 'rgba(156, 156, 156, 0.12)',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${p.percentage}%`,
                  background: p.color,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>

            {/* Investment + ROAS row */}
            <div className="flex items-center justify-between">
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.5rem',
                    color: 'var(--aiox-gray-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                  }}
                >
                  Investimento
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--aiox-cream)',
                  }}
                >
                  {p.investment}
                </span>
              </div>
              <div className="text-right">
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.5rem',
                    color: 'var(--aiox-gray-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                  }}
                >
                  ROAS
                </span>
                <span
                  className="flex items-center gap-1 justify-end"
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: trendColor,
                  }}
                >
                  <TrendIcon size={11} />
                  {p.roas}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
