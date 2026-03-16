import { create } from 'zustand';

export interface PresenceUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  currentView: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

interface PresenceState {
  users: PresenceUser[];
  wsClientCount: number;
  engineConnected: boolean;
  showCursors: boolean;
  setShowCursors: (show: boolean) => void;
  setEngineStatus: (connected: boolean, wsClients?: number) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: [],
  wsClientCount: 0,
  engineConnected: false,
  showCursors: true,
  setShowCursors: (show) => set({ showCursors: show }),
  setEngineStatus: (connected, wsClients) => set({
    engineConnected: connected,
    wsClientCount: wsClients ?? 0,
    // Generate presence entries from WS client count
    users: connected && wsClients
      ? Array.from({ length: wsClients }, (_, i) => ({
          id: `ws-${i}`,
          name: `Client ${i + 1}`,
          avatar: `C${i + 1}`,
          color: ['#3B82F6', '#10B981', '#D4A843', '#EF4444', '#8B5CF6'][i % 5],
          currentView: 'dashboard',
          lastSeen: Date.now(),
        }))
      : [],
  }),
}));
