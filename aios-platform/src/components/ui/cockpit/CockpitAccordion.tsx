import { useState, useCallback, useId } from 'react'
import type { ReactNode } from 'react'

export interface CockpitAccordionProps {
  items: Array<{ id: string; title: string; content: ReactNode; defaultOpen?: boolean }>
  allowMultiple?: boolean
}

export function CockpitAccordion({ items, allowMultiple = false }: CockpitAccordionProps) {
  const autoId = useId()
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const defaults = new Set<string>()
    for (const item of items) {
      if (item.defaultOpen) defaults.add(item.id)
    }
    return defaults
  })

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          if (!allowMultiple) next.clear()
          next.add(id)
        }
        return next
      })
    },
    [allowMultiple]
  )

  return (
    <div
      style={{
        border: '1px solid rgba(156, 156, 156, 0.15)',
      }}
    >
      {items.map((item, idx) => {
        const isOpen = openIds.has(item.id)
        const headerId = `${autoId}-header-${item.id}`
        const panelId = `${autoId}-panel-${item.id}`

        return (
          <div key={item.id}>
            {idx > 0 && (
              <div
                aria-hidden="true"
                style={{
                  height: 1,
                  background: 'rgba(156, 156, 156, 0.15)',
                }}
              />
            )}
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.65rem 0.75rem',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                color: 'var(--aiox-cream, #FAF9F6)',
                background: 'var(--aiox-surface, #0F0F11)',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 1px var(--aiox-lime, #D1FF00) inset'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span>{item.title}</span>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--aiox-gray-dim)',
                  lineHeight: 1,
                  transition: 'transform 0.2s ease',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}
              >
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              style={{
                padding: isOpen ? '0.75rem' : 0,
                background: 'var(--aiox-surface-deep, #050505)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.65rem',
                color: 'var(--aiox-cream, #FAF9F6)',
                letterSpacing: '0.02em',
                overflow: 'hidden',
              }}
            >
              {isOpen && item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}

CockpitAccordion.displayName = 'CockpitAccordion'
