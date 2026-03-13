import { useId, useCallback, useRef } from 'react'
import { cn } from '../../../lib/utils'

export interface CockpitSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  disabled?: boolean
}

export function CockpitSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = false,
  disabled = false,
}: CockpitSliderProps) {
  const autoId = useId()
  const inputId = `${autoId}-slider`
  const styleRef = useRef<HTMLStyleElement | null>(null)

  const percent = ((value - min) / (max - min)) * 100

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value))
    },
    [onChange]
  )

  // Inject scoped slider styles for the thumb/track
  const injectStyles = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node) return
      const parent = node.parentElement
      if (!parent) return

      if (!styleRef.current) {
        const style = document.createElement('style')
        style.textContent = `
          .cockpit-slider::-webkit-slider-runnable-track {
            height: 4px;
            background: transparent;
            border: none;
            cursor: pointer;
          }
          .cockpit-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: var(--aiox-surface-deep, #050505);
            border: 1px solid rgba(156, 156, 156, 0.15);
            border-radius: 0;
            cursor: pointer;
            margin-top: -6px;
            transition: background 0.15s, border-color 0.15s;
          }
          .cockpit-slider:hover::-webkit-slider-thumb {
            background: var(--aiox-lime, #D1FF00);
            border-color: var(--aiox-lime, #D1FF00);
          }
          .cockpit-slider:focus::-webkit-slider-thumb {
            background: var(--aiox-lime, #D1FF00);
            border-color: var(--aiox-lime, #D1FF00);
          }
          .cockpit-slider::-moz-range-track {
            height: 4px;
            background: transparent;
            border: none;
            cursor: pointer;
          }
          .cockpit-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: var(--aiox-surface-deep, #050505);
            border: 1px solid rgba(156, 156, 156, 0.15);
            border-radius: 0;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
          }
          .cockpit-slider:hover::-moz-range-thumb {
            background: var(--aiox-lime, #D1FF00);
            border-color: var(--aiox-lime, #D1FF00);
          }
          .cockpit-slider:focus::-moz-range-thumb {
            background: var(--aiox-lime, #D1FF00);
            border-color: var(--aiox-lime, #D1FF00);
          }
          .cockpit-slider:disabled::-webkit-slider-thumb {
            cursor: not-allowed;
          }
          .cockpit-slider:disabled::-moz-range-thumb {
            cursor: not-allowed;
          }
        `
        parent.prepend(style)
        styleRef.current = style
      }
    },
    []
  )

  return (
    <div className={cn('flex flex-col gap-1.5', disabled && 'opacity-40')}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
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
            </label>
          )}
          {showValue && (
            <span
              aria-live="polite"
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.65rem',
                color: 'var(--aiox-lime, #D1FF00)',
                letterSpacing: '0.02em',
              }}
            >
              {value}
            </span>
          )}
        </div>
      )}
      <div className="relative" style={{ height: 16 }}>
        {/* Track background */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            height: 4,
            background: 'var(--aiox-surface, #0F0F11)',
          }}
        />
        {/* Track fill */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 6,
            left: 0,
            width: `${percent}%`,
            height: 4,
            background: 'var(--aiox-lime, #D1FF00)',
            transition: 'width 0.1s ease',
          }}
        />
        <input
          ref={injectStyles}
          id={inputId}
          type="range"
          className="cockpit-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 16,
            margin: 0,
            padding: 0,
            background: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
      </div>
    </div>
  )
}

CockpitSlider.displayName = 'CockpitSlider'
