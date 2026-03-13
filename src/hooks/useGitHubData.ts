/**
 * useGitHubData — Fetches real git/GitHub data from the Next.js API route.
 * Polls every 60 seconds and falls back to demo data when the API is unavailable.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────
export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  refs: string[];
}

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
  author: { login: string };
  headRefName: string;
  isDraft?: boolean;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  labels: { name: string; color: string }[];
  url: string;
  createdAt: string;
  author: { login: string };
}

export interface RepoInfo {
  name: string;
  owner: { login: string };
  url: string;
}

export interface GitHubData {
  commits: GitCommit[];
  pullRequests: GitHubPR[];
  issues: GitHubIssue[];
  repoInfo: RepoInfo | null;
  source: 'live' | 'partial' | 'git-only' | 'demo';
  ghAvailable: boolean;
  updatedAt: string;
}

interface UseGitHubDataReturn {
  data: GitHubData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ─── Demo Data (fallback) ────────────────────────────────────
const demoCommits: GitCommit[] = [
  { sha: 'a1b2c3d', message: 'feat: add kanban board filters and search', author: 'dex-dev', date: new Date(Date.now() - 2 * 3600000).toISOString(), url: '#', refs: ['HEAD -> master', 'origin/master'] },
  { sha: 'e4f5g6h', message: 'fix: resolve Map constructor conflict in RoadmapView', author: 'dex-dev', date: new Date(Date.now() - 5 * 3600000).toISOString(), url: '#', refs: [] },
  { sha: 'i7j8k9l', message: 'feat: implement activity timeline with demo data', author: 'dex-dev', date: new Date(Date.now() - 8 * 3600000).toISOString(), url: '#', refs: [] },
  { sha: 'm0n1o2p', message: 'refactor: notification preferences store with persist', author: 'dex-dev', date: new Date(Date.now() - 24 * 3600000).toISOString(), url: '#', refs: ['tag: v0.4.2'] },
  { sha: 'q3r4s5t', message: 'feat: add accent color picker to settings', author: 'aria-design', date: new Date(Date.now() - 26 * 3600000).toISOString(), url: '#', refs: [] },
];

const demoPullRequests: GitHubPR[] = [
  { number: 52, title: 'feat: kanban board advanced filters', state: 'OPEN', author: { login: 'dex-dev' }, createdAt: new Date(Date.now() - 3600000).toISOString(), headRefName: 'feat/kanban-filters', url: '#' },
  { number: 51, title: 'feat: activity timeline with mock data', state: 'MERGED', author: { login: 'dex-dev' }, createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), headRefName: 'feat/activity-timeline', url: '#' },
  { number: 50, title: 'fix: roadmap Map constructor collision', state: 'MERGED', author: { login: 'dex-dev' }, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), headRefName: 'fix/roadmap-map', url: '#' },
];

const demoIssues: GitHubIssue[] = [
  { number: 23, title: 'Dashboard shows skeleton forever without API', state: 'open', author: { login: 'pax-po' }, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), labels: [{ name: 'bug', color: 'EF4444' }, { name: 'P1', color: 'FF6B6B' }], url: '#' },
  { number: 22, title: 'Add mock data for all views', state: 'open', author: { login: 'pax-po' }, createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), labels: [{ name: 'enhancement', color: '3B82F6' }], url: '#' },
  { number: 21, title: 'Browser back navigation in chat', state: 'closed', author: { login: 'river-sm' }, createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), labels: [{ name: 'bug', color: 'EF4444' }, { name: 'UX', color: 'A855F7' }], url: '#' },
];

const DEMO_DATA: GitHubData = {
  commits: demoCommits,
  pullRequests: demoPullRequests,
  issues: demoIssues,
  repoInfo: null,
  source: 'demo',
  ghAvailable: false,
  updatedAt: new Date().toISOString(),
};

// ─── Constants ───────────────────────────────────────────────
const POLL_INTERVAL_MS = 60_000; // 60 seconds
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

// ─── Hook ────────────────────────────────────────────────────
export function useGitHubData(): UseGitHubDataReturn {
  const [data, setData] = useState<GitHubData>(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch('/api/github', {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      const json = await res.json();

      if (mountedRef.current) {
        setData({
          commits: json.commits || [],
          pullRequests: json.pullRequests || [],
          issues: json.issues || [],
          repoInfo: json.repoInfo || null,
          source: json.source || 'live',
          ghAvailable: json.ghAvailable ?? false,
          updatedAt: json.updatedAt || new Date().toISOString(),
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const message = err instanceof Error ? err.message : 'Failed to fetch GitHub data';
      setError(message);

      // Fall back to demo data only if we have no real data yet
      setData((prev) => {
        if (prev.source === 'demo' && prev === DEMO_DATA) {
          return DEMO_DATA;
        }
        return prev; // Keep existing real data on refresh failure
      });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
