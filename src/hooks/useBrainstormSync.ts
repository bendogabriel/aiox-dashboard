/**
 * useBrainstormSync — Supabase sync hook for brainstorm rooms.
 *
 * On mount: loads rooms from Supabase and merges with localStorage.
 * After mutations: debounce-saves changed rooms to Supabase (2s).
 * Falls back gracefully if Supabase is unavailable (localStorage only).
 * Supabase is the source of truth when available.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useBrainstormStore } from '../stores/brainstormStore';
import { supabaseBrainstormService } from '../services/supabase/brainstorm';
import type { BrainstormRoom } from '../stores/brainstormStore';

/** Merge Supabase rooms with localStorage rooms.
 *  - Rooms only in Supabase: added
 *  - Rooms only in localStorage: kept (will be synced up on next save)
 *  - Rooms in both: Supabase wins if its updatedAt is newer, else keep local
 */
function mergeRooms(
  localRooms: BrainstormRoom[],
  remoteRooms: BrainstormRoom[]
): BrainstormRoom[] {
  const merged = new Map<string, BrainstormRoom>();

  // Start with local rooms
  for (const room of localRooms) {
    merged.set(room.id, room);
  }

  // Overlay remote rooms (Supabase is source of truth when newer)
  for (const remote of remoteRooms) {
    const local = merged.get(remote.id);
    if (!local || remote.updatedAt >= local.updatedAt) {
      merged.set(remote.id, remote);
    }
  }

  return Array.from(merged.values());
}

export function useBrainstormSync(): void {
  const rooms = useBrainstormStore((s) => s.rooms);
  const hasMounted = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRoomsRef = useRef<string>('');

  // ── Initial load: merge Supabase → localStorage ─────────────────
  useEffect(() => {
    if (!supabaseBrainstormService.isAvailable()) return;

    let cancelled = false;

    (async () => {
      try {
        const remoteRooms = await supabaseBrainstormService.listRooms();
        if (cancelled || !remoteRooms) return;

        const localRooms = useBrainstormStore.getState().rooms;
        const merged = mergeRooms(localRooms, remoteRooms);

        // Only update if there are actual differences
        const localIds = new Set(localRooms.map((r) => `${r.id}:${r.updatedAt}`));
        const mergedIds = new Set(merged.map((r) => `${r.id}:${r.updatedAt}`));
        const hasChanges =
          localIds.size !== mergedIds.size ||
          [...mergedIds].some((id) => !localIds.has(id));

        if (hasChanges) {
          useBrainstormStore.setState({ rooms: merged });
        }

        // Sync any local-only rooms up to Supabase
        const remoteIdSet = new Set(remoteRooms.map((r) => r.id));
        const localOnlyRooms = localRooms.filter((r) => !remoteIdSet.has(r.id));
        for (const room of localOnlyRooms) {
          await supabaseBrainstormService.upsertRoom(room);
        }
      } catch (err) {
        console.error('[BrainstormSync] Initial load failed, using localStorage:', err);
      } finally {
        hasMounted.current = true;
        // Snapshot current rooms so we don't immediately trigger a save
        previousRoomsRef.current = JSON.stringify(useBrainstormStore.getState().rooms);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount

  // ── Debounced save on room changes ──────────────────────────────
  const saveToSupabase = useCallback(async (roomsToSave: BrainstormRoom[]) => {
    if (!supabaseBrainstormService.isAvailable()) return;

    try {
      // Upsert all rooms (Supabase handles conflict resolution)
      await Promise.all(
        roomsToSave.map((room) => supabaseBrainstormService.upsertRoom(room))
      );
    } catch (err) {
      console.error('[BrainstormSync] Failed to save rooms to Supabase:', err);
    }
  }, []);

  useEffect(() => {
    // Skip until initial load completes
    if (!hasMounted.current) return;
    if (!supabaseBrainstormService.isAvailable()) return;

    const currentSnapshot = JSON.stringify(rooms);

    // Skip if nothing changed
    if (currentSnapshot === previousRoomsRef.current) return;

    // Detect deleted rooms and remove from Supabase
    const currentIds = new Set(rooms.map((r) => r.id));
    try {
      const prevRooms: BrainstormRoom[] = JSON.parse(previousRoomsRef.current || '[]');
      for (const prev of prevRooms) {
        if (!currentIds.has(prev.id)) {
          supabaseBrainstormService.deleteRoom(prev.id);
        }
      }
    } catch {
      // previousRoomsRef may not be parseable on first change, that's fine
    }

    // Update snapshot after deletion check
    previousRoomsRef.current = currentSnapshot;

    // Debounce the upsert (2 seconds)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      saveToSupabase(rooms);
    }, 2000);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [rooms, saveToSupabase]);
}
