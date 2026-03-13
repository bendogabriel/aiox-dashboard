/**
 * useMarketplaceSeller — React Query hooks for seller operations
 * PRD: PRD-MARKETPLACE | Story: 4.1, 4.4
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/supabase/marketplace';
import type { SellerProfile } from '../types/marketplace';

const STALE_5MIN = 1000 * 60 * 5;

/** Current seller profile */
export function useSellerProfile(userId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'seller-profile', userId],
    queryFn: () => marketplaceService.getSellerProfile(userId!),
    enabled: !!userId,
    staleTime: STALE_5MIN,
  });
}

/** Seller listings */
export function useSellerListings(sellerId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'seller-listings', sellerId],
    queryFn: () =>
      marketplaceService.getListings({
        limit: 50,
        offset: 0,
      }),
    enabled: !!sellerId,
    staleTime: STALE_5MIN,
  });
}

/** Seller sales */
export function useSellerSales(sellerId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'seller-sales', sellerId],
    queryFn: () => marketplaceService.getMySales(sellerId!),
    enabled: !!sellerId,
    staleTime: STALE_5MIN,
  });
}

/** Create seller profile */
export function useCreateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<SellerProfile>) =>
      marketplaceService.createSellerProfile(profile as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'seller-profile'] });
    },
  });
}

/** Update seller profile */
export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SellerProfile> }) =>
      marketplaceService.updateSellerProfile(id, updates as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'seller-profile'] });
    },
  });
}

/** Check slug availability */
export function useCheckSlugAvailable(slug: string) {
  return useQuery({
    queryKey: ['marketplace', 'slug-check', slug],
    queryFn: () => marketplaceService.checkSlugAvailable(slug),
    enabled: slug.length >= 3,
    staleTime: 0,
  });
}

/** Seller transactions */
export function useSellerTransactions(sellerId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'seller-transactions', sellerId],
    queryFn: () => marketplaceService.getSellerTransactions(sellerId!),
    enabled: !!sellerId,
    staleTime: STALE_5MIN,
  });
}

/** Submission queue (admin) */
export function useSubmissionQueue() {
  return useQuery({
    queryKey: ['marketplace', 'submission-queue'],
    queryFn: () => marketplaceService.getSubmissionQueue(),
    staleTime: STALE_5MIN,
  });
}
