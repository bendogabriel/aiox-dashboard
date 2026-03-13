/**
 * Supabase Artifacts Service
 * Persistent storage for parsed task artifacts.
 * Falls back gracefully when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { TaskArtifact } from '../api/tasks';

interface ArtifactRow {
  id: string;
  task_id: string;
  step_id: string;
  step_name: string;
  type: string;
  language: string | null;
  filename: string | null;
  title: string | null;
  content: string;
  content_hash: string | null;
  token_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

function rowToArtifact(row: ArtifactRow): TaskArtifact & { taskId: string; stepId: string; stepName: string } {
  return {
    id: row.id,
    type: row.type as TaskArtifact['type'],
    language: row.language || undefined,
    filename: row.filename || undefined,
    title: row.title || undefined,
    content: row.content,
    taskId: row.task_id,
    stepId: row.step_id,
    stepName: row.step_name,
  };
}

/** Simple SHA-256 hash using Web Crypto API */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const supabaseArtifactsService = {
  _tableUnavailable: false,

  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null && !this._tableUnavailable;
  },

  /** Save artifacts for a completed task step */
  async saveArtifacts(
    taskId: string,
    stepId: string,
    stepName: string,
    artifacts: TaskArtifact[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!supabase || this._tableUnavailable) return;

    const rows: ArtifactRow[] = [];
    for (const artifact of artifacts) {
      const hash = await sha256(artifact.content);
      rows.push({
        id: crypto.randomUUID(),
        task_id: taskId,
        step_id: stepId,
        step_name: stepName,
        type: artifact.type,
        language: artifact.language || null,
        filename: artifact.filename || null,
        title: artifact.title || null,
        content: artifact.content,
        content_hash: hash,
        token_count: Math.ceil(artifact.content.length / 4),
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      });
    }

    if (rows.length === 0) return;

    // Remove previous artifacts for this step (idempotent on retry)
    await supabase
      .from('task_artifacts')
      .delete()
      .eq('task_id', taskId)
      .eq('step_id', stepId);

    const { error } = await supabase
      .from('task_artifacts')
      .insert(rows);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('task_artifacts')) {
        this._tableUnavailable = true;
        console.warn('[Supabase] task_artifacts table not found — skipping persistence');
      } else {
        console.error('[Supabase] Failed to save artifacts:', error.message);
      }
    }
  },

  /** Get all artifacts for a task */
  async getArtifactsByTask(taskId: string): Promise<TaskArtifact[] | null> {
    if (!supabase || this._tableUnavailable) return null;

    const { data, error } = await supabase
      .from('task_artifacts')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('task_artifacts')) {
        this._tableUnavailable = true;
      }
      return null;
    }

    return (data as ArtifactRow[]).map(rowToArtifact);
  },

  /** Search artifacts by type and/or language */
  async searchArtifacts(params: {
    type?: string;
    language?: string;
    limit?: number;
  }): Promise<TaskArtifact[] | null> {
    if (!supabase || this._tableUnavailable) return null;

    let query = supabase
      .from('task_artifacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params.limit || 50);

    if (params.type) query = query.eq('type', params.type);
    if (params.language) query = query.eq('language', params.language);

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('task_artifacts')) {
        this._tableUnavailable = true;
      }
      return null;
    }

    return (data as ArtifactRow[]).map(rowToArtifact);
  },

  /** Get artifact statistics */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  } | null> {
    if (!supabase || this._tableUnavailable) return null;

    const { data, error } = await supabase
      .from('task_artifacts')
      .select('type');

    if (error) return null;

    const byType: Record<string, number> = {};
    for (const row of data || []) {
      byType[row.type] = (byType[row.type] || 0) + 1;
    }

    return {
      total: data?.length || 0,
      byType,
    };
  },
};
