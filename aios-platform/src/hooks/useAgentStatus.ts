import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AgentMonitorData } from '../components/agents-monitor/AgentMonitorCard';
import type { AgentActivityEntry } from '../types';

// ---------------------------------------------------------------------------
// Types for the /api/agents/status response
// ---------------------------------------------------------------------------

interface AgentStatusAgent {
  id: string;
  name: string;
  status: 'working' | 'waiting' | 'idle' | 'error';
  phase: string;
  progress: number;
  story: string;
  lastActivity: string;
  model: string;
  squad: string;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  logSize: number;
  logLines: number;
}

interface AgentStatusActivityItem {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  duration: number;
}

interface AgentStatusResponse {
  agents: AgentStatusAgent[];
  activity: AgentStatusActivityItem[];
  activeCount: number;
  totalCount: number;
  updatedAt: string;
  source: 'live';
  error?: string;
}

// ---------------------------------------------------------------------------
// Hook options and return type
// ---------------------------------------------------------------------------

interface UseAgentStatusOptions {
  /** Polling interval in milliseconds (default 10000) */
  pollInterval?: number;
  /** Whether polling is enabled (default true) */
  enabled?: boolean;
}

interface UseAgentStatusReturn {
  /** Agent monitor data ready for AgentMonitorCard */
  agents: AgentMonitorData[];
  /** Activity entries ready for AgentActivityTimeline */
  activity: AgentActivityEntry[];
  /** Number of active (non-idle) agents */
  activeCount: number;
  /** Whether initial load is in progress */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether we're showing demo/fallback data */
  isDemo: boolean;
  /** Timestamp of last successful update */
  updatedAt: string | null;
  /** Manually trigger a refresh */
  refetch: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Map API response to component data shapes
// ---------------------------------------------------------------------------

function mapAgentToMonitorData(agent: AgentStatusAgent): AgentMonitorData {
  return {
    id: agent.id,
    name: agent.name,
    status: agent.status,
    phase: agent.phase,
    progress: agent.progress,
    story: agent.story,
    lastActivity: agent.lastActivity,
    model: agent.model,
    squad: agent.squad,
    totalExecutions: agent.totalExecutions,
    successRate: agent.successRate,
    avgResponseTime: agent.avgResponseTime,
  };
}

function mapActivityToEntry(item: AgentStatusActivityItem): AgentActivityEntry {
  return {
    id: item.id,
    agentId: item.agentId,
    timestamp: item.timestamp,
    action: item.action,
    status: item.status,
    duration: item.duration,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAgentStatus(options: UseAgentStatusOptions = {}): UseAgentStatusReturn {
  const { pollInterval = 10_000, enabled = true } = options;

  const [data, setData] = useState<AgentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: AgentStatusResponse = await res.json();

      if (!mountedRef.current) return;

      // Check if the response has actual agent data
      if (json.agents && json.agents.length > 0 && !json.error) {
        setData(json);
        setError(null);
      } else {
        // API returned but with no agents (empty logs dir etc.)
        setData(null);
        setError(json.error || null);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch agent status');
      // Keep existing data if we had some (don't clear on transient errors)
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      fetchStatus();
      intervalRef.current = setInterval(fetchStatus, pollInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchStatus, pollInterval, enabled]);

  // Derive output values
  const isDemo = !data || data.agents.length === 0;

  const agents = useMemo<AgentMonitorData[]>(() => {
    if (!data || data.agents.length === 0) return [];
    return data.agents.map(mapAgentToMonitorData);
  }, [data]);

  const activity = useMemo<AgentActivityEntry[]>(() => {
    if (!data || data.activity.length === 0) return [];
    return data.activity.map(mapActivityToEntry);
  }, [data]);

  const activeCount = data?.activeCount ?? 0;
  const updatedAt = data?.updatedAt ?? null;

  return {
    agents,
    activity,
    activeCount,
    loading,
    error,
    isDemo,
    updatedAt,
    refetch: fetchStatus,
  };
}
