/**
 * Supabase Roadmap Service
 * Persistent storage layer for roadmap features.
 * Falls back gracefully when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { RoadmapFeature } from '../../stores/roadmapStore';

/** Row shape in the roadmap_features table */
interface RoadmapFeatureRow {
  id: string;
  title: string;
  description: string;
  priority: string;
  impact: string;
  effort: string;
  tags: unknown;
  status: string;
  quarter: string | null;
  squad: string | null;
  created_at: string;
  updated_at: string;
}

/** Convert DB row to RoadmapFeature interface */
function rowToFeature(row: RoadmapFeatureRow): RoadmapFeature {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as RoadmapFeature['priority'],
    impact: row.impact as RoadmapFeature['impact'],
    effort: row.effort as RoadmapFeature['effort'],
    tags: (row.tags as string[]) || [],
    status: row.status as RoadmapFeature['status'],
    quarter: (row.quarter as RoadmapFeature['quarter']) || undefined,
    squad: row.squad || undefined,
  };
}

/** Convert RoadmapFeature to DB row for upsert */
function featureToRow(feature: RoadmapFeature): RoadmapFeatureRow {
  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    priority: feature.priority,
    impact: feature.impact,
    effort: feature.effort,
    tags: feature.tags,
    status: feature.status,
    quarter: feature.quarter || null,
    squad: feature.squad || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const supabaseRoadmapService = {
  /** Internal flag: set to true when the table doesn't exist yet */
  _tableUnavailable: false,

  /** Check if Supabase persistence is available */
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null && !this._tableUnavailable;
  },

  /** Handle table-not-found errors by setting _tableUnavailable */
  _handleError(error: { code?: string; message?: string }, operation: string): void {
    if (error.code === 'PGRST205' || error.message?.includes('roadmap_features')) {
      this._tableUnavailable = true;
      console.warn('[Supabase] roadmap_features table not found — using localStorage only');
    } else {
      console.error(`[Supabase] Failed to ${operation}:`, error.message);
    }
  },

  /** Save or update a feature in Supabase */
  async upsertFeature(feature: RoadmapFeature): Promise<void> {
    if (!supabase || this._tableUnavailable) return;

    const row = featureToRow(feature);
    const { error } = await supabase
      .from('roadmap_features')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      this._handleError(error, 'upsert roadmap feature');
    }
  },

  /** Fetch all roadmap features */
  async listFeatures(): Promise<RoadmapFeature[] | null> {
    if (!supabase || this._tableUnavailable) return null;

    const { data, error } = await supabase
      .from('roadmap_features')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      this._handleError(error, 'list roadmap features');
      return null;
    }

    return (data as RoadmapFeatureRow[]).map(rowToFeature);
  },

  /** Delete a feature by ID */
  async deleteFeature(id: string): Promise<void> {
    if (!supabase || this._tableUnavailable) return;

    const { error } = await supabase
      .from('roadmap_features')
      .delete()
      .eq('id', id);

    if (error) {
      this._handleError(error, 'delete roadmap feature');
    }
  },
};
