/**
 * Marketplace Agent Instantiation — Converts marketplace orders into native AIOS agents
 * Story 3.4
 *
 * When an order becomes 'active', the agent_config_snapshot is converted into
 * the native Agent type and registered in the local agent system.
 */
import type { Agent, AgentTier, SquadType } from '../types/index';
import type { MarketplaceOrder, MarketplaceAgentConfig } from '../types/marketplace';

/**
 * Converts a marketplace order's agent_config_snapshot into a native Agent.
 * Agent ID uses prefix `mkt-` to distinguish from core agents.
 */
export function instantiateMarketplaceAgent(order: MarketplaceOrder): Agent {
  const config = order.agent_config_snapshot ?? {};
  const listing = order.listing;

  const agent: Agent = {
    // Identity — prefixed ID for marketplace agents
    id: `mkt-${order.id}`,
    name: listing?.name ?? 'Marketplace Agent',
    title: listing?.tagline ?? undefined,
    icon: listing?.icon ?? undefined,
    description: listing?.description ?? undefined,

    // Classification
    tier: (listing?.agent_tier ?? 2) as AgentTier,
    squad: listing?.squad_type ?? 'default',
    squadType: (listing?.squad_type ?? 'default') as SquadType,
    squadId: listing?.seller_id ?? undefined,

    // Persona & Config
    persona: config.persona ?? undefined,
    corePrinciples: config.corePrinciples ?? undefined,
    commands: config.commands ?? undefined,
    capabilities: config.capabilities ?? listing?.capabilities ?? undefined,
    voiceDna: config.voiceDna ?? undefined,
    antiPatterns: config.antiPatterns ?? undefined,
    integration: config.integration ?? undefined,

    // Status based on order status
    status: mapOrderStatusToAgentStatus(order.status),
    role: config.persona?.role ?? undefined,

    // Quality flags
    quality: {
      hasVoiceDna: !!config.voiceDna,
      hasAntiPatterns: !!config.antiPatterns,
      hasIntegration: !!config.integration,
    },

    // Counts
    commandCount: config.commands?.length ?? 0,
    executionCount: 0,
    lastActive: new Date().toISOString(),
  };

  return agent;
}

/**
 * Maps order status to agent status.
 */
function mapOrderStatusToAgentStatus(
  orderStatus: string,
): 'online' | 'busy' | 'offline' {
  switch (orderStatus) {
    case 'active':
    case 'in_progress':
      return 'online';
    case 'disputed':
      return 'busy';
    case 'completed':
    case 'cancelled':
    case 'refunded':
    case 'pending':
    default:
      return 'offline';
  }
}

/**
 * Checks if an agent ID represents a marketplace agent.
 */
export function isMarketplaceAgent(agentId: string): boolean {
  return agentId.startsWith('mkt-');
}

/**
 * Extracts the order ID from a marketplace agent ID.
 */
export function getOrderIdFromAgentId(agentId: string): string | null {
  if (!isMarketplaceAgent(agentId)) return null;
  return agentId.slice(4); // Remove 'mkt-' prefix
}

/**
 * Extracts marketplace metadata from a marketplace agent.
 */
export function getMarketplaceMetadata(agent: Agent): {
  orderId: string;
  listingId?: string;
  sellerId?: string;
} | null {
  if (!isMarketplaceAgent(agent.id)) return null;
  return {
    orderId: agent.id.slice(4),
    listingId: undefined, // Would need to be stored in agent metadata
    sellerId: agent.squadId ?? undefined,
  };
}
