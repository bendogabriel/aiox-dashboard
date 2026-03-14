/**
 * IntegrationGraphPanel — Interactive SVG visualization of the .aios-core
 * cross-squad integration graph (tasks as nodes, dependencies as edges).
 *
 * Uses useGraphData() to fetch real graph data (264 tasks, 208 cross-squad edges).
 * Force-directed layout computed on mount with a simple spring algorithm.
 */
import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { Network, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'
import { CockpitBadge, CockpitSpinner } from '../ui/cockpit'
import { useGraphData, useGraphStats } from '../../hooks/usePlatformIntelligence'

// ── Squad color palette (brandbook-aligned) ──────────────

const SQUAD_COLORS: Record<string, string> = {
  'orquestrador-global': '#D1FF00',
  'design-system': '#a8cc00',
  'full-stack-dev': '#0099FF',
  'aios-core-dev': '#0077CC',
  'data-analytics': '#3DB2FF',
  'content-ecosystem': '#ED4609',
  'creative-studio': '#F06838',
  'media-buy': '#C04D26',
  'copywriting': '#BDBDBD',
  'conselho': '#999999',
  'sales': '#D1FF00',
  'etl-ops': '#0077CC',
  'seo': '#3DB2FF',
  'media-production': '#ED4609',
  'video-production': '#F06838',
  'project-management-clickup': '#999999',
}

function getSquadColor(squad: string): string {
  if (SQUAD_COLORS[squad]) return SQUAD_COLORS[squad]
  // Hash-based fallback
  let hash = 0
  for (let i = 0; i < squad.length; i++) {
    hash = squad.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 55%)`
}

// ── Force-directed layout ────────────────────────────────

interface LayoutNode {
  id: string
  squad: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
}

interface LayoutEdge {
  source: string
  target: string
  crossSquad: boolean
}

function computeLayout(
  nodes: Array<{ id: string; squad: string; label: string }>,
  edges: Array<{ source: string; target: string }>,
  width: number,
  height: number,
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  if (nodes.length === 0) return { nodes: [], edges: [] }

  // Group by squad for initial positioning
  const squads = [...new Set(nodes.map(n => n.squad))]
  const squadAngle = (2 * Math.PI) / Math.max(squads.length, 1)
  const cx = width / 2
  const cy = height / 2
  const ringRadius = Math.min(width, height) * 0.35

  // Initial positions: squads on a ring, nodes clustered around squad center
  const squadPositions: Record<string, { x: number; y: number }> = {}
  squads.forEach((sq, i) => {
    const angle = squadAngle * i - Math.PI / 2
    squadPositions[sq] = {
      x: cx + ringRadius * Math.cos(angle),
      y: cy + ringRadius * Math.sin(angle),
    }
  })

  const layoutNodes: LayoutNode[] = nodes.map(n => {
    const sp = squadPositions[n.squad] || { x: cx, y: cy }
    return {
      ...n,
      x: sp.x + (Math.random() - 0.5) * 60,
      y: sp.y + (Math.random() - 0.5) * 60,
      vx: 0,
      vy: 0,
    }
  })

  const nodeIndex = new Map<string, number>()
  layoutNodes.forEach((n, i) => nodeIndex.set(n.id, i))

  // Edge set for quick cross-squad lookup
  const nodeSquad = new Map(nodes.map(n => [n.id, n.squad]))
  const layoutEdges: LayoutEdge[] = edges
    .filter(e => nodeIndex.has(e.source) && nodeIndex.has(e.target))
    .map(e => ({
      ...e,
      crossSquad: nodeSquad.get(e.source) !== nodeSquad.get(e.target),
    }))

  // Simple force simulation (50 iterations)
  const repulsionStrength = 800
  const attractionStrength = 0.005
  const squadAttraction = 0.01
  const damping = 0.85

  for (let iter = 0; iter < 50; iter++) {
    // Repulsion between all nodes (O(n^2) but limited to ~264 nodes)
    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const dx = layoutNodes[i].x - layoutNodes[j].x
        const dy = layoutNodes[i].y - layoutNodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy) + 1
        const force = repulsionStrength / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        layoutNodes[i].vx += fx
        layoutNodes[i].vy += fy
        layoutNodes[j].vx -= fx
        layoutNodes[j].vy -= fy
      }
    }

    // Attraction along edges
    for (const edge of layoutEdges) {
      const si = nodeIndex.get(edge.source)!
      const ti = nodeIndex.get(edge.target)!
      const dx = layoutNodes[ti].x - layoutNodes[si].x
      const dy = layoutNodes[ti].y - layoutNodes[si].y
      const force = attractionStrength
      layoutNodes[si].vx += dx * force
      layoutNodes[si].vy += dy * force
      layoutNodes[ti].vx -= dx * force
      layoutNodes[ti].vy -= dy * force
    }

    // Pull towards squad center
    for (const node of layoutNodes) {
      const sp = squadPositions[node.squad]
      if (sp) {
        node.vx += (sp.x - node.x) * squadAttraction
        node.vy += (sp.y - node.y) * squadAttraction
      }
    }

    // Apply velocities with damping
    for (const node of layoutNodes) {
      node.vx *= damping
      node.vy *= damping
      node.x += node.vx
      node.y += node.vy
      // Clamp to bounds
      node.x = Math.max(20, Math.min(width - 20, node.x))
      node.y = Math.max(20, Math.min(height - 20, node.y))
    }
  }

  return { nodes: layoutNodes, edges: layoutEdges }
}

// ── Component ────────────────────────────────────────────

export function IntegrationGraphPanel() {
  const { data: graphData, isLoading } = useGraphData()
  const { data: stats } = useGraphStats()
  const [hoveredSquad, setHoveredSquad] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  const W = 800
  const H = 600

  // Parse and layout graph
  const layout = useMemo(() => {
    if (!graphData) return null
    const raw = graphData as { nodes?: Array<{ id: string; squad: string; label: string }>; edges?: Array<{ source: string; target: string }> }
    if (!raw.nodes || !raw.edges) return null
    return computeLayout(raw.nodes, raw.edges, W, H)
  }, [graphData])

  // Squad list for legend
  const squads = useMemo(() => {
    if (!layout) return []
    const seen = new Map<string, number>()
    for (const n of layout.nodes) {
      seen.set(n.squad, (seen.get(n.squad) || 0) + 1)
    }
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([squad, count]) => ({ squad, count }))
  }, [layout])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isPanning.current = true
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  // Reset on data change
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [graphData])

  if (isLoading) {
    return (
      <div style={{
        padding: '1.5rem', background: 'var(--aiox-surface)',
        border: '1px solid rgba(156,156,156,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: expanded ? '500px' : '300px', gap: '0.75rem',
      }}>
        <CockpitSpinner size="md" />
        <span style={{
          fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem',
          color: 'var(--aiox-gray-muted)', textTransform: 'uppercase',
        }}>
          Loading graph...
        </span>
      </div>
    )
  }

  if (!layout || layout.nodes.length === 0) {
    return (
      <div style={{
        padding: '1.5rem', background: 'var(--aiox-surface)',
        border: '1px solid rgba(156,156,156,0.15)',
        textAlign: 'center', minHeight: '200px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem',
          color: 'var(--aiox-gray-dim)',
        }}>
          No graph data available. Run: node aios-cli.js graph
        </span>
      </div>
    )
  }

  const nodeMap = new Map(layout.nodes.map(n => [n.id, n]))

  return (
    <div style={{
      background: 'var(--aiox-surface)',
      border: '1px solid rgba(156,156,156,0.15)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid rgba(156,156,156,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Network size={14} style={{ color: 'var(--aiox-blue, #0099FF)' }} />
          <span style={{
            fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--aiox-cream)',
          }}>
            Integration Graph
          </span>
          {stats && (
            <CockpitBadge variant="surface">
              {stats.crossSquadEdges} cross-squad
            </CockpitBadge>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.3))}
            style={{
              background: 'none', border: '1px solid rgba(156,156,156,0.15)',
              cursor: 'pointer', padding: '0.25rem', color: 'var(--aiox-gray-muted)',
            }}
            aria-label="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.3))}
            style={{
              background: 'none', border: '1px solid rgba(156,156,156,0.15)',
              cursor: 'pointer', padding: '0.25rem', color: 'var(--aiox-gray-muted)',
            }}
            aria-label="Zoom out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: '1px solid rgba(156,156,156,0.15)',
              cursor: 'pointer', padding: '0.25rem', color: 'var(--aiox-gray-muted)',
            }}
            aria-label={expanded ? 'Collapse graph' : 'Expand graph'}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{
          display: 'block',
          maxHeight: expanded ? '600px' : '380px',
          cursor: isPanning.current ? 'grabbing' : 'grab',
          background: 'var(--aiox-dark, #050505)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {layout.edges.map((edge, i) => {
            const source = nodeMap.get(edge.source)
            const target = nodeMap.get(edge.target)
            if (!source || !target) return null

            const isCrossSquad = edge.crossSquad
            const isHighlighted = !hoveredSquad ||
              source.squad === hoveredSquad ||
              target.squad === hoveredSquad

            return (
              <line
                key={`${edge.source}-${edge.target}-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isCrossSquad
                  ? (isHighlighted ? 'rgba(209,255,0,0.25)' : 'rgba(209,255,0,0.03)')
                  : (isHighlighted ? 'rgba(156,156,156,0.12)' : 'rgba(156,156,156,0.02)')}
                strokeWidth={isCrossSquad ? 1 : 0.5}
                strokeDasharray={isCrossSquad ? undefined : '2,2'}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
              />
            )
          })}

          {/* Nodes */}
          {layout.nodes.map(node => {
            const color = getSquadColor(node.squad)
            const isHighlighted = !hoveredSquad || node.squad === hoveredSquad

            return (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={3}
                fill={color}
                opacity={isHighlighted ? 0.85 : 0.08}
                style={{ transition: 'opacity 0.2s' }}
              />
            )
          })}

          {/* Squad labels */}
          {squads.slice(0, 20).map(({ squad }) => {
            const squadNodes = layout.nodes.filter(n => n.squad === squad)
            if (squadNodes.length === 0) return null
            const avgX = squadNodes.reduce((s, n) => s + n.x, 0) / squadNodes.length
            const avgY = squadNodes.reduce((s, n) => s + n.y, 0) / squadNodes.length

            return (
              <text
                key={squad}
                x={avgX}
                y={avgY - 12}
                textAnchor="middle"
                fill={hoveredSquad === squad ? 'var(--aiox-cream)' : 'var(--aiox-gray-dim)'}
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'fill 0.2s',
                  cursor: 'pointer',
                  pointerEvents: 'all',
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredSquad(squad)}
                onMouseLeave={() => setHoveredSquad(null)}
              >
                {squad.replace(/-/g, ' ')}
              </text>
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
        padding: '0.5rem 1rem',
        borderTop: '1px solid rgba(156,156,156,0.08)',
      }}>
        {squads.slice(0, 12).map(({ squad, count }) => (
          <button
            key={squad}
            onMouseEnter={() => setHoveredSquad(squad)}
            onMouseLeave={() => setHoveredSquad(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: hoveredSquad === squad ? 'rgba(209,255,0,0.06)' : 'none',
              border: '1px solid rgba(156,156,156,0.08)',
              padding: '0.2rem 0.4rem',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <div style={{
              width: '6px', height: '6px',
              background: getSquadColor(squad),
            }} />
            <span style={{
              fontFamily: 'var(--font-family-mono)', fontSize: '0.4rem',
              color: 'var(--aiox-gray-muted)', textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {squad.replace(/-/g, ' ')} ({count})
            </span>
          </button>
        ))}
        {squads.length > 12 && (
          <span style={{
            fontFamily: 'var(--font-family-mono)', fontSize: '0.4rem',
            color: 'var(--aiox-gray-dim)', padding: '0.2rem 0.4rem',
            display: 'flex', alignItems: 'center',
          }}>
            +{squads.length - 12} more
          </span>
        )}
      </div>
    </div>
  )
}
