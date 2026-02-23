import { useQuery } from '@tanstack/react-query';
import { agentsApi, mockAgents } from '../services/api';
import type { Agent, AgentSummary, AgentCommand, SearchFilters, AgentCommand as AgentCommandType } from '../types';
import { getSquadType } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export function useAgents(squadId?: string | null) {
  return useQuery<AgentSummary[]>({
    queryKey: ['agents', squadId || 'all'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (squadId) {
          return mockAgents.filter((a) => a.squad === squadId);
        }
        return mockAgents;
      }
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
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const agent = mockAgents.find((a) => a.id === agentId && a.squad === squadId);
        return agent ? { ...agent, squadId: agent.squad } as Agent : null;
      }
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

      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        agent = mockAgents.find((a) => a.id === agentId) || null;
      } else {
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
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return [
          { command: 'analyze', action: 'Analyze input', description: 'Analyze the provided input' },
          { command: 'create', action: 'Create content', description: 'Create new content' },
          { command: 'review', action: 'Review content', description: 'Review and provide feedback' },
        ];
      }
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
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        let results = mockAgents;

        if (filters.query) {
          const query = filters.query.toLowerCase();
          results = results.filter(
            (a) =>
              a.name.toLowerCase().includes(query) ||
              a.title?.toLowerCase().includes(query) ||
              a.description?.toLowerCase().includes(query) ||
              a.whenToUse?.toLowerCase().includes(query)
          );
        }

        if (filters.squad) {
          results = results.filter((a) => a.squad === filters.squad);
        }

        if (filters.tier !== undefined) {
          results = results.filter((a) => a.tier === filters.tier);
        }

        if (filters.limit) {
          results = results.slice(0, filters.limit);
        }

        return results;
      }
      return agentsApi.searchAgents(filters);
    },
    enabled: !!filters.query || !!filters.squad || filters.tier !== undefined,
    staleTime: 1 * 60 * 1000,
  });
}
