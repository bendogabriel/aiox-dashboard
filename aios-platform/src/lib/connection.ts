/**
 * Connection Mode Detection
 *
 * Detects whether the dashboard is running in local mode (direct to monitor server)
 * or cloud mode (connected to relay server via room).
 */

export type ConnectionMode = 'local' | 'cloud';

export interface ConnectionConfig {
  mode: ConnectionMode;
  /** WebSocket URL for event streaming */
  wsUrl: string;
  /** HTTP URL for REST API calls */
  httpUrl: string;
  /** Room ID (cloud mode only) */
  roomId?: string;
  /** Auth token (cloud mode only) */
  token?: string;
}

const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || 'http://localhost:4001';
const RELAY_URL = import.meta.env.VITE_RELAY_URL as string | undefined;
const RELAY_HTTP_URL = import.meta.env.VITE_RELAY_HTTP_URL as string | undefined;

/** Check if we're in cloud mode */
export function isCloudMode(): boolean {
  return !!RELAY_URL;
}

/** Get connection config based on URL params and env */
export function getConnectionConfig(): ConnectionConfig {
  // Check URL for room parameter
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || undefined;
  const token = urlParams.get('token') || localStorage.getItem('aios_token') || undefined;

  // Cloud mode: relay URL configured and room ID provided
  if (RELAY_URL && roomId && token) {
    return {
      mode: 'cloud',
      wsUrl: `${RELAY_URL}/dashboard?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`,
      httpUrl: RELAY_HTTP_URL || RELAY_URL.replace(/^ws/, 'http'),
      roomId,
      token,
    };
  }

  // Local mode: direct to monitor server
  return {
    mode: 'local',
    wsUrl: `${MONITOR_URL.replace(/^http/, 'ws')}/stream`,
    httpUrl: MONITOR_URL,
  };
}

/** Get the relay HTTP URL (for REST API calls in cloud mode) */
export function getRelayHttpUrl(): string | undefined {
  return RELAY_HTTP_URL;
}

/** Store auth token */
export function setAuthToken(token: string): void {
  localStorage.setItem('aios_token', token);
}

/** Get stored auth token */
export function getAuthToken(): string | null {
  return localStorage.getItem('aios_token');
}

/** Clear auth token */
export function clearAuthToken(): void {
  localStorage.removeItem('aios_token');
}
