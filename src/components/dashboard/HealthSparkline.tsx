/**
 * HealthSparkline — P8 Mini health timeline
 *
 * Renders a compact SVG sparkline showing recent health status.
 * Each point is a colored dot: lime = healthy, red = down, amber = partial.
 */

import type { SparklinePoint } from '../../stores/healthMonitorStore';

interface HealthSparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  maxPoints?: number;
}

export function HealthSparkline({
  data,
  width = 72,
  height = 12,
  maxPoints = 24,
}: HealthSparklineProps) {
  if (data.length === 0) {
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="2,3"
        />
      </svg>
    );
  }

  const points = data.slice(-maxPoints);
  const step = points.length > 1 ? width / (points.length - 1) : width / 2;
  const cy = height / 2;
  const r = Math.min(2.5, height / 4);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Connection line */}
      {points.length > 1 && (
        <polyline
          points={points.map((_, i) => `${i * step},${cy}`).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      )}
      {/* Data points */}
      {points.map((point, i) => (
        <circle
          key={point.timestamp}
          cx={points.length === 1 ? width / 2 : i * step}
          cy={cy}
          r={r}
          fill={point.ok ? 'var(--color-status-success, #4ADE80)' : 'var(--color-status-error, #EF4444)'}
          opacity={point.ok ? 0.8 : 1}
        />
      ))}
    </svg>
  );
}
