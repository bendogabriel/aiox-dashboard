import { parse as parseYaml } from 'yaml';
import { apiClient } from './client';
import { engineApi } from './engine';
import { getEngineUrl } from '../../lib/connection';
import { useEngineStore } from '../../stores/engineStore';
import type { Agent, AgentSummary, AgentCommand, AgentPersona, AgentTier, SearchFilters } from '../../types';
import type { AgentMetadata, AgentPersonaProfile, AgentBoundaries, AgentGitRestrictions, AgentDependencies, AgentAutoClaude, AgentCodeRabbit, AgentRoutingMatrix } from '../../types';

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

    // Extract metadata
    const rawMetadata = parsed.metadata as Record<string, unknown> | undefined;
    const metadata: AgentMetadata | undefined = rawMetadata ? {
      version: rawMetadata.version as string | undefined,
      tier: rawMetadata.tier as string | number | undefined,
      created: rawMetadata.created as string | undefined,
      updated: rawMetadata.updated as string | undefined,
      changelog: rawMetadata.changelog as string[] | undefined,
      influenceSource: (rawMetadata.influence_source || rawMetadata.influenceSource) as string | undefined,
    } : undefined;

    // Extract persona profile
    const rawPersonaProfile = (parsed.persona_profile || parsed.personaProfile) as Record<string, unknown> | undefined;
    const rawComm = rawPersonaProfile?.communication as Record<string, unknown> | undefined;
    const rawGreetingLevels = rawComm?.greeting_levels || rawComm?.greetingLevels;
    const personaProfile: AgentPersonaProfile | undefined = rawPersonaProfile ? {
      archetype: rawPersonaProfile.archetype as string | undefined,
      zodiac: rawPersonaProfile.zodiac as string | undefined,
      communication: rawComm ? {
        tone: rawComm.tone as string | undefined,
        emojiFrequency: (rawComm.emoji_frequency || rawComm.emojiFrequency) as string | undefined,
        vocabulary: rawComm.vocabulary as string[] | undefined,
        greetingLevels: rawGreetingLevels ? {
          minimal: (rawGreetingLevels as Record<string, string>).minimal,
          named: (rawGreetingLevels as Record<string, string>).named,
          archetypal: (rawGreetingLevels as Record<string, string>).archetypal,
        } : undefined,
        signatureClosing: (rawComm.signature_closing || rawComm.signatureClosing) as string | undefined,
      } : undefined,
    } : undefined;

    // Extract boundaries
    const rawBoundaries = (parsed.responsibility_boundaries || parsed.boundaries) as Record<string, unknown> | undefined;
    let boundaries: AgentBoundaries | undefined;
    if (rawBoundaries) {
      const rawDelegations = (rawBoundaries.delegate_to || rawBoundaries.delegations) as Array<Record<string, string>> | undefined;
      boundaries = {
        primaryScope: (rawBoundaries.primary_scope || rawBoundaries.primaryScope) as string[] | undefined,
        delegations: Array.isArray(rawDelegations)
          ? rawDelegations.map(d => ({ to: d.to, when: d.when, retain: d.retain }))
          : undefined,
        exclusiveAuthority: (rawBoundaries.exclusive_authority || rawBoundaries.exclusiveAuthority) as string[] | undefined,
      };
    }

    // Extract git restrictions (can be top-level OR nested inside dependencies)
    const rawDepsObj = parsed.dependencies as Record<string, unknown> | undefined;
    const rawGit = (parsed.git_restrictions || parsed.gitRestrictions || rawDepsObj?.git_restrictions || rawDepsObj?.gitRestrictions) as Record<string, unknown> | undefined;
    const gitRestrictions: AgentGitRestrictions | undefined = rawGit ? {
      allowedOperations: (rawGit.allowed_operations || rawGit.allowedOperations) as string[] | undefined,
      blockedOperations: (rawGit.blocked_operations || rawGit.blockedOperations) as string[] | undefined,
      redirectMessage: (rawGit.redirect_message || rawGit.redirectMessage) as string | undefined,
    } : undefined;

    // Extract dependencies (rawDepsObj already defined above for git/coderabbit fallback)
    const rawDeps = rawDepsObj;
    const agentDependencies: AgentDependencies | undefined = rawDeps ? {
      tasks: rawDeps.tasks as string[] | undefined,
      templates: rawDeps.templates as string[] | undefined,
      checklists: rawDeps.checklists as string[] | undefined,
      tools: rawDeps.tools as string[] | undefined,
      scripts: rawDeps.scripts as string[] | undefined,
      data: rawDeps.data as string[] | undefined,
    } : undefined;

    // Extract autoClaude
    const rawAutoClaude = parsed.autoClaude as Record<string, unknown> | undefined;
    let autoClaude: AgentAutoClaude | undefined;
    if (rawAutoClaude) {
      const rawExec = rawAutoClaude.execution as Record<string, boolean> | undefined;
      const rawRecovery = rawAutoClaude.recovery as Record<string, unknown> | undefined;
      const rawMemory = rawAutoClaude.memory as Record<string, boolean> | undefined;
      autoClaude = {
        version: rawAutoClaude.version as string | undefined,
        execution: rawExec ? {
          canCreatePlan: rawExec.canCreatePlan,
          canCreateContext: rawExec.canCreateContext,
          canExecute: rawExec.canExecute,
          canVerify: rawExec.canVerify,
        } : undefined,
        recovery: rawRecovery ? {
          canTrack: rawRecovery.canTrack as boolean | undefined,
          canRollback: rawRecovery.canRollback as boolean | undefined,
          maxAttempts: rawRecovery.maxAttempts as number | undefined,
          stuckDetection: rawRecovery.stuckDetection as boolean | undefined,
        } : undefined,
        memory: rawMemory ? {
          canCaptureInsights: rawMemory.canCaptureInsights,
          canExtractPatterns: rawMemory.canExtractPatterns,
          canDocumentGotchas: rawMemory.canDocumentGotchas,
        } : undefined,
      };
    }

    // Extract codeRabbit (can be top-level OR nested inside dependencies)
    const rawCodeRabbit = (parsed.coderabbit_integration || parsed.codeRabbit || rawDepsObj?.coderabbit_integration || rawDepsObj?.codeRabbit) as Record<string, unknown> | undefined;
    let codeRabbit: AgentCodeRabbit | undefined;
    if (rawCodeRabbit) {
      const rawSelfHealing = (rawCodeRabbit.self_healing || rawCodeRabbit.selfHealing) as Record<string, unknown> | undefined;
      const rawBehavior = rawCodeRabbit.behavior as Record<string, string> | undefined;
      const rawSeverityHandling = (rawCodeRabbit.severity_handling || rawCodeRabbit.severityHandling || rawBehavior) as Record<string, string> | undefined;
      codeRabbit = {
        enabled: rawCodeRabbit.enabled as boolean | undefined,
        selfHealing: rawSelfHealing ? {
          enabled: rawSelfHealing.enabled as boolean | undefined,
          maxIterations: (rawSelfHealing.max_iterations || rawSelfHealing.maxIterations) as number | undefined,
          timeout: (rawSelfHealing.timeout_minutes || rawSelfHealing.timeout) as number | undefined,
        } : undefined,
        severityHandling: rawSeverityHandling,
      };
    }

    // Extract routing matrix
    const rawRouting = (parsed.routing_matrix || parsed.routingMatrix) as Record<string, unknown> | undefined;
    const routingMatrix: AgentRoutingMatrix | undefined = rawRouting ? {
      inScope: (rawRouting.in_scope || rawRouting.inScope) as string[] | undefined,
      outOfScope: (rawRouting.out_of_scope || rawRouting.outOfScope) as string[] | undefined,
    } : undefined;

    // Parse tier from metadata
    let parsedTier: AgentTier | undefined;
    if (metadata?.tier !== undefined) {
      const tierVal = metadata.tier;
      if (typeof tierVal === 'number' && (tierVal === 0 || tierVal === 1 || tierVal === 2)) {
        parsedTier = tierVal as AgentTier;
      } else if (typeof tierVal === 'string') {
        const tierLower = tierVal.toLowerCase();
        if (tierLower === 'orchestrator') parsedTier = 0;
        else if (tierLower === 'master') parsedTier = 1;
        else {
          const num = Number(tierVal);
          if (num === 0 || num === 1 || num === 2) parsedTier = num as AgentTier;
        }
      }
    }

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
      metadata,
      personaProfile,
      boundaries,
      gitRestrictions,
      agentDependencies,
      autoClaude,
      codeRabbit,
      routingMatrix,
      parsedTier,
    } as Partial<Agent> & { parsedTier?: AgentTier };
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
        const richData = data.content ? parseAgentContent(data.content) as Partial<Agent> & { parsedTier?: AgentTier } : {} as { parsedTier?: AgentTier };
        const { parsedTier, ...agentFields } = richData;
        return {
          id: data.id,
          name: data.name,
          squad: data.squadId,
          tier: (parsedTier ?? 2) as AgentTier,
          title: data.role,
          description: data.description,
          ...agentFields,
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
