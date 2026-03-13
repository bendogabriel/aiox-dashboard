/**
 * Supabase Creative Votes Service
 * Persistent storage for creative gallery approval/rejection and dispatch tracking.
 * Falls back gracefully when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export type VoteStatus = 'approved' | 'rejected' | 'pending';
export type DispatchStatus = 'idle' | 'dispatching' | 'executing' | 'completed' | 'failed';

export interface CreativeVoteRow {
  id: string;
  gallery_id: string;
  creative_id: string;
  vote: VoteStatus;
  voted_by: string;
  voted_at: string;
  dispatch_status: DispatchStatus;
  dispatch_job_id: string | null;
  dispatch_result: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const creativeVotesService = {
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  async upsertVote(
    galleryId: string,
    creativeId: string,
    vote: VoteStatus,
    notes?: string,
  ): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('creative_votes')
      .upsert(
        {
          gallery_id: galleryId,
          creative_id: creativeId,
          vote,
          voted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(notes !== undefined ? { notes } : {}),
        },
        { onConflict: 'gallery_id,creative_id' },
      );

    if (error) {
      console.error('[Supabase] Failed to upsert creative vote:', error.message);
    }
  },

  async getVotes(galleryId: string): Promise<CreativeVoteRow[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('creative_votes')
      .select('*')
      .eq('gallery_id', galleryId);

    if (error) {
      console.error('[Supabase] Failed to get creative votes:', error.message);
      return [];
    }

    return (data as CreativeVoteRow[]) || [];
  },

  async updateDispatchStatus(
    galleryId: string,
    creativeId: string,
    status: DispatchStatus,
    jobId?: string,
    result?: Record<string, unknown>,
  ): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('creative_votes')
      .update({
        dispatch_status: status,
        updated_at: new Date().toISOString(),
        ...(jobId !== undefined ? { dispatch_job_id: jobId } : {}),
        ...(result !== undefined ? { dispatch_result: result } : {}),
      })
      .eq('gallery_id', galleryId)
      .eq('creative_id', creativeId);

    if (error) {
      console.error('[Supabase] Failed to update dispatch status:', error.message);
    }
  },

  async getApproved(galleryId: string): Promise<CreativeVoteRow[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('creative_votes')
      .select('*')
      .eq('gallery_id', galleryId)
      .eq('vote', 'approved')
      .neq('dispatch_status', 'completed');

    if (error) {
      console.error('[Supabase] Failed to get approved votes:', error.message);
      return [];
    }

    return (data as CreativeVoteRow[]) || [];
  },
};
