import { useId } from 'react'
import { cn } from '../../../lib/utils'

export interface CockpitToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

const sizes = {
  sm: { track: { width: 32, height: 16 }, knob: 12, offset: 2 },
  md: { track: { width: 40, height: 20 }, knob: 16, offset: 2 },
} as const

export function CockpitToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: CockpitToggleProps) {
  const autoId = useId()
  const labelId = `${autoId}-label`
  const descId = `${autoId}-desc`
  const dim = sizes[size]

  return (
    <div className={cn('flex items-start gap-3', disabled && 'opacity-40')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: dim.track.width,
          height: dim.track.height,
          flexShrink: 0,
          marginTop: 1,
          background: checked
            ? 'var(--aiox-lime, #D1FF00)'
            : 'var(--aiox-surface-deep, #050505)',
          border: `1px solid ${
            checked ? 'var(--aiox-lime, #D1FF00)' : 'rgba(156, 156, 156, 0.15)'
          }`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          padding: 0,
          outline: 'none',
          boxShadow: undefined,
        }}
        onFocus={(e) => {
          if (!disabled) (e.currentTarget.style.boxShadow = '0 0 0 1px var(--aiox-lime, #D1FF00)')
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none'
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            if (!disabled) onChange(!checked)
          }
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: dim.offset,
            left: checked
              ? dim.track.width - dim.knob - dim.offset - 2
              : dim.offset,
            width: dim.knob,
            height: dim.knob,
            borderRadius: 0,
            background: checked
              ? 'var(--aiox-dark, #050505)'
              : 'var(--aiox-gray-dim, #696969)',
            transition: 'left 0.2s ease, background 0.2s ease',
          }}
        />
      </button>
      <div className="flex flex-col gap-0.5">
        <span
          id={labelId}
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.625rem',
            color: 'var(--aiox-cream, #FAF9F6)',
            letterSpacing: '0.02em',
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
      </div>
    </div>
  )
}

CockpitToggle.displayName = 'CockpitToggle'
