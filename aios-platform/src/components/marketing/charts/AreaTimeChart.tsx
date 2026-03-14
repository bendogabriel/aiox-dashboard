import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { AIOX_CHART, TOOLTIP_STYLE } from './AioxChartTheme';

interface Series {
  key: string;
  label: string;
  color?: string;
}

interface AreaTimeChartProps {
  data: Record<string, unknown>[];
  series: Series[];
  xAxisKey?: string;
  onSegmentClick?: (payload: Record<string, unknown>) => void;
}

export function AreaTimeChart({
  data,
  series,
  xAxisKey = 'date',
  onSegmentClick,
}: AreaTimeChartProps) {
  return (
    <AreaChart
      data={data}
      onClick={onSegmentClick ? (e: Record<string, unknown>) => {
        const ap = (e as { activePayload?: { payload: Record<string, unknown> }[] })?.activePayload;
        if (ap?.[0]) onSegmentClick(ap[0].payload);
      } : undefined}
      style={{ cursor: onSegmentClick ? 'pointer' : undefined }}
    >
      <defs>
        {series.map((s, i) => {
          const c = s.color ?? AIOX_CHART.palette[i % AIOX_CHART.palette.length];
          return (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={0.3} />
              <stop offset="95%" stopColor={c} stopOpacity={0.02} />
            </linearGradient>
          );
        })}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={AIOX_CHART.colors.grid} vertical={false} />
      <XAxis
        dataKey={xAxisKey}
        tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }}
        axisLine={{ stroke: AIOX_CHART.colors.grid }}
        tickLine={false}
      />
      <YAxis
        tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }}
        axisLine={false}
        tickLine={false}
        width={48}
      />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        labelStyle={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: '0.6rem', color: AIOX_CHART.colors.textBright, marginBottom: 4 }}
      />
      {series.map((s, i) => {
        const c = s.color ?? AIOX_CHART.palette[i % AIOX_CHART.palette.length];
        return (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={c}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            animationDuration={AIOX_CHART.animation.duration}
          />
        );
      })}
    </AreaChart>
  );
}
