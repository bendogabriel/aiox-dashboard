/**
 * useMarketplaceAgents — Manages marketplace agent lifecycle
 * Story 3.4
 *
 * Converts active marketplace orders into native Agent instances
 * that can be used in chat, orchestrations, and monitoring.
 */
import { useMemo } from 'react';
import { useMyPurchases } from './useMarketplaceListing';
import { instantiateMarketplaceAgent, isMarketplaceAgent } from '../lib/marketplace';
import type { Agent } from '../types/index';
import type { MarketplaceOrder } from '../types/marketplace';

/**
 * Returns all active marketplace agents for the current user.
 * These agents can be merged with core agents in the agent list.
 */
export function useMarketplaceAgents(buyerId: string | null) {
  const { data } = useMyPurchases(buyerId, { status: 'active' });

  const agents = useMemo(() => {
    const orders = data?.data ?? [];
    return orders
      .filter((o): o is MarketplaceOrder & { agent_config_snapshot: NonNullable<MarketplaceOrder['agent_config_snapshot']> } =>
        o.agent_config_snapshot != null &&
        (o.status === 'active' || o.status === 'in_progress'),
      )
      .map((order) => instantiateMarketplaceAgent(order));
  }, [data]);

  return agents;
}

/**
 * Hook to check if a given agent is from the marketplace.
 */
export function useIsMarketplaceAgent(agentId: string | null): boolean {
  return agentId ? isMarketplaceAgent(agentId) : false;
}

/**
 * Deactivates a marketplace agent when order expires/cancels.
 * Returns a callback that should be called when order status changes.
 */
export function useDeactivateMarketplaceAgent() {
  return (agentId: string) => {
    if (!isMarketplaceAgent(agentId)) return;
    // In a full implementation, this would:
    // 1. Remove agent from local agent store
    // 2. Close any active chat sessions
    // 3. Remove from orchestration pools
    console.log(`[Marketplace] Deactivating agent: ${agentId}`);
  };
}
