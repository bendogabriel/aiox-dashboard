import { useQuery } from '@tanstack/react-query';
import { squadsApi } from '../services/api';
import { useEngineStore } from '../stores/engineStore';
import type { Squad, SquadDetail, SquadStats, EcosystemOverview } from '../types';
import { getSquadType } from '../types';
import type { AgentConnection } from '../mocks/squads';
import { mockConnections } from '../mocks/squads';

// Enrich squad with UI type — delegates to centralized getSquadType() with domain fallback
function enrichSquad(squad: Squad): Squad {
  return {
    ...squad,
    type: squad.type || getSquadType(squad.id, squad.domain),
  };
}

export function useSquads() {
  // Include engine status in queryKey so squads refetch when engine comes online
  const engineStatus = useEngineStore((s) => s.status);
  return useQuery<Squad[]>({
    queryKey: ['squads', engineStatus],
    queryFn: async () => {
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
      return squadsApi.getEcosystemOverview();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSquadConnections(squadId: string | null) {
  return useQuery<AgentConnection[]>({
    queryKey: ['squadConnections', squadId],
    queryFn: async () => {
      if (!squadId) return mockConnections;
      try {
        return await squadsApi.getSquadConnections(squadId);
      } catch {
        // Fallback to mock data when backend doesn't support this endpoint yet
        return mockConnections;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
