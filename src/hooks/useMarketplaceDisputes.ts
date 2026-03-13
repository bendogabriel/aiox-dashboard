/**
 * useMarketplaceDisputes — React Query hooks for dispute operations
 * PRD: PRD-MARKETPLACE | Story: 3.5
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/supabase/marketplace';
import type { DisputeFormData } from '../components/marketplace/disputes/DisputeForm';

const STALE_5MIN = 1000 * 60 * 5;

/** Get dispute for an order */
export function useOrderDispute(orderId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'dispute', orderId],
    queryFn: () => marketplaceService.getDisputeByOrder(orderId!),
    enabled: !!orderId,
    staleTime: STALE_5MIN,
  });
}

/** Open a dispute */
export function useCreateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DisputeFormData & { opened_by: string }) =>
      marketplaceService.createDispute({
        order_id: data.order_id,
        opened_by: data.opened_by,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence,
        status: 'open',
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'dispute', variables.order_id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-purchases'] });
    },
  });
}

/** Update dispute status (admin/seller) */
export function useUpdateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      disputeId,
      ...updates
    }: {
      disputeId: string;
      status: 'seller_response' | 'mediation' | 'resolved' | 'escalated';
      resolution?: string;
      resolved_amount?: number;
      resolved_by?: string;
      seller_responded_at?: string;
    }) => marketplaceService.updateDisputeStatus(disputeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'dispute'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-purchases'] });
    },
  });
}
