/**
 * useMarketplace — React Query hooks for marketplace data fetching
 * PRD: PRD-MARKETPLACE | Story: 2.1, 2.2, 2.3
 */
import { useQuery } from '@tanstack/react-query';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { marketplaceService } from '../services/supabase/marketplace';
import type { MarketplaceFilters, MarketplaceListing, MarketplaceCategory } from '../types/marketplace';

const STALE_5MIN = 1000 * 60 * 5;

/** Fetch listings with current store filters */
export function useMarketplaceListings() {
  const filters = useMarketplaceStore((s) => s.filters);

  return useQuery({
    queryKey: ['marketplace', 'listings', filters],
    queryFn: () => marketplaceService.getListings(filters),
    staleTime: STALE_5MIN,
    placeholderData: (prev) => prev,
  });
}

/** Fetch featured listings (top 6) */
export function useFeaturedListings() {
  return useQuery({
    queryKey: ['marketplace', 'featured'],
    queryFn: () =>
      marketplaceService.getListings({
        featured_only: true,
        sort_by: 'popular',
        limit: 6,
        offset: 0,
      }),
    staleTime: STALE_5MIN,
  });
}

/** Fetch category counts for category nav */
export function useCategoryCounts() {
  return useQuery({
    queryKey: ['marketplace', 'category-counts'],
    queryFn: () => marketplaceService.getCategoryCounts(),
    staleTime: STALE_5MIN,
  });
}

/** Search suggestions (top 5 matching listing names) */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['marketplace', 'suggestions', query],
    queryFn: () =>
      marketplaceService.getListings({
        query,
        limit: 5,
        offset: 0,
      }),
    enabled: query.length >= 2,
    staleTime: STALE_5MIN,
  });
}

/** Single listing by slug (for detail page) */
export function useMarketplaceListing(slug: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'listing', slug],
    queryFn: async (): Promise<MarketplaceListing | null> => {
      if (!slug) return null;
      const res = await marketplaceService.getListings({
        limit: 1,
        offset: 0,
      });
      // Fallback: search by slug in returned data
      // In production, service would have a getBySlug method
      return res.data.find((l) => l.slug === slug) ?? null;
    },
    enabled: !!slug,
    staleTime: STALE_5MIN,
  });
}

/** Helper to build query key for cache invalidation */
export const marketplaceKeys = {
  all: ['marketplace'] as const,
  listings: (filters?: MarketplaceFilters) =>
    filters ? (['marketplace', 'listings', filters] as const) : (['marketplace', 'listings'] as const),
  featured: ['marketplace', 'featured'] as const,
  categoryCounts: ['marketplace', 'category-counts'] as const,
  listing: (slug: string) => ['marketplace', 'listing', slug] as const,
};
