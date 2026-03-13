import { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import type { HTMLAttributes } from 'react'

export interface CockpitCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated'
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accentBorder?: 'left' | 'top' | 'none'
  accentColor?: string
  accent?: string
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
}

export const CockpitCard = forwardRef<HTMLDivElement, CockpitCardProps>(
  function CockpitCard(
    {
      variant = 'default',
      interactive = false,
      padding = 'md',
      accentBorder = 'none',
      accentColor,
      accent,
      className,
      style,
      children,
      ...props
    },
    ref
  ) {
    const variantStyles: React.CSSProperties =
      variant === 'elevated'
        ? {
            background: 'var(--aiox-surface, #0a0a0a)',
            border: '1px solid rgba(156, 156, 156, 0.15)',
          }
        : variant === 'subtle'
          ? {
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(156, 156, 156, 0.08)',
            }
          : {
              background: 'var(--aiox-surface-deep, #050505)',
              border: '1px solid rgba(156, 156, 156, 0.12)',
            }

    const accentStyles: React.CSSProperties =
      accentBorder === 'left'
        ? {
            borderLeftWidth: '3px',
            borderLeftColor: accentColor || accent || 'var(--aiox-lime)',
          }
        : accentBorder === 'top'
          ? {
              borderTopWidth: '3px',
              borderTopColor: accentColor || accent || 'var(--aiox-lime)',
            }
          : {}

    return (
      <div
        ref={ref}
        className={cn(
          paddingMap[padding],
          interactive && 'cursor-pointer transition-all duration-300 hover:border-[rgba(209,255,0,0.2)] hover:-translate-y-0.5',
          className
        )}
        style={{
          ...variantStyles,
          ...accentStyles,
          fontFamily: 'var(--font-family-mono)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CockpitCard.displayName = 'CockpitCard'
