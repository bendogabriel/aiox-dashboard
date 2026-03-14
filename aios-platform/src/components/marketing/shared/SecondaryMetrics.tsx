interface Metric {
  label: string;
  value: string;
}

interface SecondaryMetricsProps {
  metrics: Metric[];
}

export function SecondaryMetrics({ metrics }: SecondaryMetricsProps) {
  return (
    <div
      className="flex flex-wrap gap-0"
      style={{
        border: '1px solid rgba(156, 156, 156, 0.08)',
        background: 'rgba(5, 5, 5, 0.3)',
        marginBottom: '2rem',
      }}
    >
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className="flex items-center gap-2 flex-1 min-w-[100px]"
          style={{
            padding: '0.6rem 1rem',
            borderRight: i < metrics.length - 1 ? '1px solid rgba(156, 156, 156, 0.06)' : undefined,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--aiox-gray-dim)',
            }}
          >
            {m.label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--aiox-cream)',
            }}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
