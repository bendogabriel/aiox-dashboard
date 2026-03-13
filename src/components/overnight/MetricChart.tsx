import { useMemo } from 'react';
import type { Experiment } from '../../types/overnight';

interface MetricChartProps {
  experiments: Experiment[];
  baseline: number | null;
  bestMetric: number | null;
  height?: number;
}

export default function MetricChart({ experiments, baseline, bestMetric, height = 120 }: MetricChartProps) {
  const chartData = useMemo(() => {
    const points = experiments
      .filter((e) => e.metricAfter !== null)
      .map((e) => ({
        iteration: e.iteration,
        value: e.metricAfter!,
        status: e.status,
      }));

    if (points.length === 0) return null;

    const allValues = [
      ...points.map((p) => p.value),
      ...(baseline !== null ? [baseline] : []),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const padding = range * 0.1;

    return {
      points,
      min: min - padding,
      max: max + padding,
      range: range + padding * 2,
    };
  }, [experiments, baseline]);

  if (!chartData) {
    return (
      <div
        className="flex items-center justify-center text-tertiary text-sm"
        style={{ height }}
      >
        Sem dados de metrica
      </div>
    );
  }

  const width = 400;
  const { points, min, range } = chartData;

  const xStep = points.length > 1 ? width / (points.length - 1) : width / 2;
  const yScale = (v: number) => height - ((v - min) / range) * height;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * xStep} ${yScale(p.value)}`)
    .join(' ');

  const areaPath = `${linePath} L ${(points.length - 1) * xStep} ${height} L 0 ${height} Z`;

  const baselineY = baseline !== null ? yScale(baseline) : null;
  const bestY = bestMetric !== null ? yScale(bestMetric) : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {/* Area fill */}
      <path
        d={areaPath}
        fill="url(#metricGradient)"
      />

      {/* Baseline */}
      {baselineY !== null && (
        <line
          x1={0}
          y1={baselineY}
          x2={width}
          y2={baselineY}
          stroke="var(--color-text-tertiary)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      )}

      {/* Best metric line */}
      {bestY !== null && (
        <line
          x1={0}
          y1={bestY}
          x2={width}
          y2={bestY}
          stroke="var(--color-success, #4ADE80)"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.6}
        />
      )}

      {/* Main line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-primary, #D1FF00)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={p.iteration}
          cx={i * xStep}
          cy={yScale(p.value)}
          r={3}
          fill={
            p.status === 'keep'
              ? 'var(--color-success, #4ADE80)'
              : p.status === 'error'
                ? 'var(--color-error, #EF4444)'
                : 'var(--color-text-tertiary)'
          }
          stroke="var(--color-bg-primary, #050505)"
          strokeWidth={1.5}
        />
      ))}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary, #D1FF00)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--color-primary, #D1FF00)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}
