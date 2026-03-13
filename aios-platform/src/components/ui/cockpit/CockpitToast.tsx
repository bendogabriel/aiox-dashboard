import { useEffect, useRef } from 'react'
import { cn } from '../../../lib/utils'
import type { HTMLAttributes } from 'react'

export interface CockpitToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  onClose?: () => void
  duration?: number
  action?: { label: string; onClick: () => void }
}

const variantBorderColors: Record<CockpitToastProps['variant'], string> = {
  success: 'var(--aiox-lime)',
  error: 'var(--color-status-error, #EF4444)',
  warning: '#f59e0b',
  info: 'var(--aiox-blue, #0099FF)',
}

const variantBgTints: Record<CockpitToastProps['variant'], string> = {
  success: 'rgba(209, 255, 0, 0.04)',
  error: 'rgba(239, 68, 68, 0.04)',
  warning: 'rgba(245, 158, 11, 0.04)',
  info: 'rgba(0, 153, 255, 0.04)',
}

export function CockpitToast({
  variant,
  title,
  description,
  onClose,
  duration = 5000,
  action,
  className,
  style,
  ...props
}: CockpitToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (duration > 0 && onClose) {
      timerRef.current = setTimeout(onClose, duration)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [duration, onClose])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(className)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        paddingRight: '2.5rem',
        background: variantBgTints[variant],
        borderLeft: `3px solid ${variantBorderColors[variant]}`,
        border: '1px solid rgba(156, 156, 156, 0.15)',
        borderLeftWidth: '3px',
        borderLeftColor: variantBorderColors[variant],
        fontFamily: 'var(--font-family-mono)',
        minWidth: '300px',
        maxWidth: '420px',
        ...style,
      }}
      {...props}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--aiox-cream, #FAF9F6)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              fontSize: '0.675rem',
              color: 'var(--aiox-gray-muted, #999999)',
              margin: 0,
              marginTop: '0.25rem',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.3rem 0.75rem',
              fontSize: '0.55rem',
              fontFamily: 'var(--font-family-mono)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aiox-lime, #D1FF00)',
              background: 'rgba(209, 255, 0, 0.08)',
              border: '1px solid rgba(209, 255, 0, 0.2)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          style={{
            position: 'absolute',
            top: '0.625rem',
            right: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.25rem',
            height: '1.25rem',
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--aiox-gray-dim, #696969)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-family-mono)',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
        >
          &#x2715;
        </button>
      )}
    </div>
  )
}
