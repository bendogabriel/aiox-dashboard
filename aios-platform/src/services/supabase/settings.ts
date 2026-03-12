/**
 * Supabase Settings Service
 * Persistent storage layer for user settings/preferences.
 * Falls back gracefully when Supabase is not configured or the table doesn't exist.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/** Row shape in the user_settings table */
interface SettingRow {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

/** Track whether the table is available (avoids repeated 404 errors) */
let _tableUnavailable = false;

export const supabaseSettingsService = {
  /** Check if Supabase persistence is available */
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null && !_tableUnavailable;
  },

  /** Reset the unavailable flag (e.g., after creating the table) */
  resetAvailability(): void {
    _tableUnavailable = false;
  },

  /** Upsert a single setting by key */
  async upsertSetting(key: string, value: unknown): Promise<void> {
    if (!supabase || _tableUnavailable) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            id: key,
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        );

      if (error) {
        // If the table doesn't exist, stop trying
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          _tableUnavailable = true;
          console.warn('[Supabase Settings] Table user_settings does not exist. Persistence disabled.');
          return;
        }
        console.error('[Supabase Settings] Failed to upsert setting:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Settings] Unexpected error upserting setting:', err);
    }
  },

  /** Get a single setting by key */
  async getSetting<T = unknown>(key: string): Promise<T | null> {
    if (!supabase || _tableUnavailable) return null;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('value')
        .eq('id', key)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          _tableUnavailable = true;
          return null;
        }
        // PGRST116 = no rows found, not an error
        if (error.code === 'PGRST116') return null;
        console.error('[Supabase Settings] Failed to get setting:', error.message);
        return null;
      }

      return (data as SettingRow)?.value as T ?? null;
    } catch (err) {
      console.error('[Supabase Settings] Unexpected error getting setting:', err);
      return null;
    }
  },

  /** Get all settings as a key-value map */
  async getAllSettings(): Promise<Record<string, unknown> | null> {
    if (!supabase || _tableUnavailable) return null;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('key, value')
        .order('key');

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          _tableUnavailable = true;
          return null;
        }
        console.error('[Supabase Settings] Failed to get all settings:', error.message);
        return null;
      }

      const result: Record<string, unknown> = {};
      for (const row of (data as SettingRow[])) {
        result[row.key] = row.value;
      }
      return result;
    } catch (err) {
      console.error('[Supabase Settings] Unexpected error getting all settings:', err);
      return null;
    }
  },

  /** Delete a single setting */
  async deleteSetting(key: string): Promise<void> {
    if (!supabase || _tableUnavailable) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('id', key);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          _tableUnavailable = true;
          return;
        }
        console.error('[Supabase Settings] Failed to delete setting:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Settings] Unexpected error deleting setting:', err);
    }
  },

  /** Bulk upsert multiple settings at once */
  async upsertMany(settings: Record<string, unknown>): Promise<void> {
    if (!supabase || _tableUnavailable) return;

    const rows = Object.entries(settings).map(([key, value]) => ({
      id: key,
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          _tableUnavailable = true;
          console.warn('[Supabase Settings] Table user_settings does not exist. Persistence disabled.');
          return;
        }
        console.error('[Supabase Settings] Failed to bulk upsert settings:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Settings] Unexpected error bulk upserting:', err);
    }
  },
};
