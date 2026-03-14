import { LineChart, Line } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function SparklineChart({
  data,
  color,
  width = 64,
  height = 28,
  trend,
}: SparklineChartProps) {
  const strokeColor = color ?? (trend === 'down' ? '#ED4609' : '#D1FF00');
  const points = data.map((v, i) => ({ v, i }));

  return (
    <LineChart width={width} height={height} data={points}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={strokeColor}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
