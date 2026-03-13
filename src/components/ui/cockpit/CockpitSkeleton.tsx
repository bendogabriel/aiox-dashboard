import { cn } from '../../../lib/utils'
import type { HTMLAttributes } from 'react'

export interface CockpitSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'image' | 'circle'
  width?: string | number
  height?: string | number
  lines?: number
}

const shimmerStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background: 'rgba(156, 156, 156, 0.06)',
}

function ShimmerBlock({
  blockWidth,
  blockHeight,
  borderRadius,
  className,
  style,
}: {
  blockWidth?: string | number
  blockHeight?: string | number
  borderRadius?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn(className)}
      aria-hidden="true"
      style={{
        ...shimmerStyle,
        width: typeof blockWidth === 'number' ? `${blockWidth}px` : blockWidth || '100%',
        height: typeof blockHeight === 'number' ? `${blockHeight}px` : blockHeight || '1rem',
        borderRadius: borderRadius || '0',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(209, 255, 0, 0.04) 40%, rgba(209, 255, 0, 0.08) 50%, rgba(209, 255, 0, 0.04) 60%, transparent 100%)',
          animation: 'aiox-shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  )
}

const textLineWidths = ['100%', '80%', '60%', '90%', '70%']

export function CockpitSkeleton({
  variant = 'text',
  width,
  height,
  lines = 3,
  className,
  style,
  ...props
}: CockpitSkeletonProps) {
  if (variant === 'text') {
    const lineCount = Math.max(1, lines)
    return (
      <div
        className={cn(className)}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }}
        {...props}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <ShimmerBlock
            key={i}
            blockWidth={width || textLineWidths[i % textLineWidths.length]}
            blockHeight={height || '0.65rem'}
          />
        ))}
      </div>
    )
  }

  if (variant === 'circle') {
    const size = width || height || 40
    return (
      <ShimmerBlock
        className={cn(className)}
        blockWidth={size}
        blockHeight={size}
        borderRadius="50%"
        style={style}
        {...(props as Record<string, unknown>)}
      />
    )
  }

  if (variant === 'image') {
    return (
      <ShimmerBlock
        className={cn(className)}
        blockWidth={width || '100%'}
        blockHeight={height || '120px'}
        style={style}
        {...(props as Record<string, unknown>)}
      />
    )
  }

  // variant === 'card'
  return (
    <div
      className={cn(className)}
      style={{
        padding: '1.25rem',
        background: 'var(--aiox-surface-deep, #050505)',
        border: '1px solid rgba(156, 156, 156, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        ...style,
      }}
      {...props}
    >
      {/* Header area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShimmerBlock blockWidth={32} blockHeight={32} borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <ShimmerBlock blockWidth="60%" blockHeight="0.65rem" />
          <ShimmerBlock blockWidth="35%" blockHeight="0.55rem" />
        </div>
      </div>
      {/* Body area */}
      <ShimmerBlock blockWidth="100%" blockHeight="0.6rem" />
      <ShimmerBlock blockWidth="85%" blockHeight="0.6rem" />
      <ShimmerBlock blockWidth="70%" blockHeight="0.6rem" />
    </div>
  )
}
