import { useEffect, useRef, useCallback } from 'react';
import { useTerminalStore } from '../stores/terminalStore';

interface UseTerminalSSEOptions {
  sessionId: string;
  agentId: string;
  enabled?: boolean;
}

/**
 * Connects a terminal session to the SSE log stream at /api/logs?agent={agentId}.
 * Appends incoming lines to the store and manages connection status.
 */
export function useTerminalSSE({ sessionId, agentId, enabled = true }: UseTerminalSSEOptions) {
  const { appendOutput, clearOutput, setSessionStatus } = useTerminalStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setSessionStatus(sessionId, 'connecting');

    const url = `/api/logs?agent=${agentId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setSessionStatus(sessionId, 'working');
      reconnectAttemptRef.current = 0; // Reset on successful connect
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      // Auto-reconnect with exponential backoff
      if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
        const attempt = reconnectAttemptRef.current++;
        const delay = Math.min(1000 * Math.pow(2, attempt), 15000);
        setSessionStatus(sessionId, 'connecting');
        reconnectTimerRef.current = setTimeout(connect, delay);
      } else {
        setSessionStatus(sessionId, 'error');
      }
    };

    // log:init — clear old lines on (re)connect
    es.addEventListener('log:init', () => {
      clearOutput(sessionId);
    });

    // log:line — append a single line
    es.addEventListener('log:line', (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        const { line } = parsed.data as { line: string; initial: boolean };
        appendOutput(sessionId, [line]);
      } catch {
        // ignore malformed events
      }
    });

    // log:error — show error in terminal
    es.addEventListener('log:error', (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        const { message } = parsed.data as { message: string };
        appendOutput(sessionId, [`[ERROR] ${message}`]);
        setSessionStatus(sessionId, 'error');
      } catch {
        setSessionStatus(sessionId, 'error');
      }
    });

    // heartbeat — connection alive (no-op, keeps EventSource happy)
    es.addEventListener('heartbeat', () => {
      // noop
    });
  }, [sessionId, agentId, appendOutput, clearOutput, setSessionStatus]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setSessionStatus(sessionId, 'idle');
  }, [sessionId, setSessionStatus]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return disconnect;
  }, [enabled, connect, disconnect]);

  return { reconnect, disconnect };
}
