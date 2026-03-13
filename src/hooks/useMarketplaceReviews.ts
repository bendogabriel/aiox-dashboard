/**
 * useMarketplaceReviews — React Query hooks for review operations
 * PRD: PRD-MARKETPLACE | Story: 5.2
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/supabase/marketplace';
import type { ReviewFormData } from '../components/marketplace/reviews/ReviewForm';

/** Create a new review */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: ReviewFormData & { reviewer_id: string }) =>
      marketplaceService.createReview({
        order_id: review.order_id,
        listing_id: review.listing_id,
        reviewer_id: review.reviewer_id,
        rating_overall: review.rating_overall,
        rating_quality: review.rating_quality,
        rating_speed: review.rating_speed,
        rating_value: review.rating_value,
        rating_accuracy: review.rating_accuracy,
        title: review.title || null,
        body: review.body || null,
        is_verified_purchase: true,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'reviews', variables.listing_id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'rating-breakdown', variables.listing_id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-purchases'] });
    },
  });
}

/** Respond to a review (seller) */
export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      marketplaceService.respondToReview(reviewId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'reviews'] });
    },
  });
}

/** Flag a review */
export function useFlagReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      marketplaceService.flagReview(reviewId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'reviews'] });
    },
  });
}
