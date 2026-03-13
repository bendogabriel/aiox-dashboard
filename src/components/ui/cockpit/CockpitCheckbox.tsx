import { forwardRef, useId } from 'react'
import { cn } from '../../../lib/utils'
import type { InputHTMLAttributes } from 'react'

export interface CockpitCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
}

const errorColor = 'var(--color-status-error, #FF3B30)'

export const CockpitCheckbox = forwardRef<HTMLInputElement, CockpitCheckboxProps>(
  function CockpitCheckbox({ label, description, error, className, id: externalId, checked, ...props }, ref) {
    const autoId = useId()
    const inputId = externalId || autoId
    const errorId = `${inputId}-error`
    const descId = `${inputId}-desc`

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={inputId}
          className="flex items-start gap-3"
          style={{ cursor: props.disabled ? 'not-allowed' : 'pointer' }}
        >
          <span className="relative flex-shrink-0" style={{ width: 18, height: 18, marginTop: 1 }}>
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              checked={checked}
              className="sr-only peer"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={
                cn(error && errorId, description && descId) || undefined
              }
              {...props}
            />
            <span
              style={{
                display: 'block',
                width: 18,
                height: 18,
                background: checked
                  ? 'var(--aiox-lime, #D1FF00)'
                  : 'var(--aiox-surface-deep, #050505)',
                border: `1px solid ${
                  error
                    ? errorColor
                    : checked
                      ? 'var(--aiox-lime, #D1FF00)'
                      : 'rgba(156, 156, 156, 0.15)'
                }`,
                transition: 'all 0.15s ease',
                opacity: props.disabled ? 0.4 : 1,
              }}
              aria-hidden="true"
            >
              {checked && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  style={{ display: 'block' }}
                >
                  <path
                    d="M4 9L7.5 12.5L14 6"
                    stroke="var(--aiox-dark, #050505)"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              )}
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.625rem',
                color: 'var(--aiox-cream, #FAF9F6)',
                letterSpacing: '0.02em',
                opacity: props.disabled ? 0.4 : 1,
              }}
            >
              {label}
            </span>
            {description && (
              <span
                id={descId}
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.5rem',
                  color: 'var(--aiox-gray-dim)',
                  letterSpacing: '0.02em',
                }}
              >
                {description}
              </span>
            )}
          </span>
        </label>
        {error && (
          <span
            id={errorId}
            role="alert"
            style={{
              fontSize: '0.5rem',
              color: errorColor,
              fontFamily: 'var(--font-family-mono)',
              marginLeft: 30,
            }}
          >
            {error}
          </span>
        )}
      </div>
    )
  }
)

CockpitCheckbox.displayName = 'CockpitCheckbox'
