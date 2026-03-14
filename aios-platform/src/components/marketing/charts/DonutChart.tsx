import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AIOX_CHART, TOOLTIP_STYLE } from './AioxChartTheme';

interface DonutSlice {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string;
  onSliceClick?: (entry: DonutSlice) => void;
}

export function DonutChart({
  data,
  innerRadius = 60,
  outerRadius = 90,
  centerLabel,
  centerValue,
  onSliceClick,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: outerRadius * 2 + 20, height: outerRadius * 2 + 20, flexShrink: 0 }}>
        <PieChart width={outerRadius * 2 + 20} height={outerRadius * 2 + 20}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            stroke="none"
            animationDuration={AIOX_CHART.animation.duration}
            onClick={onSliceClick ? (_, idx) => onSliceClick(data[idx]) : undefined}
            style={{ cursor: onSliceClick ? 'pointer' : undefined }}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color ?? AIOX_CHART.palette[i % AIOX_CHART.palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
        {/* Center label */}
        {(centerLabel || centerValue) && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            {centerValue && (
              <span style={{ fontFamily: AIOX_CHART.fonts.display, fontSize: '1.25rem', fontWeight: 700, color: AIOX_CHART.colors.cream }}>
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span style={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: AIOX_CHART.colors.text }}>
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {data.map((entry, i) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, background: entry.color ?? AIOX_CHART.palette[i % AIOX_CHART.palette.length], flexShrink: 0 }} />
              <span style={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: '0.6rem', color: AIOX_CHART.colors.textBright, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name}
              </span>
              <span style={{ fontFamily: AIOX_CHART.fonts.display, fontSize: '0.7rem', fontWeight: 700, color: AIOX_CHART.colors.cream, flexShrink: 0 }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
