/**
 * Static persona map for AIOX agents.
 * Source: .aiox-core/development/agents/*.md
 *
 * Preferred over Engine YAML parse — agents change rarely,
 * and agent files are markdown with embedded YAML (fragile to parse).
 */

export interface AgentPersona {
  persona: string;
  icon: string;
}

const AGENT_PERSONAS: Record<string, AgentPersona> = {
  dev: { persona: 'Dex', icon: '💻' },
  qa: { persona: 'Quinn', icon: '✅' },
  architect: { persona: 'Aria', icon: '🏛️' },
  pm: { persona: 'Morgan', icon: '📋' },
  po: { persona: 'Pax', icon: '🎯' },
  sm: { persona: 'River', icon: '🌊' },
  devops: { persona: 'Gage', icon: '⚡' },
  analyst: { persona: 'Alex', icon: '🔍' },
  'data-engineer': { persona: 'Dara', icon: '📊' },
  'ux-design-expert': { persona: 'Uma', icon: '🎨' },
  'aiox-master': { persona: 'Orion', icon: '👑' },
};

/**
 * Get persona name and icon for an agent ID.
 * Falls back to capitalized name + generic icon if ID is unknown.
 */
export function getAgentPersona(agentId: string, fallbackName?: string): AgentPersona {
  const mapped = AGENT_PERSONAS[agentId];
  if (mapped) return mapped;

  const name = fallbackName ?? agentId;
  return {
    persona: name.charAt(0).toUpperCase() + name.slice(1),
    icon: '🤖',
  };
}

/**
 * Format agent display string: "icon persona"
 */
export function formatAgentDisplay(agentId: string, fallbackName?: string): string {
  const { persona, icon } = getAgentPersona(agentId, fallbackName);
  return `${icon} ${persona}`;
}
