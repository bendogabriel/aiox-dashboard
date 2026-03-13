/**
 * useMarketplaceListing — React Query hooks for listing detail, reviews, related
 * PRD: PRD-MARKETPLACE | Story: 3.1, 3.2, 3.3
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/supabase/marketplace';
import { marketplaceKeys } from './useMarketplace';
import type { MarketplaceReview, OrderType } from '../types/marketplace';

const STALE_5MIN = 1000 * 60 * 5;

/** Single listing by slug */
export function useListingBySlug(slug: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'listing-slug', slug],
    queryFn: () => marketplaceService.getListingBySlug(slug!),
    enabled: !!slug,
    staleTime: STALE_5MIN,
  });
}

/** Single listing by ID */
export function useListingById(id: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'listing-id', id],
    queryFn: () => marketplaceService.getListingById(id!),
    enabled: !!id,
    staleTime: STALE_5MIN,
  });
}

/** Reviews for a listing */
export function useListingReviews(listingId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['marketplace', 'reviews', listingId, limit],
    queryFn: () => marketplaceService.getReviewsForListing(listingId!, { limit }),
    enabled: !!listingId,
    staleTime: STALE_5MIN,
  });
}

/** Rating breakdown (star distribution) */
export function useRatingBreakdown(listingId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'rating-breakdown', listingId],
    queryFn: () => marketplaceService.getRatingBreakdown(listingId!),
    enabled: !!listingId,
    staleTime: STALE_5MIN,
  });
}

/** Related listings (same category, exclude current) */
export function useRelatedListings(category: string | null, excludeId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'related', category, excludeId],
    queryFn: async () => {
      if (!category) return { data: [], total: 0, offset: 0, limit: 4 };
      const result = await marketplaceService.getListings({
        category: category as never,
        sort_by: 'top_rated',
        limit: 5,
        offset: 0,
      });
      return {
        ...result,
        data: result.data.filter((l) => l.id !== excludeId).slice(0, 4),
      };
    },
    enabled: !!category,
    staleTime: STALE_5MIN,
  });
}

/** My purchases */
export function useMyPurchases(buyerId: string | null, params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['marketplace', 'my-purchases', buyerId, params],
    queryFn: () => marketplaceService.getMyPurchases(buyerId!, params as never),
    enabled: !!buyerId,
    staleTime: STALE_5MIN,
  });
}

/** Create order mutation */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: {
      listing_id: string;
      seller_id: string;
      buyer_id: string;
      order_type: OrderType;
      task_description?: string;
      hours_contracted?: number;
      subscription_period?: string;
      credits_purchased?: number;
    }) => marketplaceService.createOrder(order as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-purchases'] });
    },
  });
}
