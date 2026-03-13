import { forwardRef, useId, useState } from 'react'
import { cn } from '../../../lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export interface CockpitInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.02em',
  background: 'var(--aiox-surface-deep, #050505)',
  border: '1px solid rgba(156, 156, 156, 0.15)',
  color: 'var(--aiox-cream, #FAF9F6)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const focusColor = 'rgba(209, 255, 0, 0.4)'
const errorColor = 'var(--color-status-error, #FF3B30)'

export const CockpitInput = forwardRef<HTMLInputElement, CockpitInputProps>(
  function CockpitInput({ label, error, hint, leftIcon, className, id: externalId, ...props }, ref) {
    const autoId = useId()
    const inputId = externalId || autoId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const [focused, setFocused] = useState(false)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
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
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 pointer-events-none"
              style={{ color: 'var(--aiox-gray-dim)' }}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn('w-full px-4', leftIcon && 'pl-10', className)}
            style={{
              ...inputStyle,
              minHeight: '44px',
              borderColor: error
                ? errorColor
                : focused
                  ? focusColor
                  : 'rgba(156, 156, 156, 0.15)',
              boxShadow: focused && !error ? '0 0 0 1px var(--aiox-lime)' : undefined,
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
          />
        </div>
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

CockpitInput.displayName = 'CockpitInput'

export interface CockpitTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const CockpitTextarea = forwardRef<HTMLTextAreaElement, CockpitTextareaProps>(
  function CockpitTextarea({ label, error, hint, className, id: externalId, ...props }, ref) {
    const autoId = useId()
    const inputId = externalId || autoId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const [focused, setFocused] = useState(false)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
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
        <textarea
          ref={ref}
          id={inputId}
          className={cn('w-full min-h-[80px] resize-none', className)}
          style={{
            ...inputStyle,
            padding: '0.75rem 1rem',
            borderColor: error
              ? errorColor
              : focused
                ? focusColor
                : 'rgba(156, 156, 156, 0.15)',
            boxShadow: focused && !error ? '0 0 0 1px var(--aiox-lime)' : undefined,
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
        />
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

CockpitTextarea.displayName = 'CockpitTextarea'
