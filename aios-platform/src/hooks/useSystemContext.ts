import { useQuery } from '@tanstack/react-query';

export interface RuleEntry {
  name: string;
  type: 'mandatory' | 'optional';
  path: string;
}

export interface AgentEntry {
  name: string;
  role: string;
  model: string;
  icon: string;
}

export interface ConfigEntry {
  path: string;
  modified: string;
}

export interface MCPServerEntry {
  name: string;
  status: 'success' | 'error' | 'offline';
  tools: number;
}

export interface RecentFileEntry {
  path: string;
  time: string;
}

export interface SystemContextData {
  rules: RuleEntry[];
  agents: AgentEntry[];
  configs: ConfigEntry[];
  mcpServers: MCPServerEntry[];
  recentFiles: RecentFileEntry[];
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchSystemContext(): Promise<SystemContextData> {
  const response = await fetch(`${API_BASE}/context`);
  if (!response.ok) {
    throw new Error(`Failed to fetch system context: ${response.status}`);
  }
  return response.json();
}

/**
 * Hook to fetch real system context data (rules, agents, configs, MCP servers, recent files).
 * Polls every 2 minutes to stay fresh.
 */
export function useSystemContext() {
  return useQuery<SystemContextData>({
    queryKey: ['systemContext'],
    queryFn: fetchSystemContext,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 2,
  });
}
