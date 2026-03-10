/**
 * useMarketplaceAdmin — React Query hooks for admin analytics
 * PRD: PRD-MARKETPLACE | Story: 6.3
 */
import { useQuery } from '@tanstack/react-query';
import { marketplaceService } from '../services/supabase/marketplace';

const STALE_5MIN = 1000 * 60 * 5;

interface AdminAnalytics {
  gmv: number;
  commissions: number;
  activeListings: number;
  activeSellers: number;
  activeBuyers: number;
  conversionRate: number;
  disputeRate: number;
  avgReviewTime: number;
  pendingReviews: number;
  topListings: { name: string; revenue: number }[];
  topSellers: { name: string; revenue: number }[];
  ratingBreakdown: Record<number, number>;
}

/** Admin analytics dashboard data */
export function useAdminAnalytics(period: string) {
  return useQuery<AdminAnalytics>({
    queryKey: ['marketplace', 'admin-analytics', period],
    queryFn: () => marketplaceService.getAdminAnalytics(period),
    staleTime: STALE_5MIN,
  });
}
