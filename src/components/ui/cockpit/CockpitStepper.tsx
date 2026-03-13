import { cn } from '../../../lib/utils'

export interface CockpitStepperProps {
  steps: Array<{ label: string; description?: string }>
  activeStep: number
  orientation?: 'horizontal' | 'vertical'
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6L5 8.5L9.5 4"
        stroke="var(--aiox-dark, #050505)"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  )
}

export function CockpitStepper({
  steps,
  activeStep,
  orientation = 'horizontal',
}: CockpitStepperProps) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={cn('flex', isHorizontal ? 'flex-row items-start' : 'flex-col')}
      role="list"
      aria-label="Progress"
    >
      {steps.map((step, idx) => {
        const isComplete = idx < activeStep
        const isActive = idx === activeStep
        const isFuture = idx > activeStep
        const isLast = idx === steps.length - 1

        const circleSize = 24
        const borderColor = isFuture
          ? 'rgba(156, 156, 156, 0.15)'
          : 'var(--aiox-lime, #D1FF00)'
        const bgColor = isComplete
          ? 'var(--aiox-lime, #D1FF00)'
          : 'transparent'
        const textColor = isFuture
          ? 'var(--aiox-gray-dim, #696969)'
          : isActive
            ? 'var(--aiox-lime, #D1FF00)'
            : 'var(--aiox-dark, #050505)'
        const connectorColor = isComplete
          ? 'var(--aiox-lime, #D1FF00)'
          : 'rgba(156, 156, 156, 0.15)'

        return (
          <div
            key={idx}
            role="listitem"
            className={cn(
              'flex',
              isHorizontal ? 'flex-col items-center' : 'flex-row items-start',
              !isLast && (isHorizontal ? 'flex-1' : '')
            )}
            style={{ position: 'relative' }}
          >
            <div
              className={cn(
                'flex',
                isHorizontal ? 'flex-row items-center w-full' : 'flex-col items-center'
              )}
            >
              {/* Circle */}
              <div
                style={{
                  width: circleSize,
                  height: circleSize,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${borderColor}`,
                  background: bgColor,
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  color: textColor,
                }}
                aria-hidden="true"
              >
                {isComplete ? <CheckIcon /> : idx + 1}
              </div>

              {/* Connector */}
              {!isLast && (
                isHorizontal ? (
                  <div
                    aria-hidden="true"
                    style={{
                      flex: 1,
                      height: 1,
                      background: connectorColor,
                      minWidth: 16,
                    }}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    style={{
                      width: 1,
                      minHeight: 24,
                      flex: 1,
                      background: connectorColor,
                    }}
                  />
                )
              )}
            </div>

            {/* Label + description */}
            <div
              className={cn(
                'flex flex-col gap-0.5',
                isHorizontal ? 'items-center mt-1.5' : 'ml-3'
              )}
              style={{
                position: isHorizontal ? undefined : 'relative',
                top: isHorizontal ? undefined : 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 500,
                  color: isFuture
                    ? 'var(--aiox-gray-dim, #696969)'
                    : isActive
                      ? 'var(--aiox-lime, #D1FF00)'
                      : 'var(--aiox-cream, #FAF9F6)',
                  textAlign: isHorizontal ? 'center' : 'left',
                }}
              >
                {step.label}
              </span>
              {step.description && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.5rem',
                    color: 'var(--aiox-gray-dim)',
                    letterSpacing: '0.04em',
                    textAlign: isHorizontal ? 'center' : 'left',
                  }}
                >
                  {step.description}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

CockpitStepper.displayName = 'CockpitStepper'
