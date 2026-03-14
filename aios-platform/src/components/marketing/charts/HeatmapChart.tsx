import { AIOX_CHART } from './AioxChartTheme';

interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  rows: string[];
  cols: string[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function HeatmapChart({
  data,
  rows,
  cols,
  height,
  formatValue = (v) => v.toFixed(0),
}: HeatmapChartProps) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const cellMap = new Map<string, number>();
  for (const d of data) {
    cellMap.set(`${d.row}:${d.col}`, d.value);
  }

  const cellSize = height ? (height - 30) / rows.length : 32;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: 72 }} />
            {cols.map((col) => (
              <th
                key={col}
                style={{
                  fontFamily: AIOX_CHART.fonts.mono,
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: AIOX_CHART.colors.text,
                  padding: '0.35rem 0.25rem',
                  textAlign: 'center',
                  minWidth: cellSize,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td
                style={{
                  fontFamily: AIOX_CHART.fonts.mono,
                  fontSize: '0.55rem',
                  color: AIOX_CHART.colors.textBright,
                  padding: '0 0.5rem 0 0',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {row}
              </td>
              {cols.map((col) => {
                const val = cellMap.get(`${row}:${col}`) ?? 0;
                const intensity = (val - min) / range;
                return (
                  <td
                    key={col}
                    title={`${row} x ${col}: ${formatValue(val)}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: `rgba(209, 255, 0, ${0.05 + intensity * 0.65})`,
                      border: '1px solid rgba(156, 156, 156, 0.06)',
                      textAlign: 'center',
                      fontFamily: AIOX_CHART.fonts.mono,
                      fontSize: '0.45rem',
                      color: intensity > 0.5 ? '#050505' : AIOX_CHART.colors.text,
                      fontWeight: intensity > 0.5 ? 700 : 400,
                    }}
                  >
                    {formatValue(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
