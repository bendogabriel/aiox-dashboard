/**
 * Supabase Brainstorm Rooms Service
 * Persistent storage layer for brainstorm rooms.
 * Falls back gracefully when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { BrainstormRoom } from '../../stores/brainstormStore';

/** Row shape in the brainstorm_rooms table */
interface BrainstormRoomRow {
  id: string;
  name: string;
  description: string | null;
  phase: string;
  ideas: unknown;
  groups: unknown;
  outputs: unknown;
  tags: unknown;
  created_at: string;
  updated_at: string;
}

/** Convert DB row to BrainstormRoom interface */
function rowToRoom(row: BrainstormRoomRow): BrainstormRoom {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    phase: row.phase as BrainstormRoom['phase'],
    ideas: (row.ideas as BrainstormRoom['ideas']) || [],
    groups: (row.groups as BrainstormRoom['groups']) || [],
    outputs: (row.outputs as BrainstormRoom['outputs']) || [],
    tags: (row.tags as BrainstormRoom['tags']) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert BrainstormRoom to DB row for upsert */
function roomToRow(room: BrainstormRoom): BrainstormRoomRow {
  return {
    id: room.id,
    name: room.name,
    description: room.description || null,
    phase: room.phase,
    ideas: room.ideas,
    groups: room.groups,
    outputs: room.outputs,
    tags: room.tags,
    created_at: room.createdAt,
    updated_at: room.updatedAt,
  };
}

export const supabaseBrainstormService = {
  /** Internal flag: set to true when the table doesn't exist yet */
  _tableUnavailable: false,

  /** Check if Supabase persistence is available */
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null && !this._tableUnavailable;
  },

  /** Reset the table unavailable flag (call after table is created) */
  resetTableFlag(): void {
    this._tableUnavailable = false;
  },

  /** Save or update a room in Supabase */
  async upsertRoom(room: BrainstormRoom): Promise<void> {
    if (!supabase || this._tableUnavailable) return;

    const row = roomToRow(room);
    const { error } = await supabase
      .from('brainstorm_rooms')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      // Suppress repeated "table not found" errors
      if (error.code === 'PGRST205' || error.message?.includes('brainstorm_rooms')) {
        this._tableUnavailable = true;
        console.warn('[Supabase] brainstorm_rooms table not found — using localStorage only');
      } else {
        console.error('[Supabase] Failed to upsert brainstorm room:', error.message);
      }
    }
  },

  /** Fetch all brainstorm rooms */
  async listRooms(): Promise<BrainstormRoom[] | null> {
    if (!supabase || this._tableUnavailable) return null;

    const { data, error } = await supabase
      .from('brainstorm_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Suppress repeated "table not found" errors
      if (error.code === 'PGRST205' || error.message?.includes('brainstorm_rooms')) {
        this._tableUnavailable = true;
        console.warn('[Supabase] brainstorm_rooms table not found — using localStorage only');
      } else {
        console.error('[Supabase] Failed to list brainstorm rooms:', error.message);
      }
      return null;
    }

    return (data as BrainstormRoomRow[]).map(rowToRoom);
  },

  /** Fetch a single room by ID */
  async getRoom(roomId: string): Promise<BrainstormRoom | null> {
    if (!supabase || this._tableUnavailable) return null;

    const { data, error } = await supabase
      .from('brainstorm_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !data) return null;
    return rowToRoom(data as BrainstormRoomRow);
  },

  /** Delete a room by ID */
  async deleteRoom(roomId: string): Promise<void> {
    if (!supabase || this._tableUnavailable) return;

    const { error } = await supabase
      .from('brainstorm_rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      if (error.code === 'PGRST205') {
        this._tableUnavailable = true;
      } else {
        console.error('[Supabase] Failed to delete brainstorm room:', error.message);
      }
    }
  },
};
