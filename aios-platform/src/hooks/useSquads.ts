import { useQuery } from '@tanstack/react-query';
import { squadsApi, mockSquads } from '../services/api';
import type { Squad, SquadDetail, SquadStats, EcosystemOverview, SquadType } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Map squad ID or domain to UI SquadType (updated 2026-02-06)
function inferSquadType(squad: Squad): SquadType {
  const id = squad.id.toLowerCase();
  const domain = squad.domain?.toLowerCase() || '';

  // Check by ID first
  if (id.includes('copy') || id.includes('sales') || id.includes('media-buy') || id.includes('funnel')) return 'copywriting';
  if (id.includes('design') || id.includes('creative-studio')) return 'design';
  if (id.includes('content-ecosystem') || id.includes('youtube') || id.includes('dev') || id.includes('full-stack')) return 'creator';
  if (id.includes('orquest') || id.includes('analytics') || id.includes('project') || id.includes('squad-creator') || id.includes('operations')) return 'orchestrator';

  // Check by domain
  if (domain.includes('copy') || domain.includes('sales') || domain.includes('communication') || domain.includes('advertising')) return 'copywriting';
  if (domain.includes('design') || domain.includes('visual')) return 'design';
  if (domain.includes('engineering') || domain.includes('video') || domain.includes('content')) return 'creator';
  if (domain.includes('orchestration') || domain.includes('analytics') || domain.includes('project') || domain.includes('operations')) return 'orchestrator';

  return 'default';
}

// Enrich squad with UI type
function enrichSquad(squad: Squad): Squad {
  return {
    ...squad,
    type: squad.type || inferSquadType(squad),
  };
}

export function useSquads() {
  return useQuery<Squad[]>({
    queryKey: ['squads'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockSquads;
      }
      const squads = await squadsApi.getSquads();
      return squads.map(enrichSquad);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

export function useSquad(squadId: string | null) {
  return useQuery<SquadDetail | null>({
    queryKey: ['squad', squadId],
    queryFn: async () => {
      if (!squadId) return null;
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const squad = mockSquads.find((s) => s.id === squadId);
        return squad ? { ...squad, agents: [] } as SquadDetail : null;
      }
      return squadsApi.getSquad(squadId);
    },
    enabled: !!squadId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSquadStats(squadId: string | null) {
  return useQuery<SquadStats | null>({
    queryKey: ['squadStats', squadId],
    queryFn: async () => {
      if (!squadId) return null;
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          squadId,
          stats: {
            totalAgents: 10,
            byTier: { tier0: 1, tier1: 4, tier2: 5 },
            quality: {
              withVoiceDna: 8,
              withAntiPatterns: 6,
              withIntegration: 7,
            },
            commands: {
              total: 45,
              byAgent: [],
            },
            qualityScore: 70,
          },
        };
      }
      return squadsApi.getSquadStats(squadId);
    },
    enabled: !!squadId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEcosystemOverview() {
  return useQuery<EcosystemOverview>({
    queryKey: ['ecosystemOverview'],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          totalSquads: mockSquads.length,
          totalAgents: mockSquads.reduce((sum, s) => sum + s.agentCount, 0),
          squads: mockSquads.map((s) => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            domain: s.domain,
            agentCount: s.agentCount,
            tiers: {
              orchestrators: 1,
              masters: Math.floor(s.agentCount / 3),
              specialists: Math.ceil((s.agentCount * 2) / 3),
            },
          })),
        };
      }
      return squadsApi.getEcosystemOverview();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
