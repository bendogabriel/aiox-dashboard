import { forwardRef, useEffect, useRef, useCallback } from 'react'
import { cn } from '../../../lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

export interface CockpitModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeWidths: Record<string, string> = {
  sm: '400px',
  md: '560px',
  lg: '720px',
}

export const CockpitModal = forwardRef<HTMLDivElement, CockpitModalProps>(
  function CockpitModal(
    {
      open,
      onClose,
      title,
      description,
      children,
      footer,
      size = 'md',
      className,
      style,
      ...props
    },
    ref
  ) {
    const dialogRef = useRef<HTMLDivElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
          return
        }

        if (e.key === 'Tab' && dialogRef.current) {
          const focusableEls = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (focusableEls.length === 0) return

          const first = focusableEls[0]
          const last = focusableEls[focusableEls.length - 1]

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault()
              last.focus()
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
        }
      },
      [onClose]
    )

    useEffect(() => {
      if (open) {
        previousFocusRef.current = document.activeElement as HTMLElement | null
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'

        // Focus first focusable element inside dialog
        requestAnimationFrame(() => {
          if (dialogRef.current) {
            const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            firstFocusable?.focus()
          }
        })
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus()
        }
      }
    }, [open, handleKeyDown])

    if (!open) return null

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
          }}
        />

        {/* Dialog */}
        <div
          ref={(node) => {
            (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cockpit-modal-title"
          aria-describedby={description ? 'cockpit-modal-desc' : undefined}
          className={cn(className)}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: sizeWidths[size],
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--aiox-surface, #0F0F11)',
            border: '1px solid rgba(156, 156, 156, 0.15)',
            fontFamily: 'var(--font-family-mono)',
            ...style,
          }}
          {...props}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(156, 156, 156, 0.1)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                id="cockpit-modal-title"
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--aiox-cream, #FAF9F6)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h2>
              {description && (
                <p
                  id="cockpit-modal-desc"
                  style={{
                    margin: 0,
                    marginTop: '0.375rem',
                    fontSize: '0.6rem',
                    color: 'var(--aiox-gray-muted, #999999)',
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.75rem',
                height: '1.75rem',
                padding: 0,
                marginLeft: '0.75rem',
                flexShrink: 0,
                background: 'transparent',
                border: '1px solid rgba(156, 156, 156, 0.15)',
                color: 'var(--aiox-gray-dim, #696969)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-family-mono)',
                lineHeight: 1,
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              &#x2715;
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '1.5rem',
              fontSize: '0.65rem',
              color: 'var(--aiox-gray-muted, #999999)',
              lineHeight: 1.6,
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(156, 156, 156, 0.1)',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }
)

CockpitModal.displayName = 'CockpitModal'
