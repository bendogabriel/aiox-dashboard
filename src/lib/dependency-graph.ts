/**
 * Dependency Graph Builder — P9
 *
 * Transforms the degradation-map capability definitions + live integration
 * statuses into a graph structure suitable for SVG rendering.
 */

import type { IntegrationId, IntegrationStatus } from '../stores/integrationStore';
import { getCapabilityDefs, computeCapabilities, type Capability, type CapabilityLevel } from './degradation-map';

// ── Graph types ──────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: 'integration' | 'capability';
  status: IntegrationStatus | CapabilityLevel;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'requires' | 'enhancedBy';
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Integration labels ───────────────────────────────────

const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  engine: 'Engine',
  supabase: 'Supabase',
  'api-keys': 'API Keys',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  voice: 'Voice',
  'google-drive': 'G.Drive',
  'google-calendar': 'G.Cal',
};

// ── Layout constants ─────────────────────────────────────

const GRAPH_WIDTH = 720;
const GRAPH_HEIGHT = 420;
const INTEGRATION_Y = 50;
const CAPABILITY_Y = 340;

/**
 * Build graph data from current integration statuses.
 * Left column: integrations (source), Right column: capabilities (targets).
 */
export function buildDependencyGraph(
  statuses: Record<IntegrationId, IntegrationStatus>,
): DependencyGraphData {
  const defs = getCapabilityDefs();
  const caps = computeCapabilities(statuses);
  const capMap = new Map(caps.map((c) => [c.id, c]));

  // Determine which integrations are actually referenced
  const usedIntegrations = new Set<IntegrationId>();
  for (const def of defs) {
    def.requires.forEach((id) => usedIntegrations.add(id));
    (def.enhancedBy || []).forEach((id) => usedIntegrations.add(id));
  }
  const integrationIds = [...usedIntegrations];

  // Layout: integrations on top row, capabilities on bottom row
  const intSpacing = GRAPH_WIDTH / (integrationIds.length + 1);
  const capSpacing = GRAPH_WIDTH / (defs.length + 1);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Integration nodes
  integrationIds.forEach((id, i) => {
    nodes.push({
      id: `int:${id}`,
      label: INTEGRATION_LABELS[id] || id,
      type: 'integration',
      status: statuses[id] || 'disconnected',
      x: intSpacing * (i + 1),
      y: INTEGRATION_Y,
    });
  });

  // Capability nodes
  defs.forEach((def, i) => {
    const cap = capMap.get(def.id);
    nodes.push({
      id: `cap:${def.id}`,
      label: cap?.label || def.id,
      type: 'capability',
      status: cap?.level || 'unavailable',
      x: capSpacing * (i + 1),
      y: CAPABILITY_Y,
    });

    // Edges
    def.requires.forEach((intId) => {
      edges.push({
        from: `int:${intId}`,
        to: `cap:${def.id}`,
        type: 'requires',
      });
    });
    (def.enhancedBy || []).forEach((intId) => {
      edges.push({
        from: `int:${intId}`,
        to: `cap:${def.id}`,
        type: 'enhancedBy',
      });
    });
  });

  return { nodes, edges };
}

/**
 * Get edges connected to a specific node (for hover highlighting).
 */
export function getConnectedEdges(graph: DependencyGraphData, nodeId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.from === nodeId || e.to === nodeId);
}

/**
 * Get nodes connected to a specific node (for hover highlighting).
 */
export function getConnectedNodeIds(graph: DependencyGraphData, nodeId: string): Set<string> {
  const connected = new Set<string>();
  connected.add(nodeId);
  for (const edge of graph.edges) {
    if (edge.from === nodeId) connected.add(edge.to);
    if (edge.to === nodeId) connected.add(edge.from);
  }
  return connected;
}

export { GRAPH_WIDTH, GRAPH_HEIGHT };
