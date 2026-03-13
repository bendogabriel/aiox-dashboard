import { cn } from '../../../lib/utils'
import type { HTMLAttributes } from 'react'

export interface CockpitProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
  animated?: boolean
}

const sizeHeights: Record<string, number> = {
  sm: 2,
  md: 6,
  lg: 8,
}

const variantColors: Record<string, string> = {
  default: 'var(--aiox-lime, #D1FF00)',
  success: 'var(--aiox-lime, #D1FF00)',
  warning: '#f59e0b',
  error: 'var(--color-status-error, #EF4444)',
}

const variantGlows: Record<string, string> = {
  default: '0 0 8px rgba(209, 255, 0, 0.4)',
  success: '0 0 8px rgba(209, 255, 0, 0.4)',
  warning: '0 0 8px rgba(245, 158, 11, 0.4)',
  error: '0 0 8px rgba(239, 68, 68, 0.4)',
}

export function CockpitProgress({
  value,
  size = 'md',
  label,
  showValue = false,
  variant = 'default',
  animated = false,
  className,
  style,
  ...props
}: CockpitProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const isComplete = clamped >= 100
  const height = sizeHeights[size]

  return (
    <div className={cn(className)} style={{ width: '100%', ...style }} {...props}>
      {/* Label row */}
      {(label || showValue) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.375rem',
          }}
        >
          {label && (
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.625rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--aiox-gray-muted, #999999)',
              }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.55rem',
                fontWeight: 500,
                color: 'var(--aiox-gray-dim, #696969)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        style={{
          position: 'relative',
          width: '100%',
          height,
          background: 'rgba(156, 156, 156, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${clamped}%`,
            background: variantColors[variant],
            boxShadow: isComplete ? variantGlows[variant] : 'none',
            transition: animated ? 'width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
        />
      </div>
    </div>
  )
}
