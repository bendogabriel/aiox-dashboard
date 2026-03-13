import { useEffect, useRef, useCallback } from 'react';
import { useMonitorStore, type MonitorEvent } from '../stores/monitorStore';
import { useEngineStore } from '../stores/engineStore';
import { getEngineUrl } from '../lib/connection';

/** SSE endpoint (proxied to engine via Vite/nginx) */
const SSE_URL = '/api/monitor/events';

/** Max reconnect attempts before giving up on SSE */
const MAX_RECONNECT_ATTEMPTS = 3;

/** Base delay for exponential backoff (ms) */
const BASE_RECONNECT_DELAY = 2000;

/**
 * Map engine event types to MonitorEvent types.
 * The engine sends types like 'execution:completed', but MonitorEvent
 * expects 'tool_call' | 'message' | 'error' | 'system'.
 */
function mapSSEEventType(raw: string): MonitorEvent['type'] {
  if (raw === 'execution:failed' || raw === 'error') return 'error';
  if (raw === 'execution:completed' || raw === 'message') return 'message';
  if (raw === 'execution:started' || raw === 'tool_call') return 'tool_call';
  return 'system';
}

/**
 * Convert a raw SSE event payload into a MonitorEvent.
 * The engine sends: { id, type, agent, command, timestamp, status }
 * MonitorEvent expects: { id, type, agent, description, timestamp, success?, duration? }
 */
function mapSSEPayloadToEvent(raw: Record<string, unknown>): MonitorEvent | null {
  const id = raw.id as string | undefined;
  if (!id) return null;

  return {
    id: String(id),
    timestamp: String(raw.timestamp || new Date().toISOString()),
    type: mapSSEEventType(String(raw.type || 'system')),
    agent: String(raw.agent || 'engine'),
    description: String(raw.description || raw.command || raw.type || ''),
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
    success: raw.status === 'failed' ? false : raw.status === 'done' ? true : undefined,
  };
}

/**
 * Hook that connects the MonitorStore to a real-time event feed.
 *
 * Connection strategy:
 *   1. Subscribe to engineStore — react to engine coming online/offline
 *   2. When engine is online: try SSE, fall back to WebSocket
 *   3. When engine is offline: seed demo data (no console noise)
 *   4. When engine comes back online: automatically reconnect
 *
 * Returns `{ connect, disconnect }` for manual control.
 */
export function useMonitorSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const connectedViaRef = useRef<'sse' | 'ws' | 'demo' | 'none'>('none');

  const {
    disconnectFromMonitor: disconnectWS,
  } = useMonitorStore.getState();

  const cleanupSSE = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  /** Seed demo events when no backend is available */
  const seedDemoData = useCallback(() => {
    const state = useMonitorStore.getState();
    // Don't overwrite real data with demo data
    if (state.connectionSource === 'sse' || state.connectionSource === 'ws') return;
    if (state.events.length > 0 && state.connectionSource === 'demo') return;

    useMonitorStore.setState({ connectionSource: 'demo' });
    connectedViaRef.current = 'demo';

    const demoEvents: MonitorEvent[] = [
      { id: 'demo-1', timestamp: new Date(Date.now() - 30000).toISOString(), type: 'tool_call', agent: '@dev', description: 'Read src/components/kanban/KanbanBoard.tsx', duration: 120, success: true },
      { id: 'demo-2', timestamp: new Date(Date.now() - 60000).toISOString(), type: 'tool_call', agent: '@dev', description: 'Edit src/stores/storyStore.ts', duration: 85, success: true },
      { id: 'demo-3', timestamp: new Date(Date.now() - 120000).toISOString(), type: 'message', agent: '@sm', description: 'Story 3.2 assigned to @dev', success: true },
      { id: 'demo-4', timestamp: new Date(Date.now() - 180000).toISOString(), type: 'tool_call', agent: '@qa', description: 'Bash: npm run test', duration: 4500, success: true },
      { id: 'demo-5', timestamp: new Date(Date.now() - 240000).toISOString(), type: 'error', agent: '@dev', description: 'TypeScript error in Charts.tsx', success: false },
      { id: 'demo-6', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'tool_call', agent: '@dev', description: 'Grep "useMonitorStore" in src/', duration: 45, success: true },
      { id: 'demo-7', timestamp: new Date(Date.now() - 360000).toISOString(), type: 'system', agent: 'System', description: 'Agent @dev activated', success: true },
      { id: 'demo-8', timestamp: new Date(Date.now() - 420000).toISOString(), type: 'tool_call', agent: '@dev', description: 'Write src/components/roadmap/RoadmapView.tsx', duration: 200, success: true },
    ];

    demoEvents.forEach((e) => state.addEvent(e));
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.debug('[MonitorSSE] Max SSE reconnect attempts reached, falling back to WebSocket');
      fallbackToWS();
      return;
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY * 2 ** reconnectAttemptsRef.current,
      30_000
    );
    reconnectAttemptsRef.current++;

    console.debug(`[MonitorSSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    reconnectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connectSSE();
      }
    }, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Fall back to WebSocket connection, then demo data */
  const fallbackToWS = useCallback(() => {
    cleanupSSE();
    console.debug('[MonitorSSE] Attempting WebSocket fallback...');
    const store = useMonitorStore.getState();
    store.connectToMonitor();

    // Give WS 3 seconds to connect; if it fails, seed demo data
    setTimeout(() => {
      if (!isMountedRef.current) return;
      const state = useMonitorStore.getState();
      if (!state.connected) {
        console.debug('[MonitorSSE] WebSocket also unavailable, seeding demo data');
        seedDemoData();
      } else {
        useMonitorStore.setState({ connectionSource: 'ws' });
        connectedViaRef.current = 'ws';
      }
    }, 3000);
  }, [cleanupSSE, seedDemoData]);

  /** Open SSE connection to the monitor events endpoint */
  const connectSSE = useCallback(() => {
    cleanupSSE();

    try {
      const es = new EventSource(SSE_URL);
      eventSourceRef.current = es;

      es.addEventListener('monitor:init', () => {
        reconnectAttemptsRef.current = 0;
        useMonitorStore.getState().setConnected(true);
        useMonitorStore.setState({ connectionSource: 'sse' });
        connectedViaRef.current = 'sse';
        console.debug('[MonitorSSE] Connected via SSE');
      });

      // Engine sends events directly (no .data wrapper):
      //   { id, type, agent, command, timestamp, status }
      es.addEventListener('monitor:event', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const event = mapSSEPayloadToEvent(payload);
          if (event) {
            useMonitorStore.getState().addEvent(event);
          }
        } catch {
          // Ignore malformed events
        }
      });

      // Engine sends stats directly (no .data wrapper):
      //   { timestamp, running, pending, wsClients }
      es.addEventListener('monitor:stats', (e: MessageEvent) => {
        try {
          const stats = JSON.parse(e.data);
          if (stats) {
            useMonitorStore.getState().updateStats({
              activeSessions: stats.running ?? stats.wsClients ?? 0,
              total: stats.pending ?? 0,
            });
          }
        } catch {
          // Ignore malformed stats
        }
      });

      es.addEventListener('heartbeat', () => {
        // Heartbeat received — connection is alive
      });

      es.onerror = () => {
        console.debug('[MonitorSSE] SSE error, closing connection');
        useMonitorStore.getState().setConnected(false);
        connectedViaRef.current = 'none';
        cleanupSSE();
        scheduleReconnect();
      };
    } catch {
      console.debug('[MonitorSSE] Failed to create EventSource');
      fallbackToWS();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupSSE, scheduleReconnect, fallbackToWS]);

  /**
   * Attempt connection based on current engine status.
   * Called on mount and whenever engine transitions to 'online'.
   */
  const attemptConnection = useCallback(() => {
    if (!isMountedRef.current) return;

    // Already connected via real source — skip
    if (connectedViaRef.current === 'sse' || connectedViaRef.current === 'ws') return;

    const engineStatus = useEngineStore.getState().status;
    if (engineStatus === 'online') {
      // Engine is confirmed online by useEngineConnection polling — connect
      console.debug('[MonitorSSE] Engine online, connecting via SSE');
      reconnectAttemptsRef.current = 0;

      // Clear demo data when upgrading to real connection
      if (connectedViaRef.current === 'demo') {
        useMonitorStore.getState().clearEvents();
      }

      connectSSE();
    } else {
      // Engine offline — use demo data silently
      seedDemoData();
    }
  }, [connectSSE, seedDemoData]);

  const disconnect = useCallback(() => {
    cleanupSSE();
    disconnectWS();
    connectedViaRef.current = 'none';
    useMonitorStore.getState().setConnected(false);
    useMonitorStore.setState({ connectionSource: 'none' });
  }, [cleanupSSE, disconnectWS]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial connection attempt
    attemptConnection();

    // Subscribe to engineStore — when engine comes online, reconnect.
    // This is the key fix: useEngineConnection polls /health every 15s,
    // so when engine starts after the dashboard, engineStore.status will
    // transition to 'online' and we'll pick it up here.
    const unsubscribe = useEngineStore.subscribe((state, prevState) => {
      if (!isMountedRef.current) return;

      // Engine came online — try to connect
      if (state.status === 'online' && prevState.status !== 'online') {
        console.debug('[MonitorSSE] Engine status changed to online, attempting connection');
        attemptConnection();
      }

      // Engine went offline — mark as disconnected, let demo data stay
      if (state.status === 'offline' && prevState.status === 'online') {
        console.debug('[MonitorSSE] Engine went offline');
        cleanupSSE();
        disconnectWS();
        connectedViaRef.current = 'none';
        useMonitorStore.getState().setConnected(false);
        // Don't overwrite existing events — keep whatever data we have
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
      cleanupSSE();
    };
  }, [attemptConnection, cleanupSSE, disconnectWS]);

  return { connect: attemptConnection, disconnect };
}
