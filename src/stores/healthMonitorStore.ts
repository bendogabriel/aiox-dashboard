/**
 * Health Monitor Store — P8 Scheduled Health Monitoring & Auto-Recovery
 *
 * Manages polling configuration, consecutive failure tracking,
 * and per-integration uptime statistics.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import type { IntegrationId } from './integrationStore';

// ── Types ─────────────────────────────────────────────────

export interface HealthMonitorState {
  /** Global polling enabled */
  enabled: boolean;
  /** Polling interval in seconds (default 60) */
  intervalSeconds: number;
  /** Timestamp of last full poll cycle */
  lastPollTimestamp: number | null;
  /** Consecutive failures per integration (for backoff) */
  consecutiveFailures: Partial<Record<IntegrationId, number>>;
  /** Uptime data points: status snapshots over time */
  uptimeSnapshots: UptimeSnapshot[];

  // ── Actions ───────────────────────────────────────────
  setEnabled: (enabled: boolean) => void;
  setInterval: (seconds: number) => void;
  recordPollResult: (id: IntegrationId, ok: boolean) => void;
  recordPollTimestamp: () => void;
  getConsecutiveFailures: (id: IntegrationId) => number;
  getBackoffMultiplier: (id: IntegrationId) => number;
  getUptimePercent: (id: IntegrationId, windowMs?: number) => number;
  getSparklineData: (id: IntegrationId, points?: number) => SparklinePoint[];
  clearSnapshots: () => void;
}

export interface UptimeSnapshot {
  timestamp: number;
  statuses: Partial<Record<IntegrationId, boolean>>;
}

export interface SparklinePoint {
  timestamp: number;
  ok: boolean;
}

// ── Constants ─────────────────────────────────────────────

const MAX_SNAPSHOTS = 1440; // 24h at 1-minute intervals
const PERSIST_SNAPSHOTS = 720; // persist last 12h
const DEFAULT_INTERVAL = 60; // seconds
const DEFAULT_UPTIME_WINDOW = 24 * 60 * 60 * 1000; // 24h in ms
const MAX_BACKOFF_MULTIPLIER = 8;

// ── Store ─────────────────────────────────────────────────

export const useHealthMonitorStore = create<HealthMonitorState>()(
  persist(
    (set, get) => ({
      enabled: false,
      intervalSeconds: DEFAULT_INTERVAL,
      lastPollTimestamp: null,
      consecutiveFailures: {},
      uptimeSnapshots: [],

      setEnabled: (enabled) => set({ enabled }),

      setInterval: (seconds) =>
        set({ intervalSeconds: Math.max(10, Math.min(300, seconds)) }),

      recordPollTimestamp: () => set({ lastPollTimestamp: Date.now() }),

      recordPollResult: (id, ok) =>
        set((state) => {
          // Update consecutive failures
          const failures = { ...state.consecutiveFailures };
          if (ok) {
            failures[id] = 0;
          } else {
            failures[id] = (failures[id] || 0) + 1;
          }

          // Append to latest snapshot or create new one
          const snapshots = [...state.uptimeSnapshots];
          const now = Date.now();
          const latest = snapshots[snapshots.length - 1];

          // Merge into latest snapshot if within 5 seconds, otherwise create new
          if (latest && now - latest.timestamp < 5000) {
            snapshots[snapshots.length - 1] = {
              ...latest,
              statuses: { ...latest.statuses, [id]: ok },
            };
          } else {
            snapshots.push({
              timestamp: now,
              statuses: { [id]: ok },
            });
          }

          // Trim to max
          const trimmed = snapshots.length > MAX_SNAPSHOTS
            ? snapshots.slice(-MAX_SNAPSHOTS)
            : snapshots;

          return { consecutiveFailures: failures, uptimeSnapshots: trimmed };
        }),

      getConsecutiveFailures: (id) => get().consecutiveFailures[id] || 0,

      getBackoffMultiplier: (id) => {
        const failures = get().consecutiveFailures[id] || 0;
        if (failures <= 1) return 1;
        // Exponential: 1, 2, 4, 8 (capped)
        return Math.min(MAX_BACKOFF_MULTIPLIER, Math.pow(2, failures - 1));
      },

      getUptimePercent: (id, windowMs = DEFAULT_UPTIME_WINDOW) => {
        const snapshots = get().uptimeSnapshots;
        const cutoff = Date.now() - windowMs;
        const relevant = snapshots.filter(
          (s) => s.timestamp >= cutoff && s.statuses[id] !== undefined,
        );
        if (relevant.length === 0) return 100; // No data = assume healthy
        const okCount = relevant.filter((s) => s.statuses[id]).length;
        return Math.round((okCount / relevant.length) * 100);
      },

      getSparklineData: (id, points = 24) => {
        const snapshots = get().uptimeSnapshots;
        // Get snapshots for this integration, most recent N
        const relevant = snapshots
          .filter((s) => s.statuses[id] !== undefined)
          .slice(-points);
        return relevant.map((s) => ({
          timestamp: s.timestamp,
          ok: s.statuses[id] ?? true,
        }));
      },

      clearSnapshots: () => set({ uptimeSnapshots: [], consecutiveFailures: {} }),
    }),
    {
      name: 'aios-health-monitor',
      storage: safePersistStorage,
      partialize: (state) => ({
        enabled: state.enabled,
        intervalSeconds: state.intervalSeconds,
        lastPollTimestamp: state.lastPollTimestamp,
        consecutiveFailures: state.consecutiveFailures,
        uptimeSnapshots: state.uptimeSnapshots.slice(-PERSIST_SNAPSHOTS),
      }),
    },
  ),
);
