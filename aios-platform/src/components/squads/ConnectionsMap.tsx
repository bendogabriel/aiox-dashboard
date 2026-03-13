import { useMemo } from 'react';
import type { AgentSummary, AgentTier } from '../../types';

interface Connection {
  from: string;
  to: string;
  type: string;
}

interface ConnectionsMapProps {
  agents: AgentSummary[];
  connections: Connection[];
}

const tierColors: Record<AgentTier, { fill: string; stroke: string; text: string }> = {
  0: { fill: '#999999', stroke: '#99999940', text: '#e0e0e0' },
  1: { fill: '#0099FF', stroke: '#0099FF40', text: '#dbeafe' },
  2: { fill: '#D1FF00', stroke: '#D1FF0030', text: '#f0ffe0' },
};

interface NodePos {
  x: number;
  y: number;
  agent: AgentSummary;
}

export function ConnectionsMap({ agents, connections }: ConnectionsMapProps) {
  const layout = useMemo(() => {
    if (agents.length === 0) return { nodes: [], viewBox: '0 0 600 500' };

    // Group by tier and place in concentric rings
    const tiers: AgentTier[] = [0, 1, 2];
    const byTier = tiers.map((t) => agents.filter((a) => a.tier === t));

    // Calculate ring radius based on agent count to avoid overlap
    const maxGroupSize = Math.max(...byTier.map(g => g.length), 1);
    const baseRadius = Math.max(120, maxGroupSize * 28);
    const nodeRadius = 22;
    const labelPadding = 44; // space for name label below node

    const nodes: NodePos[] = [];

    byTier.forEach((group, ti) => {
      if (group.length === 0) return;
      const radius = ti === 0 ? 0 : ti * baseRadius;
      group.forEach((agent, ai) => {
        if (radius === 0) {
          nodes.push({ x: 0, y: 0, agent });
        } else {
          const angle = (2 * Math.PI * ai) / group.length - Math.PI / 2;
          nodes.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
            agent,
          });
        }
      });
    });

    // Compute bounding box from nodes and add generous padding
    const padding = nodeRadius + labelPadding + 20;
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;

    const vbWidth = maxX - minX;
    const vbHeight = maxY - minY;

    // Offset nodes so they sit inside the viewBox
    const offsetX = -minX;
    const offsetY = -minY;
    const finalNodes = nodes.map(n => ({ ...n, x: n.x + offsetX, y: n.y + offsetY }));

    return { nodes: finalNodes, viewBox: `0 0 ${Math.ceil(vbWidth)} ${Math.ceil(vbHeight)}` };
  }, [agents]);

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-secondary text-sm">Nenhuma conexao disponivel</p>
      </div>
    );
  }

  const nodeMap = new Map(layout.nodes.map((n) => [n.agent.id, n]));

  return (
    <div
      className="w-full overflow-x-auto"
    >
      <svg
        viewBox={layout.viewBox}
        className="w-full mx-auto h-auto"
        style={{ minHeight: 400 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrow-solid"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.3)" />
          </marker>
          <marker
            id="arrow-dashed"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.15)" />
          </marker>
        </defs>

        {/* Connections */}
        {connections.map((conn, i) => {
          const from = nodeMap.get(conn.from);
          const to = nodeMap.get(conn.to);
          if (!from || !to) return null;

          const isHandoff = conn.type === 'handoffTo';
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return null;

          const nodeRadius = 22;
          const startX = from.x + (dx / dist) * nodeRadius;
          const startY = from.y + (dy / dist) * nodeRadius;
          const endX = to.x - (dx / dist) * (nodeRadius + 8);
          const endY = to.y - (dy / dist) * (nodeRadius + 8);

          return (
            <line
              key={`${conn.from}-${conn.to}-${i}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={isHandoff ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isHandoff ? 1.5 : 1}
              strokeDasharray={isHandoff ? 'none' : '4 4'}
              markerEnd={isHandoff ? 'url(#arrow-solid)' : 'url(#arrow-dashed)'}
            />
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((node, i) => {
          const colors = tierColors[node.agent.tier];
          const initials = node.agent.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <g
              key={`${node.agent.squad || i}-${node.agent.id}`}
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={22}
                fill={colors.stroke}
                stroke={colors.fill}
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.text}
                fontSize={11}
                fontWeight={600}
                fontFamily="ui-monospace, monospace"
              >
                {initials}
              </text>
              <text
                x={node.x}
                y={node.y + 34}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize={10}
              >
                {node.agent.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-tertiary">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-white/20" />
          <span>Handoff</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t border-dashed border-white/15" />
          <span>Receives</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: tierColors[0].stroke, border: `1px solid ${tierColors[0].fill}` }} />
          <span>T0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: tierColors[1].stroke, border: `1px solid ${tierColors[1].fill}` }} />
          <span>T1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: tierColors[2].stroke, border: `1px solid ${tierColors[2].fill}` }} />
          <span>T2</span>
        </div>
      </div>
    </div>
  );
}
