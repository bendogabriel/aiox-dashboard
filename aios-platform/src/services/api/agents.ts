import { parse as parseYaml } from 'yaml';
import { apiClient } from './client';
import { engineApi } from './engine';
import { getEngineUrl } from '../../lib/connection';
import { useEngineStore } from '../../stores/engineStore';
import type { Agent, AgentSummary, AgentCommand, AgentPersona, SearchFilters } from '../../types';

export interface AgentsParams {
  squad?: string;
  tier?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

/** Check if engine is available (URL configured) */
function hasEngine(): boolean {
  return !!getEngineUrl();
}

/** Check if engine is reachable (URL configured AND status is online) */
function isEngineOnline(): boolean {
  return hasEngine() && useEngineStore.getState().status === 'online';
}

/** Parse rich agent data from engine's YAML content field */
function parseAgentContent(content: string): Partial<Agent> {
  // Extract YAML block from markdown (between ```yaml and ```)
  const yamlMatch = content.match(/```yaml\n([\s\S]*?)```/);
  if (!yamlMatch) return {};

  try {
    const parsed = parseYaml(yamlMatch[1]) as Record<string, unknown>;

    // Extract persona
    const rawPersona = parsed.persona as Record<string, string> | undefined;
    const persona: AgentPersona | undefined = rawPersona ? {
      role: rawPersona.role,
      style: rawPersona.style,
      identity: rawPersona.identity,
      focus: rawPersona.focus,
      background: rawPersona.background,
    } : undefined;

    // Extract agent-level fields
    const rawAgent = parsed.agent as Record<string, unknown> | undefined;
    const whenToUse = typeof rawAgent?.whenToUse === 'string' ? rawAgent.whenToUse.trim() : undefined;
    const icon = typeof rawAgent?.icon === 'string' ? rawAgent.icon : undefined;

    // Extract commands — can be strings ("*help") or objects ({ name, description })
    const rawCommands = parsed.commands as Array<string | Record<string, unknown>> | undefined;
    const commands: AgentCommand[] = [];
    if (Array.isArray(rawCommands)) {
      for (const cmd of rawCommands) {
        if (typeof cmd === 'string') {
          commands.push({ command: cmd, action: cmd });
        } else if (cmd && typeof cmd === 'object') {
          const name = (cmd.name || cmd.command || '') as string;
          commands.push({
            command: name.startsWith('*') ? name : `*${name}`,
            action: (cmd.action || name) as string,
            description: (cmd.description || cmd.purpose || '') as string,
          });
        }
      }
    }

    // Extract core principles
    const rawPrinciples = (parsed.core_principles || parsed.corePrinciples || parsed['core-principles']) as
      Array<string | { principle: string }> | undefined;
    const corePrinciples = Array.isArray(rawPrinciples)
      ? rawPrinciples.map(p => typeof p === 'string' ? p : p.principle).filter(Boolean)
      : undefined;

    // Extract mind source
    const rawMind = (parsed.mind_source || parsed.mindSource || parsed['mind-source']) as Record<string, unknown> | undefined;
    const mindSource = rawMind ? {
      name: rawMind.name as string | undefined,
      credentials: rawMind.credentials as string[] | undefined,
      frameworks: rawMind.frameworks as string[] | undefined,
    } : undefined;

    // Extract voice DNA
    const rawVoice = (parsed.voice_dna || parsed.voiceDna || parsed['voice-dna']) as Record<string, unknown> | undefined;
    const voiceDna = rawVoice ? {
      sentenceStarters: (rawVoice.sentence_starters || rawVoice.sentenceStarters || rawVoice['sentence-starters']) as string[] | undefined,
      vocabulary: rawVoice.vocabulary as { alwaysUse?: string[]; neverUse?: string[] } | undefined,
    } : undefined;

    // Extract anti-patterns
    const rawAnti = (parsed.anti_patterns || parsed.antiPatterns || parsed['anti-patterns']) as Record<string, unknown> | undefined;
    const antiPatterns = rawAnti ? {
      neverDo: (rawAnti.never_do || rawAnti.neverDo || rawAnti['never-do']) as string[] | undefined,
    } : undefined;

    // Extract integration (only agent-level, not tool integration)
    const rawIntegration = parsed.integration as Record<string, unknown> | undefined;
    const integration = rawIntegration && (rawIntegration.receivesFrom || rawIntegration.receives_from || rawIntegration.handoffTo || rawIntegration.handoff_to) ? {
      receivesFrom: (rawIntegration.receivesFrom || rawIntegration.receives_from || rawIntegration['receives-from']) as string[] | undefined,
      handoffTo: (rawIntegration.handoffTo || rawIntegration.handoff_to || rawIntegration['handoff-to']) as string[] | undefined,
    } : undefined;

    // Extract rules as additional principles
    const rawRules = parsed.rules as string[] | undefined;
    const allPrinciples = [
      ...(corePrinciples || []),
      ...(Array.isArray(rawRules) ? rawRules : []),
    ];

    return {
      persona,
      whenToUse,
      icon,
      commands: commands.length > 0 ? commands : undefined,
      corePrinciples: allPrinciples.length > 0 ? allPrinciples : undefined,
      mindSource,
      voiceDna,
      antiPatterns,
      integration,
      quality: {
        hasVoiceDna: !!voiceDna,
        hasAntiPatterns: !!(antiPatterns?.neverDo?.length),
        hasIntegration: !!integration,
      },
    };
  } catch {
    return {};
  }
}

/** Map engine registry agent to AgentSummary */
function toAgentSummary(a: { id: string; name: string; squadId: string; role?: string; description?: string }): AgentSummary {
  return {
    id: a.id,
    name: a.name,
    squad: a.squadId,
    tier: 2,
    title: a.role,
    description: a.description,
  };
}

export const agentsApi = {
  // Get all agents — engine-first, fallback to apiClient
  getAgents: async (params?: AgentsParams): Promise<AgentSummary[]> => {
    if (isEngineOnline()) {
      try {
        const data = await engineApi.getRegistryAgents(params?.squad);
        let agents = data.agents.map(toAgentSummary);
        if (params?.limit) agents = agents.slice(0, params.limit);
        return agents;
      } catch {
        // Engine unavailable — fall through
      }
    }
    if (hasEngine() && !isEngineOnline()) return []; // Engine configured but offline — skip fallback
    const response = await apiClient.get<{ agents: AgentSummary[]; total: number }>('/agents', params);
    return response.agents || [];
  },

  // Search agents — engine-first with client-side filter, fallback to apiClient
  searchAgents: async (filters: SearchFilters): Promise<AgentSummary[]> => {
    if (isEngineOnline()) {
      try {
        const data = await engineApi.getRegistryAgents();
        const query = (filters.query || '').toLowerCase();
        let results = data.agents
          .map(toAgentSummary)
          .filter((a) =>
            a.name.toLowerCase().includes(query) ||
            a.squad.toLowerCase().includes(query) ||
            (a.description || '').toLowerCase().includes(query)
          );
        if (filters.limit) results = results.slice(0, filters.limit);
        return results;
      } catch {
        // Engine unavailable — fall through
      }
    }
    if (hasEngine() && !isEngineOnline()) return []; // Engine configured but offline — skip fallback
    const params: Record<string, string | number | undefined> = {
      q: filters.query,
      limit: filters.limit,
    };
    const response = await apiClient.get<{ results: AgentSummary[]; query: string; total: number }>(
      '/agents/search',
      params
    );
    return response.results || [];
  },

  // Get agents by squad — engine-first
  getAgentsBySquad: async (squadId: string): Promise<AgentSummary[]> => {
    if (isEngineOnline()) {
      try {
        const data = await engineApi.getRegistryAgents(squadId);
        return data.agents.map(toAgentSummary);
      } catch {
        // Engine unavailable — fall through
      }
    }
    if (hasEngine() && !isEngineOnline()) return []; // Engine configured but offline — skip fallback
    const response = await apiClient.get<{ squad: string; agents: AgentSummary[]; total: number }>(
      `/agents/squad/${squadId}`
    );
    return response.agents || [];
  },

  // Get agent by ID — engine-first, parses YAML content for rich data
  getAgent: async (squadId: string, agentId: string): Promise<Agent> => {
    if (isEngineOnline()) {
      try {
        const data = await engineApi.getRegistryAgent(squadId, agentId);
        const richData = data.content ? parseAgentContent(data.content) : {};
        return {
          id: data.id,
          name: data.name,
          squad: data.squadId,
          tier: 2,
          title: data.role,
          description: data.description,
          ...richData,
        };
      } catch {
        // Engine unavailable — fall through
      }
    }
    if (hasEngine() && !isEngineOnline()) {
      throw new Error(`Engine offline — cannot fetch agent ${squadId}/${agentId}`);
    }
    const response = await apiClient.get<{ agent: Agent }>(`/agents/${squadId}/${agentId}`);
    return response.agent;
  },

  // Get agent commands — apiClient only (not parsed by engine registry)
  getAgentCommands: async (squadId: string, agentId: string): Promise<AgentCommand[]> => {
    const response = await apiClient.get<{ agentId: string; commands: AgentCommand[] }>(
      `/agents/${squadId}/${agentId}/commands`
    );
    return response.commands || [];
  },
};

// Named export for convenience
export const searchAgents = agentsApi.searchAgents;
