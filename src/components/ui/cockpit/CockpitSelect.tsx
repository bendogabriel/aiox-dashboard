import { forwardRef, useId, useState } from 'react'
import { cn } from '../../../lib/utils'
import type { SelectHTMLAttributes } from 'react'

export interface CockpitSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.02em',
  background: 'var(--aiox-surface-deep, #050505)',
  border: '1px solid rgba(156, 156, 156, 0.15)',
  color: 'var(--aiox-cream, #FAF9F6)',
  outline: 'none',
  transition: 'border-color 0.2s',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23696969' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '10px 6px',
  paddingRight: '2rem',
}

const focusColor = 'rgba(209, 255, 0, 0.4)'
const errorColor = 'var(--color-status-error, #FF3B30)'

export const CockpitSelect = forwardRef<HTMLSelectElement, CockpitSelectProps>(
  function CockpitSelect({ label, error, hint, options, placeholder, className, id: externalId, ...props }, ref) {
    const autoId = useId()
    const selectId = externalId || autoId
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`
    const [focused, setFocused] = useState(false)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.625rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aiox-gray-dim)',
              fontWeight: 500,
            }}
          >
            {label}
            {props.required && <span style={{ color: errorColor, marginLeft: 2 }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('w-full px-4', className)}
          style={{
            ...selectStyle,
            minHeight: '44px',
            borderColor: error
              ? errorColor
              : focused
                ? focusColor
                : 'rgba(156, 156, 156, 0.15)',
            boxShadow: focused && !error ? `0 0 0 1px var(--aiox-lime)` : undefined,
          }}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(error && errorId, hint && !error && hintId) || undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled style={{ color: 'var(--aiox-gray-dim)' }}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span
            id={errorId}
            role="alert"
            style={{ fontSize: '0.5rem', color: errorColor, fontFamily: 'var(--font-family-mono)' }}
          >
            {error}
          </span>
        )}
        {hint && !error && (
          <span
            id={hintId}
            style={{ fontSize: '0.5rem', color: 'var(--aiox-gray-dim)', fontFamily: 'var(--font-family-mono)' }}
          >
            {hint}
          </span>
        )}
      </div>
    )
  }
)

CockpitSelect.displayName = 'CockpitSelect'
