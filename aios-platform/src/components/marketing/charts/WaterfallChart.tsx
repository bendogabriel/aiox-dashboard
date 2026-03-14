import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { AIOX_CHART, TOOLTIP_STYLE, formatBRL } from './AioxChartTheme';

interface WaterfallEntry {
  name: string;
  value: number;
  isTotal?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallEntry[];
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  // Compute running total and base for each bar
  let running = 0;
  const chartData = data.map((d) => {
    if (d.isTotal) {
      const result = { name: d.name, base: 0, value: d.value, raw: d.value, isTotal: true };
      running = d.value;
      return result;
    }
    const base = running;
    running += d.value;
    return {
      name: d.name,
      base: d.value >= 0 ? base : base + d.value,
      value: Math.abs(d.value),
      raw: d.value,
      isTotal: false,
    };
  });

  return (
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" stroke={AIOX_CHART.colors.grid} vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }}
        axisLine={{ stroke: AIOX_CHART.colors.grid }}
        tickLine={false}
      />
      <YAxis
        tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }}
        axisLine={false}
        tickLine={false}
        width={56}
        tickFormatter={(v: number) => formatBRL(v)}
      />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        formatter={(_, __, props) => {
          const raw = props.payload.raw as number;
          return [formatBRL(raw), raw >= 0 ? 'Entrada' : 'Saida'];
        }}
      />
      <ReferenceLine y={0} stroke={AIOX_CHART.colors.grid} />
      {/* Invisible base bar */}
      <Bar dataKey="base" stackId="stack" fill="transparent" isAnimationActive={false} />
      {/* Visible value bar */}
      <Bar dataKey="value" stackId="stack" animationDuration={AIOX_CHART.animation.duration} radius={0}>
        {chartData.map((entry) => (
          <Cell
            key={entry.name}
            fill={entry.isTotal ? AIOX_CHART.colors.secondary : entry.raw >= 0 ? AIOX_CHART.colors.primary : AIOX_CHART.colors.tertiary}
          />
        ))}
      </Bar>
    </BarChart>
  );
}
