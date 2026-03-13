import { useQuery } from '@tanstack/react-query';

// ---- Types ----

export interface DashboardOverviewMetrics {
  totalStories: number;
  totalAgents: number;
  activeLogFiles: number;
  gitCommits: number;
  gitBranch: string;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  activeExecutions: number;
  successRate: number;
}

export interface DashboardAgentStat {
  agentId: string;
  agentName: string;
  role: string;
  model: string;
  logLines: number;
  lastActive: string;
  status: 'active' | 'idle' | 'offline';
  squad: string;
}

export interface DashboardMCPServer {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  type: string;
  toolCount: number;
  tools: Array<{ name: string; calls: number }>;
  error?: string;
}

export interface DashboardMCPInfo {
  totalServers: number;
  connectedServers: number;
  totalTools: number;
  servers: DashboardMCPServer[];
}

export interface DashboardCosts {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byProvider: { claude: number; openai: number };
  bySquad: Record<string, number>;
  trend: number[];
  tokens: {
    total: { input: number; output: number; requests: number };
    claude: { input: number; output: number; requests: number };
    openai: { input: number; output: number; requests: number };
  };
}

export interface DashboardSystemInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    heapPercentage: number;
  };
  uptime: number;
  uptimeFormatted: string;
  gitBranch: string;
  gitDirty: boolean;
  aiosDiskUsage: string;
  llmKeys: {
    claude: boolean;
    openai: boolean;
  };
}

export interface DashboardOverviewData {
  generatedAt: string;
  overview: DashboardOverviewMetrics;
  agents: DashboardAgentStat[];
  mcp: DashboardMCPInfo;
  costs: DashboardCosts;
  system: DashboardSystemInfo;
}

// ---- Hook ----

/**
 * Fetches unified dashboard data from /api/dashboard/overview.
 * Polls every 30 seconds to keep metrics fresh.
 */
export function useDashboardOverview() {
  const query = useQuery<DashboardOverviewData>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/overview');
      if (!response.ok) {
        throw new Error(`Dashboard overview fetch failed: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 15 * 1000, // Consider data stale after 15s
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    retry: 2,
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data ?? null,
    overview: query.data?.overview ?? null,
    agents: query.data?.agents ?? null,
    mcp: query.data?.mcp ?? null,
    costs: query.data?.costs ?? null,
    system: query.data?.system ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
