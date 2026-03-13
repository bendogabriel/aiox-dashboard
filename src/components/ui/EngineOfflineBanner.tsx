import { useEngineStore } from '../../stores/engineStore';

/**
 * Persistent banner shown when the AIOS Engine is offline.
 * Mounts at the top of the layout, above all content.
 * Auto-hides when engine comes back online.
 */
export function EngineOfflineBanner() {
  const { status, error, failCount } = useEngineStore();

  // Only show when offline or error — hide during discovery and when online
  if (status !== 'offline' && status !== 'error') return null;

  const isLongOutage = failCount >= 3;

  return (
    <div
      role="alert"
      style={{
        width: '100%',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '12px',
        fontFamily: 'var(--font-family-mono, monospace)',
        background: isLongOutage
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(245, 158, 11, 0.1)',
        borderBottom: `1px solid ${isLongOutage
          ? 'rgba(239, 68, 68, 0.25)'
          : 'rgba(245, 158, 11, 0.25)'}`,
        color: isLongOutage
          ? 'var(--color-status-error, #EF4444)'
          : 'var(--aiox-warning, #f59e0b)',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <span>
        <strong style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Engine offline
        </strong>
        {' — '}
        {error || 'Engine unreachable'}
        {isLongOutage && (
          <span style={{ opacity: 0.7 }}>
            {' · '}Start with: <code style={{ color: 'var(--aiox-lime, #D1FF00)' }}>npm run engine:dev</code>
          </span>
        )}
      </span>
    </div>
  );
}
