import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'

export interface CockpitTabsProps {
  tabs: Array<{ id: string; label: string; icon?: ReactNode }>
  activeTab: string
  onChange: (tabId: string) => void
  size?: 'sm' | 'md'
}

const sizes = {
  sm: { fontSize: '0.5rem', padding: '0.4rem 0.75rem', gap: '0.35rem' },
  md: { fontSize: '0.625rem', padding: '0.5rem 1rem', gap: '0.5rem' },
} as const

export function CockpitTabs({
  tabs,
  activeTab,
  onChange,
  size = 'md',
}: CockpitTabsProps) {
  const dim = sizes[size]

  return (
    <div
      role="tablist"
      className={cn('flex items-stretch')}
      style={{
        borderBottom: '1px solid rgba(156, 156, 156, 0.15)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              const idx = tabs.findIndex((t) => t.id === tab.id)
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                const next = tabs[(idx + 1) % tabs.length]
                onChange(next.id)
                const nextEl = (e.currentTarget.parentElement?.children[(idx + 1) % tabs.length] as HTMLElement)
                nextEl?.focus()
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
                onChange(prev.id)
                const prevEl = (e.currentTarget.parentElement?.children[(idx - 1 + tabs.length) % tabs.length] as HTMLElement)
                prevEl?.focus()
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: dim.gap,
              padding: dim.padding,
              fontFamily: 'var(--font-family-mono)',
              fontSize: dim.fontSize,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              color: isActive
                ? 'var(--aiox-lime, #D1FF00)'
                : 'var(--aiox-gray-dim, #696969)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--aiox-lime, #D1FF00)'
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s, box-shadow 0.2s',
              outline: 'none',
              marginBottom: -1,
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--aiox-lime, #D1FF00) inset'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {tab.icon && (
              <span
                aria-hidden="true"
                style={{ display: 'flex', flexShrink: 0 }}
              >
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

CockpitTabs.displayName = 'CockpitTabs'
