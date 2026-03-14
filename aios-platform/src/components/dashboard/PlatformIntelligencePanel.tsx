/**
 * Platform Intelligence Panel — Maturity, Health, Quality Gates, Graph, Knowledge.
 *
 * Displays .aios-core analytics data fetched via engine /platform/* routes.
 * Uses AIOX Cockpit design system components.
 */
import { useState } from 'react'
import {
  Shield,
  Activity,
  Network,
  Brain,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
} from 'lucide-react'
import {
  CockpitKpiCard,
  CockpitBadge,
  CockpitSectionDivider,
  CockpitSpinner,
} from '../ui/cockpit'
import {
  useMaturity,
  usePlatformHealth,
  useQualityGates,
  useGraphStats,
  useKnowledgeStats,
} from '../../hooks/usePlatformIntelligence'
import type { MaturityScores } from '../../services/api/engine'
import { MATURITY_DIMENSIONS, getLevelColor } from '../../stores/maturityStore'
import { KnowledgeSearchPanel } from './KnowledgeSearchPanel'
import { IntegrationGraphPanel } from './IntegrationGraphPanel'

// ── Maturity Radar (SVG) ────────────────────────────────────

function MaturityRadar({ scores }: { scores: MaturityScores }) {
  const dims = MATURITY_DIMENSIONS
  const cx = 100, cy = 100, r = 80
  const angleStep = (2 * Math.PI) / dims.length

  // Background hexagon
  const bgPoints = dims.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  // Grid lines at 25%, 50%, 75%
  const gridLines = [0.25, 0.5, 0.75].map(pct => {
    const pts = dims.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2
      return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`
    }).join(' ')
    return pts
  })

  // Data polygon
  const dataPoints = dims.map((d, i) => {
    const val = (scores[d.key] || 0) / 100
    const angle = angleStep * i - Math.PI / 2
    return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 200 200" width="200" height="200" style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(156,156,156,0.15)" strokeWidth="0.5" />
      ))}
      <polygon points={bgPoints} fill="none" stroke="rgba(156,156,156,0.25)" strokeWidth="1" />

      {/* Axis lines */}
      {dims.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="rgba(156,156,156,0.1)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Data */}
      <polygon points={dataPoints} fill="rgba(209,255,0,0.15)" stroke="#D1FF00" strokeWidth="2" />

      {/* Labels */}
      {dims.map((d, i) => {
        const angle = angleStep * i - Math.PI / 2
        const lx = cx + (r + 16) * Math.cos(angle)
        const ly = cy + (r + 16) * Math.sin(angle)
        return (
          <text
            key={d.key}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--aiox-gray-muted)"
            style={{ fontFamily: 'var(--font-family-mono)', fontSize: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {d.label}
          </text>
        )
      })}

      {/* Score dots */}
      {dims.map((d, i) => {
        const val = (scores[d.key] || 0) / 100
        const angle = angleStep * i - Math.PI / 2
        return (
          <circle
            key={d.key}
            cx={cx + r * val * Math.cos(angle)}
            cy={cy + r * val * Math.sin(angle)}
            r="3"
            fill={d.color}
          />
        )
      })}
    </svg>
  )
}

// ── Quality Gate Mini Table ─────────────────────────────────

function QualityGateSummary() {
  const { data, isLoading } = useQualityGates()
  const [expanded, setExpanded] = useState(false)

  if (isLoading) return <CockpitSpinner size="sm" />
  if (!data) return null

  const criticalSquads = data.results.filter(r => r.criticalFailed > 0)
  const passRate = data.totalChecks > 0 ? Math.round((data.totalPass / data.totalChecks) * 100) : 100

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={14} style={{ color: 'var(--aiox-lime)' }} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-cream)' }}>
            Quality Gates
          </span>
        </div>
        <CockpitBadge variant={data.totalCriticalFail === 0 ? 'lime' : 'error'}>
          {data.overallGate}
        </CockpitBadge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <MiniStat label="Checks" value={data.totalChecks} />
        <MiniStat label="Pass rate" value={`${passRate}%`} />
        <MiniStat label="Critical fail" value={data.totalCriticalFail} alert={data.totalCriticalFail > 0} />
      </div>

      {criticalSquads.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem',
              color: 'var(--color-status-error)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            {criticalSquads.length} squads with critical failures
          </button>
          {expanded && (
            <div style={{ marginTop: '0.5rem' }}>
              {criticalSquads.map(sq => (
                <div key={sq.squad} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0',
                  borderBottom: '1px solid rgba(156,156,156,0.08)',
                }}>
                  <XCircle size={10} style={{ color: 'var(--color-status-error)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-cream)' }}>
                    {sq.squad}
                  </span>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)', marginLeft: 'auto' }}>
                    {sq.criticalFailed} critical
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {criticalSquads.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={12} style={{ color: 'var(--aiox-lime)' }} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-muted)' }}>
            All squads passing critical gates
          </span>
        </div>
      )}
    </div>
  )
}

// ── Graph Stats ─────────────────────────────────────────────

function GraphStatsSummary() {
  const { data, isLoading } = useGraphStats()

  if (isLoading) return <CockpitSpinner size="sm" />
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Network size={14} style={{ color: 'var(--aiox-blue, #0099FF)' }} />
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-cream)' }}>
          Integration Graph
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <MiniStat label="Tasks" value={data.totalTasks} />
        <MiniStat label="Edges" value={data.totalEdges} />
        <MiniStat label="Cross-squad" value={data.crossSquadEdges} />
        <MiniStat label="Cycles" value={data.cycles.length} alert={data.cycles.length > 0} />
      </div>

      {data.isolatedSquads.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={10} style={{ color: 'var(--color-status-warning)' }} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--color-status-warning)' }}>
            {data.isolatedSquads.length} isolated squads
          </span>
        </div>
      )}

      {data.isolatedSquads.length === 0 && data.cycles.length === 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={12} style={{ color: 'var(--aiox-lime)' }} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-muted)' }}>
            Fully connected, no cycles
          </span>
        </div>
      )}
    </div>
  )
}

// ── Knowledge Stats ─────────────────────────────────────────

function KnowledgeStatsSummary() {
  const { data, isLoading } = useKnowledgeStats()

  if (isLoading) return <CockpitSpinner size="sm" />
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Brain size={14} style={{ color: '#3DB2FF' }} />
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-cream)' }}>
          Knowledge Index
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <MiniStat label="Chunks" value={data.totalChunks.toLocaleString()} />
        <MiniStat label="Squads indexed" value={data.squadsIndexed} />
      </div>
    </div>
  )
}

// ── Mini Stat Helper ────────────────────────────────────────

function MiniStat({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(156,156,156,0.04)',
      border: alert ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(156,156,156,0.08)',
    }}>
      <div style={{
        fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--aiox-gray-muted)', marginBottom: '0.25rem',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-family-display)', fontSize: '1rem', fontWeight: 700,
        color: alert ? 'var(--color-status-error)' : 'var(--aiox-cream)',
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

// ── Main Panel ──────────────────────────────────────────────

export function PlatformIntelligencePanel() {
  const { data: maturity, isLoading: maturityLoading } = useMaturity()
  const { data: health, isLoading: healthLoading } = usePlatformHealth()

  const isLoading = maturityLoading && healthLoading

  if (isLoading) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'var(--aiox-surface)',
        border: '1px solid rgba(156,156,156,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        minHeight: '200px',
      }}>
        <CockpitSpinner size="md" />
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading platform intelligence...
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Maturity Score */}
      {maturity && (
        <div style={{
          padding: '1.25rem',
          background: 'var(--aiox-surface)',
          border: '1px solid rgba(156,156,156,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)' }}>
                Platform Maturity
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{
                  fontFamily: 'var(--font-family-display)', fontSize: '2.5rem', fontWeight: 700,
                  color: 'var(--aiox-cream)', lineHeight: 1,
                }}>
                  {maturity.overall}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--aiox-gray-dim)' }}>
                  /100
                </span>
              </div>
            </div>
            <CockpitBadge
              variant={maturity.level.includes('L5') ? 'solid' : maturity.level.includes('L4') ? 'lime' : 'surface'}
              style={maturity.level.includes('L5') ? { boxShadow: '0 0 12px rgba(209,255,0,0.3)' } : undefined}
            >
              {maturity.level}
            </CockpitBadge>
          </div>

          <MaturityRadar scores={maturity.scores} />

          {/* Dimension scores row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem', marginTop: '1rem',
          }}>
            {MATURITY_DIMENSIONS.map(d => (
              <MiniStat key={d.key} label={d.label} value={maturity.scores[d.key]} />
            ))}
          </div>
        </div>
      )}

      {/* Health KPI Cards */}
      {health && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <CockpitKpiCard
            label="Squad Health (avg)"
            value={`${health.summary.average}/100`}
            trend={health.summary.average >= 80 ? 'up' : health.summary.average >= 60 ? 'neutral' : 'down'}
          />
          <CockpitKpiCard
            label="Squads"
            value={health.total_squads}
            change={health.failing_squads > 0 ? `${health.failing_squads} failing` : 'All passing'}
            trend={health.failing_squads === 0 ? 'up' : 'down'}
          />
        </div>
      )}

      <CockpitSectionDivider label="Governance" />

      {/* Quality Gates */}
      <div style={{
        padding: '1rem',
        background: 'var(--aiox-surface)',
        border: '1px solid rgba(156,156,156,0.15)',
      }}>
        <QualityGateSummary />
      </div>

      <CockpitSectionDivider label="Architecture" />

      {/* Graph + Knowledge stats side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{
          padding: '1rem',
          background: 'var(--aiox-surface)',
          border: '1px solid rgba(156,156,156,0.15)',
        }}>
          <GraphStatsSummary />
        </div>
        <div style={{
          padding: '1rem',
          background: 'var(--aiox-surface)',
          border: '1px solid rgba(156,156,156,0.15)',
        }}>
          <KnowledgeStatsSummary />
        </div>
      </div>

      <CockpitSectionDivider label="Cross-Squad Graph" />

      {/* Integration Graph Visualization */}
      <IntegrationGraphPanel />

      <CockpitSectionDivider label="Knowledge Search" />

      {/* Knowledge Search */}
      <KnowledgeSearchPanel />
    </div>
  )
}
