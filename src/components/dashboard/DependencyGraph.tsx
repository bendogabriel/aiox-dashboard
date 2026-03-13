/**
 * DependencyGraph — P9 Interactive dependency visualization
 *
 * SVG-based graph showing integrations (top) → capabilities (bottom)
 * with color-coded status and hover highlighting.
 */

import { useState, useMemo } from 'react';
import { useIntegrationStore, type IntegrationId } from '../../stores/integrationStore';
import {
  buildDependencyGraph,
  getConnectedNodeIds,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
  type GraphNode,
  type GraphEdge,
} from '../../lib/dependency-graph';

// ── Color maps ───────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  // Integration statuses
  connected: 'var(--color-status-success, #4ADE80)',
  partial: '#f59e0b',
  checking: 'var(--aiox-gray-muted, #999)',
  disconnected: '#696969',
  error: '#EF4444',
  // Capability levels
  full: 'var(--color-status-success, #4ADE80)',
  degraded: '#f59e0b',
  unavailable: '#EF4444',
};

const EDGE_COLORS = {
  requires: 'rgba(74, 222, 128, 0.2)',
  enhancedBy: 'rgba(156, 156, 156, 0.15)',
  requiresHighlight: 'rgba(74, 222, 128, 0.6)',
  enhancedByHighlight: 'rgba(156, 156, 156, 0.5)',
  dim: 'rgba(255, 255, 255, 0.03)',
};

// ── Component ────────────────────────────────────────────

export function DependencyGraph() {
  const integrations = useIntegrationStore((s) => s.integrations);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const s: Record<string, any> = {};
    for (const [id, entry] of Object.entries(integrations)) {
      s[id] = entry.status;
    }
    return s as Record<IntegrationId, any>;
  }, [integrations]);

  const graph = useMemo(() => buildDependencyGraph(statuses), [statuses]);

  const connectedIds = useMemo(
    () => (hoveredNode ? getConnectedNodeIds(graph, hoveredNode) : null),
    [graph, hoveredNode],
  );

  const isHighlighted = (nodeId: string) => !connectedIds || connectedIds.has(nodeId);
  const isEdgeHighlighted = (edge: GraphEdge) =>
    !connectedIds || (connectedIds.has(edge.from) && connectedIds.has(edge.to));

  // Node maps for edge drawing
  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    graph.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [graph.nodes]);

  return (
    <div style={{
      background: 'var(--aiox-surface, #0a0a0a)',
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'var(--font-family-mono, monospace)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          color: 'var(--aiox-cream, #E5E5E5)',
        }}>
          Dependency Map
        </span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '8px' }}>
          <Legend color={NODE_COLORS.connected} label="Connected" />
          <Legend color={NODE_COLORS.degraded} label="Degraded" />
          <Legend color={NODE_COLORS.error} label="Down" />
          <Legend color="var(--aiox-blue)" label="Enhanced" dashed />
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        width="100%"
        style={{ display: 'block', maxHeight: '420px' }}
      >
        {/* Row labels */}
        <text
          x={12}
          y={GRAPH_HEIGHT * 0.12 - 16}
          style={{
            fontSize: '8px',
            fill: '#696969',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          } as React.CSSProperties}
        >
          INTEGRATIONS
        </text>
        <text
          x={12}
          y={GRAPH_HEIGHT * 0.81 - 16}
          style={{
            fontSize: '8px',
            fill: '#696969',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          } as React.CSSProperties}
        >
          CAPABILITIES
        </text>

        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          const highlighted = isEdgeHighlighted(edge);
          const color = !highlighted
            ? EDGE_COLORS.dim
            : edge.type === 'requires'
              ? (connectedIds ? EDGE_COLORS.requiresHighlight : EDGE_COLORS.requires)
              : (connectedIds ? EDGE_COLORS.enhancedByHighlight : EDGE_COLORS.enhancedBy);

          // Curved path
          const midY = (from.y + to.y) / 2;
          const d = `M ${from.x} ${from.y + 14} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 14}`;

          return (
            <path
              key={`${edge.from}-${edge.to}-${i}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={highlighted ? 1.5 : 0.5}
              strokeDasharray={edge.type === 'enhancedBy' ? '4,3' : undefined}
              style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
            />
          );
        })}

        {/* Nodes */}
        {graph.nodes.map((node) => {
          const highlighted = isHighlighted(node.id);
          const color = NODE_COLORS[node.status] || '#696969';
          const isIntegration = node.type === 'integration';
          const size = isIntegration ? 10 : 8;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                cursor: 'pointer',
                opacity: highlighted ? 1 : 0.15,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Glow for connected/full */}
              {(node.status === 'connected' || node.status === 'full') && highlighted && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={0.5}
                  opacity={0.3}
                />
              )}

              {/* Node shape: square for integrations, circle for capabilities */}
              {isIntegration ? (
                <rect
                  x={node.x - size}
                  y={node.y - size}
                  width={size * 2}
                  height={size * 2}
                  fill={color}
                  opacity={0.9}
                />
              ) : (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  fill={color}
                  opacity={0.9}
                />
              )}

              {/* Label */}
              <text
                x={node.x}
                y={node.y + (isIntegration ? -16 : 20)}
                textAnchor="middle"
                style={{
                  fontSize: isIntegration ? '9px' : '7px',
                  fill: highlighted ? '#E5E5E5' : '#3D3D3D',
                  fontWeight: isIntegration ? 600 : 400,
                  transition: 'fill 0.2s',
                } as React.CSSProperties}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Legend item ───────────────────────────────────────────

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
      <svg width={12} height={6}>
        <line
          x1={0}
          y1={3}
          x2={12}
          y2={3}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dashed ? '3,2' : undefined}
        />
      </svg>
      {label}
    </span>
  );
}
