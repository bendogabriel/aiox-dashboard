import { forwardRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

export interface CockpitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'default' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const CockpitButton = forwardRef<HTMLButtonElement, CockpitButtonProps>(
  function CockpitButton(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading
    const [focused, setFocused] = useState(false)

    const base: React.CSSProperties = {
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontFamily: 'var(--font-family-mono)',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      border: 'none',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
      textDecoration: 'none',
      opacity: isDisabled ? 0.4 : 1,
      pointerEvents: isDisabled ? 'none' : 'auto',
      outline: 'none',
      boxShadow: focused && !isDisabled ? '0 0 0 1px var(--aiox-lime, #D1FF00)' : undefined,
    }

    const sizes: Record<string, React.CSSProperties> = {
      sm: { padding: '0.65rem 1rem', fontSize: '0.55rem', minHeight: '44px' },
      md: { padding: '0.65rem 1.5rem', fontSize: '0.65rem', minHeight: '44px' },
      lg: { padding: '0.85rem 2rem', fontSize: '0.7rem', minHeight: '48px' },
      icon: { padding: '0.5rem', fontSize: '0.65rem', width: '2.75rem', height: '2.75rem', minHeight: '44px' },
    }

    const variants: Record<string, React.CSSProperties> = {
      primary: { background: 'var(--aiox-lime)', color: 'var(--aiox-dark)' },
      secondary: { background: 'transparent', color: 'var(--aiox-cream)', border: '1px solid rgba(156, 156, 156, 0.15)' },
      ghost: { background: 'transparent', color: 'var(--aiox-gray-dim)' },
      destructive: { background: 'var(--color-status-error)', color: 'white' },
      default: { background: 'transparent', color: 'var(--aiox-cream)', border: '1px solid rgba(156, 156, 156, 0.15)' },
      danger: { background: 'var(--color-status-error)', color: 'white' },
      outline: { background: 'transparent', color: 'var(--aiox-cream)', border: '1px solid rgba(156, 156, 156, 0.25)' },
    }

    return (
      <button
        ref={ref}
        className={cn('inline-flex', className)}
        style={{ ...base, ...sizes[size], ...variants[variant] }}
        disabled={isDisabled}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        {...props}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: '2px solid currentColor',
                borderRightColor: 'transparent',
                borderRadius: '50%',
                animation: 'aiox-spin 0.6s linear infinite',
              }}
            />
            <span className="sr-only">Carregando</span>
          </>
        ) : (
          <>
            {leftIcon && <span style={{ flexShrink: 0, display: 'flex' }} aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span style={{ flexShrink: 0, display: 'flex' }} aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

CockpitButton.displayName = 'CockpitButton'
