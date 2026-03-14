import { AIOX_CHART } from './AioxChartTheme';

interface FunnelStep {
  label: string;
  value: number;
  formatted?: string;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  height?: number;
}

export function FunnelChart({ steps, height = 280 }: FunnelChartProps) {
  if (steps.length === 0) return null;
  const max = steps[0].value;
  const stepHeight = height / steps.length;

  return (
    <div style={{ width: '100%', height }}>
      {steps.map((step, i) => {
        const widthPct = max > 0 ? (step.value / max) * 100 : 0;
        const convRate = i > 0 && steps[i - 1].value > 0
          ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
          : null;
        const opacity = 0.4 + (1 - i / steps.length) * 0.6;

        return (
          <div key={step.label} className="flex items-center gap-3" style={{ height: stepHeight }}>
            {/* Label */}
            <div style={{ width: 90, flexShrink: 0, textAlign: 'right' }}>
              <span style={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: '0.6rem', color: AIOX_CHART.colors.textBright, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {step.label}
              </span>
            </div>
            {/* Bar */}
            <div className="flex-1 flex items-center" style={{ height: Math.max(stepHeight - 8, 12) }}>
              <div
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: AIOX_CHART.colors.primary,
                  opacity,
                  transition: 'width 0.6s ease, opacity 0.3s',
                  minWidth: 2,
                }}
              />
            </div>
            {/* Value + conversion rate */}
            <div style={{ width: 80, flexShrink: 0 }}>
              <span style={{ fontFamily: AIOX_CHART.fonts.display, fontSize: '0.85rem', fontWeight: 700, color: AIOX_CHART.colors.cream, display: 'block' }}>
                {step.formatted ?? step.value.toLocaleString()}
              </span>
              {convRate && (
                <span style={{ fontFamily: AIOX_CHART.fonts.mono, fontSize: '0.5rem', color: AIOX_CHART.colors.text }}>
                  {convRate}% conv.
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
