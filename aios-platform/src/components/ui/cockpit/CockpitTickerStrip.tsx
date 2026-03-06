import { cn } from '../../../lib/utils'

export interface CockpitTickerStripProps {
  items: string[]
  speed?: number
  className?: string
}

export function CockpitTickerStrip({ items, speed = 30, className }: CockpitTickerStripProps) {
  const text = items.join(' \u2014 ')
  const doubled = `${text} \u2014 ${text} \u2014 `

  return (
    <div
      className={cn('overflow-hidden whitespace-nowrap', className)}
      style={{
        borderTop: '1px solid rgba(156, 156, 156, 0.15)',
        borderBottom: '1px solid rgba(156, 156, 156, 0.15)',
        background: 'var(--aiox-dark)',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '0.6rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--aiox-gray-dim)',
        padding: '0.5rem 0',
      }}
    >
      <div
        className="inline-block"
        style={{
          animation: `aiox-ticker ${speed}s linear infinite`,
          whiteSpace: 'nowrap',
        }}
      >
        {doubled}
      </div>
    </div>
  )
}
