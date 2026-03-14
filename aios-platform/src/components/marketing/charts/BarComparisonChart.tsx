import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { AIOX_CHART, TOOLTIP_STYLE } from './AioxChartTheme';

interface BarDef {
  key: string;
  label: string;
  color?: string;
}

interface BarComparisonChartProps {
  data: Record<string, unknown>[];
  bars: BarDef[];
  categoryKey?: string;
  layout?: 'horizontal' | 'vertical';
  onBarClick?: (payload: Record<string, unknown>) => void;
}

export function BarComparisonChart({
  data,
  bars,
  categoryKey = 'name',
  layout = 'vertical',
  onBarClick,
}: BarComparisonChartProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <BarChart
      data={data}
      layout={isHorizontal ? 'vertical' : 'horizontal'}
      onClick={onBarClick ? (e: Record<string, unknown>) => {
        const ap = (e as { activePayload?: { payload: Record<string, unknown> }[] })?.activePayload;
        if (ap?.[0]) onBarClick(ap[0].payload);
      } : undefined}
      style={{ cursor: onBarClick ? 'pointer' : undefined }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={AIOX_CHART.colors.grid} horizontal={!isHorizontal} vertical={isHorizontal} />
      {isHorizontal ? (
        <>
          <XAxis type="number" tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey={categoryKey} tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.textBright }} axisLine={false} tickLine={false} width={80} />
        </>
      ) : (
        <>
          <XAxis dataKey={categoryKey} tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }} axisLine={{ stroke: AIOX_CHART.colors.grid }} tickLine={false} />
          <YAxis tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }} axisLine={false} tickLine={false} width={48} />
        </>
      )}
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      {bars.map((b, i) => {
        const c = b.color ?? AIOX_CHART.palette[i % AIOX_CHART.palette.length];
        return (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label}
            fill={c}
            animationDuration={AIOX_CHART.animation.duration}
            radius={0}
          >
            {!b.color && data.map((_, idx) => (
              <Cell key={idx} fill={AIOX_CHART.palette[idx % AIOX_CHART.palette.length]} />
            ))}
          </Bar>
        );
      })}
    </BarChart>
  );
}
