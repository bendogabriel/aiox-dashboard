interface SectionNumberProps {
  number: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function SectionNumber({ number, title, subtitle, children }: SectionNumberProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          {/* Large section number */}
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--aiox-lime)',
              lineHeight: 1,
              opacity: 0.4,
            }}
          >
            {number}
          </span>
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--aiox-cream)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--aiox-gray-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '0.15rem',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
      </div>
      {/* Divider line */}
      <div
        style={{
          height: 1,
          background: 'linear-gradient(90deg, var(--aiox-lime) 0%, rgba(209,255,0,0.08) 100%)',
          marginTop: '0.75rem',
        }}
      />
    </div>
  );
}
