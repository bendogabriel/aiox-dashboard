import { useEffect, useRef, useCallback } from 'react';
import { useMonitorStore, type MonitorEvent } from '../stores/monitorStore';

/** SSE endpoint served by the Next.js API route */
const SSE_URL = '/api/monitor/events';

/** Max reconnect attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay for exponential backoff (ms) */
const BASE_RECONNECT_DELAY = 1000;

/**
 * Hook that connects the MonitorStore to a real-time SSE feed
 * from the Next.js `/api/monitor/events` endpoint.
 *
 * Connection strategy:
 *   1. Try SSE first
 *   2. On failure, fall back to WebSocket (existing connectToMonitor)
 *   3. If both fail, seed demo data
 *
 * Returns `{ connect, disconnect }` for manual control.
 */
export function useMonitorSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

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

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.debug('[MonitorSSE] Max reconnect attempts reached, falling back to WebSocket');
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
    console.debug('[MonitorSSE] Attempting WebSocket fallback...');
    const store = useMonitorStore.getState();
    store.connectToMonitor();

    // Give WS 3 seconds to connect; if it fails, seed demo data
    setTimeout(() => {
      const state = useMonitorStore.getState();
      if (!state.connected) {
        console.debug('[MonitorSSE] WebSocket also unavailable, seeding demo data');
        seedDemoData();
      } else {
        useMonitorStore.setState({ connectionSource: 'ws' });
      }
    }, 3000);
  }, []);

  /** Seed demo events when both SSE and WS are unavailable */
  const seedDemoData = useCallback(() => {
    const state = useMonitorStore.getState();
    if (state.events.length > 0) return; // Already has data

    useMonitorStore.setState({ connectionSource: 'demo' });

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

  /** Open SSE connection to the monitor events endpoint */
  const connectSSE = useCallback(() => {
    cleanupSSE();

    try {
      const es = new EventSource(SSE_URL);
      eventSourceRef.current = es;

      es.addEventListener('monitor:init', () => {
        // Connection established
        reconnectAttemptsRef.current = 0;
        useMonitorStore.getState().setConnected(true);
        useMonitorStore.setState({ connectionSource: 'sse' });
        console.debug('[MonitorSSE] Connected via SSE');
      });

      es.addEventListener('monitor:event', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const event: MonitorEvent = payload.data;
          if (event && event.id) {
            useMonitorStore.getState().addEvent(event);
          }
        } catch {
          // Ignore malformed events
        }
      });

      es.addEventListener('monitor:stats', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const stats = payload.data;
          if (stats) {
            useMonitorStore.getState().updateStats(stats);
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
        cleanupSSE();
        scheduleReconnect();
      };
    } catch {
      console.debug('[MonitorSSE] Failed to create EventSource');
      fallbackToWS();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupSSE, scheduleReconnect, fallbackToWS]);

  const disconnect = useCallback(() => {
    cleanupSSE();
    disconnectWS();
    useMonitorStore.getState().setConnected(false);
    useMonitorStore.setState({ connectionSource: 'none' });
  }, [cleanupSSE, disconnectWS]);

  useEffect(() => {
    isMountedRef.current = true;
    connectSSE();

    return () => {
      isMountedRef.current = false;
      cleanupSSE();
    };
  }, [connectSSE, cleanupSSE]);

  return { connect: connectSSE, disconnect };
}
