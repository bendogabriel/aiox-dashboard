import { describe, it, expect } from 'vitest';
import { usePresenceStore } from '../presenceStore';

describe('presenceStore', () => {
  it('should start with empty users (no demo data)', () => {
    const { users } = usePresenceStore.getState();
    expect(users).toEqual([]);
  });

  it('should start with engine disconnected', () => {
    const { engineConnected, wsClientCount } = usePresenceStore.getState();
    expect(engineConnected).toBe(false);
    expect(wsClientCount).toBe(0);
  });

  it('should update engine status and generate users from ws client count', () => {
    usePresenceStore.getState().setEngineStatus(true, 3);
    const state = usePresenceStore.getState();
    expect(state.engineConnected).toBe(true);
    expect(state.wsClientCount).toBe(3);
    expect(state.users.length).toBe(3);
    state.users.forEach((u) => {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.avatar).toBeTruthy();
      expect(u.color).toBeTruthy();
      expect(u.lastSeen).toBeGreaterThan(0);
    });
  });

  it('should clear users when engine goes offline', () => {
    usePresenceStore.getState().setEngineStatus(true, 2);
    expect(usePresenceStore.getState().users.length).toBe(2);
    usePresenceStore.getState().setEngineStatus(false);
    expect(usePresenceStore.getState().users).toEqual([]);
    expect(usePresenceStore.getState().engineConnected).toBe(false);
  });

  it('should toggle showCursors', () => {
    expect(usePresenceStore.getState().showCursors).toBe(true);
    usePresenceStore.getState().setShowCursors(false);
    expect(usePresenceStore.getState().showCursors).toBe(false);
  });
});
