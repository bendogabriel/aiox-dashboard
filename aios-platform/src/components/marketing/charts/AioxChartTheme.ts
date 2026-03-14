/** AIOX Cockpit theme constants for recharts */

export const AIOX_CHART = {
  colors: {
    primary: '#D1FF00',
    secondary: '#0099FF',
    tertiary: '#ED4609',
    warning: '#f59e0b',
    error: '#EF4444',
    surface: '#1A1A1A',
    grid: '#2A2A2A',
    text: '#999999',
    textBright: '#BDBDBD',
    cream: '#F5F5F0',
  },
  palette: ['#D1FF00', '#0099FF', '#ED4609', '#f59e0b', '#EF4444', '#a8cc00', '#3DB2FF'],
  fonts: {
    mono: "'Roboto Mono', monospace",
    display: "'TASAOrbiterDisplay', sans-serif",
  },
  animation: { duration: 600, easing: 'ease-out' as const },
  tooltip: { bg: '#0D0D0D', border: '#2A2A2A', radius: 0 },
} as const;

/** Shared recharts tooltip style */
export const TOOLTIP_STYLE: React.CSSProperties = {
  background: AIOX_CHART.tooltip.bg,
  border: `1px solid ${AIOX_CHART.tooltip.border}`,
  borderRadius: 0,
  fontFamily: AIOX_CHART.fonts.mono,
  fontSize: '0.65rem',
  color: AIOX_CHART.colors.cream,
  padding: '0.5rem 0.75rem',
};

/** Format number to compact BRL string */
export function formatBRL(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return `R$ ${value.toFixed(0)}`;
}

/** Format number to compact string */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}
