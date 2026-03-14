import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis,
  ReferenceLine,
} from 'recharts';
import { AIOX_CHART, TOOLTIP_STYLE } from './AioxChartTheme';

interface ScatterBubbleChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  sizeKey?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  showAverageLines?: boolean;
  onPointClick?: (payload: Record<string, unknown>) => void;
}

export function ScatterBubbleChart({
  data,
  xKey,
  yKey,
  sizeKey,
  xLabel,
  yLabel,
  color = AIOX_CHART.colors.primary,
  showAverageLines = true,
  onPointClick,
}: ScatterBubbleChartProps) {
  const avgX = data.length > 0
    ? data.reduce((s, d) => s + (Number(d[xKey]) || 0), 0) / data.length
    : 0;
  const avgY = data.length > 0
    ? data.reduce((s, d) => s + (Number(d[yKey]) || 0), 0) / data.length
    : 0;

  return (
    <ScatterChart
      onClick={onPointClick ? (e: Record<string, unknown>) => {
        const ap = (e as { activePayload?: { payload: Record<string, unknown> }[] })?.activePayload;
        if (ap?.[0]) onPointClick(ap[0].payload);
      } : undefined}
      style={{ cursor: onPointClick ? 'pointer' : undefined }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={AIOX_CHART.colors.grid} />
      <XAxis
        type="number"
        dataKey={xKey}
        name={xLabel ?? xKey}
        tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }}
        axisLine={{ stroke: AIOX_CHART.colors.grid }}
        tickLine={false}
        label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -5, style: { fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text, textTransform: 'uppercase' } } : undefined}
      />
      <YAxis
        type="number"
        dataKey={yKey}
        name={yLabel ?? yKey}
        tick={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text }}
        axisLine={false}
        tickLine={false}
        width={48}
        label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontFamily: AIOX_CHART.fonts.mono, fontSize: 10, fill: AIOX_CHART.colors.text, textTransform: 'uppercase' } } : undefined}
      />
      {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[40, 400]} />}
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      {showAverageLines && (
        <>
          <ReferenceLine x={avgX} stroke={AIOX_CHART.colors.text} strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={avgY} stroke={AIOX_CHART.colors.text} strokeDasharray="3 3" strokeOpacity={0.4} />
        </>
      )}
      <Scatter
        data={data}
        fill={color}
        fillOpacity={0.7}
        animationDuration={AIOX_CHART.animation.duration}
      />
    </ScatterChart>
  );
}
