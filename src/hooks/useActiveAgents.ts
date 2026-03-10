'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AgentLogInfo {
  agentId: string;
  fileName: string;
  size: number;
  lastModified: string;
  active: boolean;
}

interface ActiveAgentsResponse {
  agents: AgentLogInfo[];
  activeCount: number;
  updatedAt: string;
}

interface UseActiveAgentsOptions {
  /** Poll interval in ms (default: 10_000) */
  pollInterval?: number;
  /** Only return active agents (default: false) */
  activeOnly?: boolean;
}

export function useActiveAgents(options: UseActiveAgentsOptions = {}) {
  const { pollInterval = 10_000, activeOnly = false } = options;

  const [agents, setAgents] = useState<AgentLogInfo[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/logs/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ActiveAgentsResponse = await res.json();
      const list = activeOnly ? data.agents.filter(a => a.active) : data.agents;

      setAgents(list);
      setActiveCount(data.activeCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchAgents();

    intervalRef.current = setInterval(fetchAgents, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAgents, pollInterval]);

  return { agents, activeCount, loading, error, refetch: fetchAgents };
}
