import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  getConnectedEdges,
  getConnectedNodeIds,
} from '../dependency-graph';
import type { IntegrationId, IntegrationStatus } from '../../stores/integrationStore';

const ALL_CONNECTED: Record<IntegrationId, IntegrationStatus> = {
  engine: 'connected',
  supabase: 'connected',
  'api-keys': 'connected',
  whatsapp: 'connected',
  telegram: 'connected',
  voice: 'connected',
  'google-drive': 'connected',
  'google-calendar': 'connected',
};

const MIXED: Record<IntegrationId, IntegrationStatus> = {
  engine: 'connected',
  supabase: 'disconnected',
  'api-keys': 'connected',
  whatsapp: 'disconnected',
  telegram: 'disconnected',
  voice: 'disconnected',
  'google-drive': 'disconnected',
  'google-calendar': 'disconnected',
};

describe('dependency-graph', () => {
  describe('buildDependencyGraph', () => {
    it('creates integration and capability nodes', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);

      const integrationNodes = graph.nodes.filter((n) => n.type === 'integration');
      const capabilityNodes = graph.nodes.filter((n) => n.type === 'capability');

      expect(integrationNodes.length).toBeGreaterThan(0);
      expect(capabilityNodes.length).toBeGreaterThan(0);
    });

    it('creates edges for dependencies', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      expect(graph.edges.length).toBeGreaterThan(0);

      const requiresEdges = graph.edges.filter((e) => e.type === 'requires');
      const enhancedEdges = graph.edges.filter((e) => e.type === 'enhancedBy');

      expect(requiresEdges.length).toBeGreaterThan(0);
      expect(enhancedEdges.length).toBeGreaterThan(0);
    });

    it('reflects integration status in nodes', () => {
      const graph = buildDependencyGraph(MIXED);

      const engineNode = graph.nodes.find((n) => n.id === 'int:engine');
      expect(engineNode?.status).toBe('connected');

      const supabaseNode = graph.nodes.find((n) => n.id === 'int:supabase');
      expect(supabaseNode?.status).toBe('disconnected');
    });

    it('reflects capability levels based on status', () => {
      const graph = buildDependencyGraph(MIXED);

      // Agent execution requires engine (connected) → should be full or degraded
      const agentExec = graph.nodes.find((n) => n.id === 'cap:agent-execution');
      expect(agentExec).toBeTruthy();
      // engine is connected, api-keys enhances → degraded since api-keys is connected
      expect(['full', 'degraded']).toContain(agentExec?.status);

      // WhatsApp messaging requires engine + whatsapp → whatsapp is disconnected
      const waMsging = graph.nodes.find((n) => n.id === 'cap:whatsapp-messaging');
      expect(waMsging?.status).toBe('unavailable');
    });

    it('assigns positions to all nodes', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      for (const node of graph.nodes) {
        expect(node.x).toBeGreaterThan(0);
        expect(node.y).toBeGreaterThan(0);
      }
    });

    it('connects edges to existing nodes', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      const nodeIds = new Set(graph.nodes.map((n) => n.id));
      for (const edge of graph.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }
    });
  });

  describe('getConnectedEdges', () => {
    it('returns edges for a specific node', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      const engineEdges = getConnectedEdges(graph, 'int:engine');
      expect(engineEdges.length).toBeGreaterThan(0);
      engineEdges.forEach((e) => {
        expect(e.from === 'int:engine' || e.to === 'int:engine').toBe(true);
      });
    });

    it('returns empty for unknown node', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      expect(getConnectedEdges(graph, 'int:nonexistent')).toHaveLength(0);
    });
  });

  describe('getConnectedNodeIds', () => {
    it('includes the node itself', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      const ids = getConnectedNodeIds(graph, 'int:engine');
      expect(ids.has('int:engine')).toBe(true);
    });

    it('includes connected capability nodes', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      const ids = getConnectedNodeIds(graph, 'int:engine');
      // Engine should connect to agent-execution at minimum
      expect(ids.has('cap:agent-execution')).toBe(true);
    });

    it('includes connected integration nodes from capability', () => {
      const graph = buildDependencyGraph(ALL_CONNECTED);
      const ids = getConnectedNodeIds(graph, 'cap:whatsapp-messaging');
      // WhatsApp messaging depends on engine + whatsapp
      expect(ids.has('int:engine')).toBe(true);
      expect(ids.has('int:whatsapp')).toBe(true);
    });
  });
});
