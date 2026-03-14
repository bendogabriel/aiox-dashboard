/**
 * SquadHealthBadge — Compact health/quality badge for squad cards.
 *
 * Shows health score, grade, and quality gate result for a given squad.
 * Designed to be embedded in squad list cards (SquadsView Level 1 & 2).
 */
import { usePlatformHealth } from '../../hooks/usePlatformIntelligence'
import type { SquadHealthResult } from '../../services/api/engine'

interface SquadHealthBadgeProps {
  squadId: string
  /** Compact mode shows only score + grade inline */
  compact?: boolean
}

export function SquadHealthBadge({ squadId, compact = false }: SquadHealthBadgeProps) {
  const { data: health } = usePlatformHealth()

  if (!health?.results) return null

  const squadResult = health.results.find(r => r.squad === squadId)
  if (!squadResult) return null

  const gradeColor = getGradeColor(squadResult.grade)

  if (compact) {
    return (
      <span
        title={`Health: ${squadResult.score}/100 (${squadResult.grade})`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem',
          padding: '0.15rem 0.35rem',
          border: `1px solid ${gradeColor}33`,
          color: gradeColor,
        }}
      >
        {squadResult.score}
        <span style={{ fontSize: '0.45rem', opacity: 0.7 }}>{squadResult.grade}</span>
      </span>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.35rem',
      padding: '0.5rem',
      background: 'rgba(156,156,156,0.03)',
      border: '1px solid rgba(156,156,156,0.08)',
    }}>
      {/* Score + Grade */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--aiox-gray-muted)',
        }}>
          Health Score
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            fontFamily: 'var(--font-family-display)', fontSize: '0.9rem',
            fontWeight: 700, color: gradeColor, lineHeight: 1,
          }}>
            {squadResult.score}
          </span>
          <span style={{
            fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem',
            color: gradeColor, opacity: 0.8,
          }}>
            {squadResult.grade}
          </span>
        </div>
      </div>

      {/* Dimension bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
        <DimensionBar label="Structure" value={squadResult.dimensions.structural} max={25} />
        <DimensionBar label="Agents" value={squadResult.dimensions.agentQuality} max={25} />
        <DimensionBar label="Tasks" value={squadResult.dimensions.taskQuality} max={25} />
        <DimensionBar label="Infra" value={squadResult.dimensions.infrastructure} max={25} />
      </div>
    </div>
  )
}

function DimensionBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  const color = pct >= 80 ? 'var(--aiox-lime)' : pct >= 50 ? 'var(--aiox-blue)' : 'var(--color-status-error)'

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.15rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-family-mono)', fontSize: '0.4rem',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--aiox-gray-dim)',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-family-mono)', fontSize: '0.4rem',
          color: 'var(--aiox-gray-muted)',
        }}>
          {value.toFixed(1)}/{max}
        </span>
      </div>
      <div style={{
        height: '3px',
        background: 'rgba(156,156,156,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          transition: 'width 0.3s ease-out',
        }} />
      </div>
    </div>
  )
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'var(--aiox-lime, #D1FF00)'
    case 'B': return 'var(--aiox-blue, #0099FF)'
    case 'C': return '#f59e0b'
    case 'D': return 'var(--aiox-flare, #ED4609)'
    case 'F': return 'var(--color-status-error, #EF4444)'
    default: return 'var(--aiox-gray-muted)'
  }
}
