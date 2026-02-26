import { create } from 'zustand';
import { getConnectionConfig, type ConnectionMode } from '../lib/connection';

export interface MonitorEvent {
  id: string;
  timestamp: string;
  type: 'tool_call' | 'message' | 'error' | 'system';
  agent: string;
  description: string;
  duration?: number;
  success?: boolean;
}

interface MonitorState {
  connected: boolean;
  connectionMode: ConnectionMode;
  roomId: string | null;
  cliConnected: boolean;
  events: MonitorEvent[];
  currentTool: { name: string; startedAt: string } | null;
  stats: {
    total: number;
    successRate: number;
    errorCount: number;
    activeSessions: number;
  };
  metrics: { cpu: number; memory: number; latency: number; throughput: number };
  alerts: Array<{ id: string; message: string; severity: 'info' | 'warning' | 'error'; timestamp: string; dismissed: boolean }>;
  eventFilters: Set<MonitorEvent['type']>;
  addEvent: (event: MonitorEvent) => void;
  clearEvents: () => void;
  setConnected: (connected: boolean) => void;
  setCurrentTool: (tool: { name: string; startedAt: string } | null) => void;
  setMetrics: (metrics: MonitorState['metrics']) => void;
  addAlert: (alert: MonitorState['alerts'][0]) => void;
  dismissAlert: (id: string) => void;
  toggleEventFilter: (type: MonitorEvent['type']) => void;
  getFilteredEvents: () => MonitorEvent[];
  connectToMonitor: (options?: { roomId?: string; token?: string }) => void;
  disconnectFromMonitor: () => void;
}

const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || 'http://localhost:4001';

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;

// Map server event to MonitorEvent
function mapServerEvent(raw: Record<string, unknown>): MonitorEvent {
  const data = (raw.data || raw) as Record<string, unknown>;
  const type = String(raw.type || data.type || 'system');

  // Map server event types to our types
  let mappedType: MonitorEvent['type'] = 'system';
  if (type.includes('Tool') || type === 'tool_call') mappedType = 'tool_call';
  else if (type === 'message' || type === 'UserPromptSubmit') mappedType = 'message';
  else if (type === 'error' || data.is_error) mappedType = 'error';

  const toolName = data.tool_name as string | undefined;
  const description =
    (data.description as string) ||
    (toolName ? `${type}: ${toolName}` : String(data.tool_result || type));

  return {
    id: String(raw.id || data.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    timestamp: String(raw.timestamp || data.timestamp || new Date().toISOString()),
    type: mappedType,
    agent: String(data.aios_agent || data.agent || 'System'),
    description,
    duration: typeof data.duration === 'number' ? data.duration : undefined,
    success: data.is_error === true ? false : data.success !== undefined ? Boolean(data.success) : undefined,
  };
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  connected: false,
  connectionMode: 'local',
  roomId: null,
  cliConnected: false,
  events: [],
  currentTool: null,
  stats: {
    total: 0,
    successRate: 100,
    errorCount: 0,
    activeSessions: 0,
  },
  metrics: { cpu: 0, memory: 0, latency: 0, throughput: 0 },
  alerts: [],
  eventFilters: new Set(),

  addEvent: (event) =>
    set((state) => {
      const newEvents = [...state.events, event].slice(-50);
      const newErrorCount = newEvents.filter((e) => e.type === 'error').length;
      const newToolCalls = newEvents.filter((e) => e.type === 'tool_call');
      const newSuccessful = newToolCalls.filter((e) => e.success);
      return {
        events: newEvents,
        stats: {
          ...state.stats,
          total: newEvents.length,
          errorCount: newErrorCount,
          successRate: newToolCalls.length > 0
            ? Math.round((newSuccessful.length / newToolCalls.length) * 100)
            : 100,
        },
      };
    }),

  clearEvents: () =>
    set({
      events: [],
      stats: { total: 0, successRate: 100, errorCount: 0, activeSessions: 0 },
    }),

  setConnected: (connected) => set({ connected }),

  setCurrentTool: (tool) => set({ currentTool: tool }),

  setMetrics: (metrics) => set({ metrics }),

  addAlert: (alert) =>
    set((state) => ({ alerts: [...state.alerts, alert] })),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    })),

  toggleEventFilter: (type) =>
    set((state) => {
      const next = new Set(state.eventFilters);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return { eventFilters: next };
    }),

  getFilteredEvents: () => {
    const { events, eventFilters } = get();
    if (eventFilters.size === 0) return events;
    return events.filter((e) => eventFilters.has(e.type));
  },

  connectToMonitor: (options) => {
    const { disconnectFromMonitor } = get();
    disconnectFromMonitor();
    reconnectAttempts = 0;

    // Determine connection config
    const config = getConnectionConfig();

    // Allow override via options (for programmatic connection)
    const roomId = options?.roomId || config.roomId;
    const token = options?.token || config.token;

    set({
      connectionMode: config.mode,
      roomId: roomId || null,
    });

    // In local mode, load initial data via HTTP
    if (config.mode === 'local') {
      Promise.all([
        fetch(`${MONITOR_URL}/events/recent?limit=50`).then((r) => r.ok ? r.json() : []),
        fetch(`${MONITOR_URL}/stats`).then((r) => r.ok ? r.json() : null),
      ])
        .then(([recentEvents, serverStats]) => {
          if (Array.isArray(recentEvents) && recentEvents.length > 0) {
            const mapped = recentEvents.map(mapServerEvent);
            set({ events: mapped.slice(-50) });
          }
          if (serverStats) {
            set((state) => ({
              stats: {
                total: serverStats.total ?? state.stats.total,
                successRate: serverStats.success_rate ?? state.stats.successRate,
                errorCount: serverStats.errors ?? state.stats.errorCount,
                activeSessions: serverStats.sessions_active ?? state.stats.activeSessions,
              },
            }));
          }
        })
        .catch((err) => {
          console.warn('[MonitorStore] Failed to load initial data:', err);
        });
    }

    // Build WebSocket URL
    let wsUrl: string;
    if (config.mode === 'cloud' && roomId && token) {
      // Cloud mode: connect to relay
      const relayUrl = import.meta.env.VITE_RELAY_URL;
      wsUrl = `${relayUrl}/dashboard?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;
    } else {
      // Local mode: connect to monitor server
      const monitorWsUrl = MONITOR_URL.replace(/^http/, 'ws');
      wsUrl = `${monitorWsUrl}/stream`;
    }

    // Open WebSocket
    function openWebSocket() {
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        console.warn('[MonitorStore] Failed to create WebSocket');
        return;
      }

      ws.onopen = () => {
        set({ connected: true });
        reconnectAttempts = 0;
      };

      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);

          // Init message — replay buffer (both local and cloud)
          if (payload.type === 'init' && Array.isArray(payload.events)) {
            const mapped = payload.events.map(mapServerEvent);
            set({ events: mapped.slice(-50) });

            // Cloud mode: track room state
            if (payload.room) {
              set({ cliConnected: payload.room.cliConnected ?? false });
            }
            return;
          }

          // Single event
          if (payload.type === 'event' && payload.event) {
            get().addEvent(mapServerEvent(payload.event));
            return;
          }

          // Room update (cloud mode)
          if (payload.type === 'room_update' && payload.room) {
            set({ cliConnected: payload.room.cliConnected ?? false });
            return;
          }

          if (payload.type === 'pong') return;

          // Treat as a raw event
          get().addEvent(mapServerEvent(payload));
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        set({ connected: false });
        scheduleReconnect();
      };

      ws.onerror = () => {
        set({ connected: false });
      };
    }

    function scheduleReconnect() {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
      const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
      reconnectAttempts++;
      reconnectTimer = setTimeout(openWebSocket, delay);
    }

    openWebSocket();
  },

  disconnectFromMonitor: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.onclose = null; // Prevent reconnect on intentional close
      ws.close();
      ws = null;
    }
    set({ connected: false });
  },
}));
