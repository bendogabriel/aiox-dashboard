import { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════════
//                              TYPES
// ═══════════════════════════════════════════════════════════════════════════════════

export interface QAOverview {
  totalReviews: number;
  passRate: number;
  avgReviewTime: string;
  criticalIssues: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface DailyTrendEntry {
  day: string;
  passed: number;
  failed: number;
}

export interface ValidationModule {
  name: string;
  status: 'success' | 'working' | 'error';
  lastRun: string;
  findings: number;
  description: string;
}

export interface PatternFeedback {
  accepted: number;
  rejected: number;
}

export interface GotchasRegistry {
  total: number;
  recent: string[];
}

export interface QAMetricsData {
  source: 'live' | 'demo';
  overview: QAOverview;
  dailyTrend: DailyTrendEntry[];
  validationModules: ValidationModule[];
  patternFeedback: PatternFeedback;
  gotchasRegistry: GotchasRegistry;
}

export interface UseQAMetricsResult {
  data: QAMetricsData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              FALLBACK DATA
// ═══════════════════════════════════════════════════════════════════════════════════

const FALLBACK_DATA: QAMetricsData = {
  source: 'demo',
  overview: {
    totalReviews: 156,
    passRate: 92,
    avgReviewTime: '45s',
    criticalIssues: 3,
    trend: 'improving',
  },
  dailyTrend: [
    { day: 'Mon', passed: 18, failed: 2 },
    { day: 'Tue', passed: 22, failed: 1 },
    { day: 'Wed', passed: 15, failed: 3 },
    { day: 'Thu', passed: 20, failed: 2 },
    { day: 'Fri', passed: 24, failed: 1 },
    { day: 'Sat', passed: 10, failed: 0 },
    { day: 'Sun', passed: 5, failed: 1 },
  ],
  validationModules: [
    {
      name: 'Library Scan',
      status: 'success',
      lastRun: '12m ago',
      findings: 2,
      description: 'Scans for vulnerable or deprecated dependencies',
    },
    {
      name: 'Security Audit',
      status: 'working',
      lastRun: '3h ago',
      findings: 1,
      description: 'Checks for hardcoded secrets and security patterns',
    },
    {
      name: 'Migration Check',
      status: 'error',
      lastRun: '1h ago',
      findings: 3,
      description: 'Validates database migration consistency',
    },
  ],
  patternFeedback: { accepted: 42, rejected: 8 },
  gotchasRegistry: {
    total: 23,
    recent: [
      'CSS @media keyword collision',
      'Meta API content-type quirk',
      'AC API v1 vs v3 differences',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════
//                              CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════════

const POLL_INTERVAL_MS = 30_000;
const FETCH_TIMEOUT_MS = 8_000;

// ═══════════════════════════════════════════════════════════════════════════════════
//                              HOOK
// ═══════════════════════════════════════════════════════════════════════════════════

export function useQAMetrics(): UseQAMetricsResult {
  const [data, setData] = useState<QAMetricsData>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchMetrics = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch('/api/qa/metrics', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      if (!mountedRef.current) return;

      // Validate the response has the expected shape
      if (json && json.overview && json.dailyTrend) {
        setData({
          source: json.source || 'live',
          overview: {
            totalReviews: json.overview.totalReviews ?? 0,
            passRate: json.overview.passRate ?? 0,
            avgReviewTime: json.overview.avgReviewTime ?? '0s',
            criticalIssues: json.overview.criticalIssues ?? 0,
            trend: json.overview.trend ?? 'stable',
          },
          dailyTrend: Array.isArray(json.dailyTrend)
            ? json.dailyTrend.map((d: { day?: string; date?: string; passed?: number; failed?: number }) => ({
                day: d.day || d.date || '?',
                passed: d.passed ?? 0,
                failed: d.failed ?? 0,
              }))
            : FALLBACK_DATA.dailyTrend,
          validationModules: Array.isArray(json.validationModules)
            ? json.validationModules
            : FALLBACK_DATA.validationModules,
          patternFeedback: json.patternFeedback ?? FALLBACK_DATA.patternFeedback,
          gotchasRegistry: json.gotchasRegistry ?? FALLBACK_DATA.gotchasRegistry,
        });
        setError(null);
      } else {
        throw new Error('Invalid response shape');
      }
    } catch (err) {
      clearTimeout(timeout);
      if (!mountedRef.current) return;

      const message =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Request timeout'
          : err instanceof Error
            ? err.message
            : 'Unknown error';

      setError(message);
      // Keep existing data (or fallback) when API is unavailable
      setData((prev) => (prev.source === 'demo' ? FALLBACK_DATA : prev));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMetrics();
  }, [fetchMetrics]);

  // Initial fetch + polling
  useEffect(() => {
    mountedRef.current = true;
    fetchMetrics();

    intervalRef.current = setInterval(fetchMetrics, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchMetrics]);

  return { data, loading, error, refetch };
}
