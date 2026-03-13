import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '../../lib/utils';

interface LiveMetricCardProps {
  label: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  isLive?: boolean;
  sparkline?: number[];
  format?: 'number' | 'percent' | 'currency' | 'duration';
}

function formatValue(value: number, format: LiveMetricCardProps['format'], prefix?: string, suffix?: string): string {
  let formatted: string;
  switch (format) {
    case 'percent':
      formatted = `${value.toFixed(1)}%`;
      break;
    case 'currency':
      formatted = `$${value.toFixed(2)}`;
      break;
    case 'duration':
      formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
      break;
    default:
      formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
  }
  return `${prefix || ''}${formatted}${suffix || ''}`;
}

// Mini sparkline SVG
function Sparkline({ data, color, height = 24 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="flex-shrink-0" aria-hidden="true">
      {/* Area fill */}
      <polygon points={areaPoints} fill={`${color}15`} />
      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// Display formatted number (no animation)
function AnimatedNumber({ value, format, prefix, suffix }: { value: number; format?: LiveMetricCardProps['format']; prefix?: string; suffix?: string }) {
  return <span>{formatValue(value, format, prefix, suffix)}</span>;
}

export const LiveMetricCard = memo(function LiveMetricCard({
  label,
  value,
  previousValue: _previousValue,
  icon,
  color,
  trend,
  trendValue,
  isLive = false,
  sparkline,
  format = 'number',
  prefix,
  suffix,
}: LiveMetricCardProps) {
  // Detect value change for pulse animation
  const prevRef = useRef(value);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate animation trigger on value change
      setPulsing(true);
      prevRef.current = value;
      const timer = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
  const trendIcon = trend === 'up' ? 'M7 17l5-5 5 5' : trend === 'down' ? 'M7 7l5 5 5-5' : 'M5 12h14';

  return (
    <div
      className={cn(
        'relative rounded-none overflow-hidden p-4 transition-shadow',
        pulsing && 'shadow-lg',
      )}
      style={{
        background: 'var(--color-background-raised, rgba(255,255,255,0.03))',
        border: `1px solid ${pulsing ? `${color}44` : 'var(--glass-border-color, rgba(255,255,255,0.06))'}`,
      }}

    >
      {/* Pulse glow on value change */}
      {pulsing && (
        <div
          className="absolute inset-0 rounded-none"
          style={{ background: `${color}08` }}

        />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Label with live dot */}
          <div className="flex items-center gap-1.5 mb-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `${color}15` }}
            >
              {icon}
            </div>
            <span className="type-label text-secondary font-medium truncate">{label}</span>
            {isLive && (
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#10B981' }}

              />
            )}
          </div>

          {/* Value */}
          <div className="text-xl font-bold text-primary leading-none mb-1">
            <AnimatedNumber value={value} format={format} prefix={prefix} suffix={suffix} />
          </div>

          {/* Trend — always render row for consistent height */}
          <div className="flex items-center gap-1 mt-1.5 min-h-[16px]">
            {trend && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth="2.5">
                <path d={trendIcon} />
              </svg>
            )}
            {trendValue && (
              <span className="text-[10px] font-medium" style={{ color: trendColor }}>
                {trendValue}
              </span>
            )}
          </div>
        </div>

        {/* Sparkline */}
        {sparkline && sparkline.length > 1 && (
          <div className="flex-shrink-0 self-end">
            <Sparkline data={sparkline} color={color} />
          </div>
        )}
      </div>
    </div>
  );
});
