import { useQuery } from '@tanstack/react-query';
import {
  fetchTrafficDashboard,
  fetchMetaCampaigns,
  fetchGoogleCampaigns,
  fetchGA4Report,
  fetchGA4Realtime,
  deriveKpis,
} from '../services/api/marketing';
import { useMarketingStore } from '../stores/marketingStore';

/**
 * Fetches unified traffic dashboard data (Meta + Google).
 * Auto-refreshes based on marketingStore.refreshInterval.
 */
export function useTrafficDashboard() {
  const { datePreset, refreshInterval } = useMarketingStore();

  return useQuery({
    queryKey: ['marketing', 'traffic', 'dashboard', datePreset],
    queryFn: () => fetchTrafficDashboard(datePreset),
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    retry: 1,
    select: (data) => ({
      ...data,
      kpis: deriveKpis(data.meta.summary, data.google.summary),
      allCampaigns: [
        ...data.meta.campaigns.map((c) => ({ ...c, platform: 'Meta' as const })),
        ...data.google.campaigns.map((c) => ({
          ...c,
          platform: 'Google' as const,
          objective: '',
          impressions: 0,
          roas: 0,
        })),
      ],
    }),
  });
}

export function useMetaCampaigns() {
  const { datePreset } = useMarketingStore();
  return useQuery({
    queryKey: ['marketing', 'meta', 'campaigns', datePreset],
    queryFn: () => fetchMetaCampaigns(datePreset),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useGoogleCampaigns() {
  return useQuery({
    queryKey: ['marketing', 'google', 'campaigns'],
    queryFn: fetchGoogleCampaigns,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useGA4Report(start?: string, end?: string) {
  return useQuery({
    queryKey: ['marketing', 'ga4', 'report', start, end],
    queryFn: () => fetchGA4Report(start, end),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useGA4Realtime() {
  return useQuery({
    queryKey: ['marketing', 'ga4', 'realtime'],
    queryFn: fetchGA4Realtime,
    staleTime: 30 * 1000, // 30s for realtime
    refetchInterval: 60 * 1000, // refresh every minute
    retry: 1,
  });
}
