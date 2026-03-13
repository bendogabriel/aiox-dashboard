// ── Archetype: Edge Case — Huge ──
// 50 squads, 200+ agents — stress test for performance.

import type { ProjectSpec, SquadSpec, AgentSpec } from '../../types';

function generateAgents(squadId: string, count: number): AgentSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `agent-${squadId}-${String(i + 1).padStart(3, '0')}`,
    name: `Agent ${i + 1}`,
    role: `Specialist ${i + 1} for ${squadId}`,
    description: `Handles specialized tasks in domain area ${i + 1}`,
    tier: (i === 0 ? 'orchestrator' : 2) as AgentSpec['tier'],
  }));
}

function generateSquads(count: number, agentsPerSquad: number): SquadSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const id = `squad-${String(i + 1).padStart(3, '0')}`;
    return {
      id,
      name: id,
      displayName: `Squad ${i + 1}`,
      description: `Auto-generated squad number ${i + 1} for stress testing`,
      domain: `domain-${Math.floor(i / 5)}`,
      agents: generateAgents(id, agentsPerSquad),
    };
  });
}

const squads = generateSquads(50, 4);
const totalAgents = squads.reduce((sum, s) => sum + s.agents.length, 0);

export const spec: ProjectSpec = {
  name: 'edge-huge',
  archetype: 'edge-huge',
  description: `Stress test: 50 squads, ${totalAgents} agents. Tests performance and scalability.`,
  aiosCore: {
    constitution: true,
  },
  squads,
  expectations: {
    hasAiosCore: true,
    squadCount: 50,
    agentCount: totalAgents,
    workflowCount: 0,
    taskCount: 0,
    engineStarts: true,
  },
};
