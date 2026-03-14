/**
 * Platform Intelligence hooks — React Query wrappers for maturity, health,
 * quality gates, graph, and knowledge endpoints.
 */
import { useQuery } from '@tanstack/react-query';
import { engineApi } from '../services/api/engine';
import type {
  MaturityReport,
  HealthReport,
  QualityGateReport,
  GraphStats,
  KnowledgeStats,
  PlatformStatus,
} from '../services/api/engine';
import { useEngineStore } from '../stores/engineStore';

/** Check if engine is online for conditional fetching */
function useIsEngineOnline() {
  return useEngineStore((s) => s.status) === 'online';
}

// ── Maturity ────────────────────────────────────────────────

export function useMaturity() {
  const online = useIsEngineOnline();
  return useQuery<MaturityReport>({
    queryKey: ['platform', 'maturity'],
    queryFn: () => engineApi.getMaturity(),
    enabled: online,
    staleTime: 2 * 60 * 1000, // 2 minutes (expensive computation)
    gcTime: 10 * 60 * 1000,
  });
}

// ── Squad Health ────────────────────────────────────────────

export function usePlatformHealth(squad?: string) {
  const online = useIsEngineOnline();
  return useQuery<HealthReport>({
    queryKey: ['platform', 'health', squad ?? 'all'],
    queryFn: () => engineApi.getPlatformHealth(squad),
    enabled: online,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ── Quality Gates ───────────────────────────────────────────

export function useQualityGates(squad?: string) {
  const online = useIsEngineOnline();
  return useQuery<QualityGateReport>({
    queryKey: ['platform', 'quality-gates', squad ?? 'all'],
    queryFn: () => engineApi.getQualityGates(squad),
    enabled: online,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ── Integration Graph ───────────────────────────────────────

export function useGraphStats() {
  const online = useIsEngineOnline();
  return useQuery<GraphStats>({
    queryKey: ['platform', 'graph', 'stats'],
    queryFn: () => engineApi.getGraphStats(),
    enabled: online,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useGraphData() {
  const online = useIsEngineOnline();
  return useQuery({
    queryKey: ['platform', 'graph', 'data'],
    queryFn: () => engineApi.getGraphData(),
    enabled: online,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// ── Knowledge ───────────────────────────────────────────────

export function useKnowledgeStats() {
  const online = useIsEngineOnline();
  return useQuery<KnowledgeStats>({
    queryKey: ['platform', 'knowledge', 'stats'],
    queryFn: () => engineApi.getKnowledgeStats(),
    enabled: online,
    staleTime: 5 * 60 * 1000,
  });
}

export function useKnowledgeSearch(query: string) {
  const online = useIsEngineOnline();
  return useQuery({
    queryKey: ['platform', 'knowledge', 'search', query],
    queryFn: () => engineApi.searchKnowledge(query),
    enabled: online && query.length >= 2,
    staleTime: 30 * 1000, // searches are more dynamic
  });
}

// ── Full Status ─────────────────────────────────────────────

export function usePlatformStatus() {
  const online = useIsEngineOnline();
  return useQuery<PlatformStatus>({
    queryKey: ['platform', 'status'],
    queryFn: () => engineApi.getPlatformStatus(),
    enabled: online,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
