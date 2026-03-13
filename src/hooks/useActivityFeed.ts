import { useQuery } from '@tanstack/react-query';

export type ActivityType = 'execution' | 'tool_call' | 'message' | 'error' | 'system';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'pending';
  agent?: string;
}

export interface ActivityFeedData {
  events: ActivityEvent[];
  total: number;
  source: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchActivityFeed(limit: number): Promise<ActivityFeedData> {
  const response = await fetch(`${API_BASE}/activity?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch activity feed: ${response.status}`);
  }
  return response.json();
}

/**
 * Hook to fetch real activity events from AIOS log files.
 * Polls every 30 seconds to keep the timeline fresh.
 */
export function useActivityFeed(limit: number = 50) {
  return useQuery<ActivityFeedData>({
    queryKey: ['activityFeed', limit],
    queryFn: () => fetchActivityFeed(limit),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });
}
