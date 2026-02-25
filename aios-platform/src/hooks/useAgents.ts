import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '../services/api';
import type { Agent, AgentSummary, AgentCommand, SearchFilters, AgentCommand as AgentCommandType } from '../types';
import { getSquadType } from '../types';

export function useAgents(squadId?: string | null) {
  return useQuery<AgentSummary[]>({
    queryKey: ['agents', squadId || 'all'],
    queryFn: async () => {
      if (squadId) {
        return agentsApi.getAgentsBySquad(squadId);
      }
      // Fetch all agents (increase limit for "All Squads" view)
      return agentsApi.getAgents({ limit: 500 });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce API calls
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

export function useAgent(squadId: string | null, agentId: string | null) {
  return useQuery<Agent | null>({
    queryKey: ['agent', squadId, agentId],
    queryFn: async () => {
      if (!squadId || !agentId) return null;
      return agentsApi.getAgent(squadId, agentId);
    },
    enabled: !!squadId && !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });
}

// Extended agent with UI fields and dynamic capability data
export interface AgentWithUI extends AgentSummary {
  squadType: ReturnType<typeof getSquadType>;
  role: string;
  status: 'online' | 'busy' | 'offline';
  // Dynamic capability data from backend
  commands?: AgentCommand[];
  frameworks?: string[];
  capabilities?: Array<{ type: string; text: string }>;
  sampleTasks?: string[];
}

// Convenience hook when you only have agentId (searches all agents)
// Fetches full agent details including commands for dynamic suggestions
export function useAgentById(agentId: string | null) {
  return useQuery<AgentWithUI | null>({
    queryKey: ['agentById', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      let agent: AgentSummary | null = null;
      let fullAgent: Agent | null = null;

      // First search for the agent to get its squad
      const results = await agentsApi.searchAgents({ query: agentId, limit: 10 });
      agent = results.find((a) => a.id === agentId) || null;

      // If found, fetch full details including commands
      if (agent) {
        try {
          fullAgent = await agentsApi.getAgent(agent.squad, agent.id);
        } catch (e) {
          console.warn(`Could not fetch full agent details for ${agentId}:`, e);
        }
      }

      if (!agent) return null;

      // Merge full agent details if available, otherwise use summary
      const mergedAgent = fullAgent || agent;

      // Enrich with UI fields
      return {
        ...mergedAgent,
        squadType: getSquadType(mergedAgent.squad),
        role: mergedAgent.title || 'Agent',
        status: 'online' as const,
      };
    },
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAgentCommands(squadId: string | null, agentId: string | null) {
  return useQuery<AgentCommand[]>({
    queryKey: ['agentCommands', squadId, agentId],
    queryFn: async () => {
      if (!squadId || !agentId) return [];
      return agentsApi.getAgentCommands(squadId, agentId);
    },
    enabled: !!squadId && !!agentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAgentSearch(filters: SearchFilters) {
  return useQuery<AgentSummary[]>({
    queryKey: ['agents', 'search', filters],
    queryFn: async () => {
      return agentsApi.searchAgents(filters);
    },
    enabled: !!filters.query || !!filters.squad || filters.tier !== undefined,
    staleTime: 1 * 60 * 1000,
  });
}
