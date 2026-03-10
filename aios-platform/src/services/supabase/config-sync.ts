/**
 * Team Config Sync — P18
 *
 * Synchronizes integration profiles across team members via Supabase.
 * Falls back gracefully when Supabase is not configured.
 *
 * Table: team_config_profiles
 *   - id (uuid, PK)
 *   - name (text)
 *   - description (text)
 *   - configs (jsonb)
 *   - settings (jsonb)
 *   - created_by (text)
 *   - updated_at (timestamptz)
 *   - created_at (timestamptz)
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { IntegrationId, IntegrationConfig } from '../../stores/integrationStore';

// ── Types ─────────────────────────────────────────────────

export interface TeamProfile {
  id: string;
  name: string;
  description: string;
  configs: Partial<Record<IntegrationId, IntegrationConfig>>;
  settings: Record<string, string | undefined>;
  created_by: string;
  updated_at: string;
  created_at: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  data?: TeamProfile | TeamProfile[];
}

// ── Guard ─────────────────────────────────────────────────

function requireSupabase(): NonNullable<typeof supabase> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured');
  }
  return supabase;
}

// ── CRUD Operations ──────────────────────────────────────

/**
 * List all shared team profiles.
 */
export async function listTeamProfiles(): Promise<SyncResult> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from('team_config_profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as TeamProfile[] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Get a single team profile by ID.
 */
export async function getTeamProfile(id: string): Promise<SyncResult> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from('team_config_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as TeamProfile };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Create or update a team profile (upsert by name).
 */
export async function upsertTeamProfile(
  profile: Omit<TeamProfile, 'id' | 'created_at' | 'updated_at'>,
): Promise<SyncResult> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from('team_config_profiles')
      .upsert(
        {
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'name' },
      )
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as TeamProfile };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Delete a team profile by ID.
 */
export async function deleteTeamProfile(id: string): Promise<SyncResult> {
  try {
    const client = requireSupabase();
    const { error } = await client
      .from('team_config_profiles')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Check if the team_config_profiles table exists and is accessible.
 */
export async function checkSyncAvailability(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('team_config_profiles')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
