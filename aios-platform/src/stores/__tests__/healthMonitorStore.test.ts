import { describe, it, expect, beforeEach } from 'vitest';
import { useHealthMonitorStore } from '../healthMonitorStore';

describe('healthMonitorStore', () => {
  beforeEach(() => {
    useHealthMonitorStore.setState({
      enabled: false,
      intervalSeconds: 60,
      lastPollTimestamp: null,
      consecutiveFailures: {},
      uptimeSnapshots: [],
    });
  });

  describe('setEnabled / setInterval', () => {
    it('toggles monitoring on/off', () => {
      const store = useHealthMonitorStore.getState();
      expect(store.enabled).toBe(false);

      store.setEnabled(true);
      expect(useHealthMonitorStore.getState().enabled).toBe(true);

      store.setEnabled(false);
      expect(useHealthMonitorStore.getState().enabled).toBe(false);
    });

    it('clamps interval between 10 and 300', () => {
      const store = useHealthMonitorStore.getState();

      store.setInterval(5);
      expect(useHealthMonitorStore.getState().intervalSeconds).toBe(10);

      store.setInterval(500);
      expect(useHealthMonitorStore.getState().intervalSeconds).toBe(300);

      store.setInterval(45);
      expect(useHealthMonitorStore.getState().intervalSeconds).toBe(45);
    });
  });

  describe('recordPollResult', () => {
    it('tracks consecutive failures', () => {
      const store = useHealthMonitorStore.getState();

      store.recordPollResult('engine', false);
      expect(useHealthMonitorStore.getState().consecutiveFailures.engine).toBe(1);

      store.recordPollResult('engine', false);
      expect(useHealthMonitorStore.getState().consecutiveFailures.engine).toBe(2);

      store.recordPollResult('engine', true);
      expect(useHealthMonitorStore.getState().consecutiveFailures.engine).toBe(0);
    });

    it('creates uptime snapshots', () => {
      const store = useHealthMonitorStore.getState();

      store.recordPollResult('engine', true);
      store.recordPollResult('supabase', false);

      const snapshots = useHealthMonitorStore.getState().uptimeSnapshots;
      // Should merge into one snapshot (within 5s)
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].statuses.engine).toBe(true);
      expect(snapshots[0].statuses.supabase).toBe(false);
    });

    it('limits snapshots to 1440', () => {
      const store = useHealthMonitorStore.getState();

      // Force separate snapshots by manipulating timestamps
      const snapshots = Array.from({ length: 1500 }, (_, i) => ({
        timestamp: i * 60_000,
        statuses: { engine: i % 2 === 0 } as Record<string, boolean>,
      }));
      useHealthMonitorStore.setState({ uptimeSnapshots: snapshots });

      // One more should trigger trim
      store.recordPollResult('engine', true);
      expect(useHealthMonitorStore.getState().uptimeSnapshots.length).toBeLessThanOrEqual(1440);
    });
  });

  describe('getBackoffMultiplier', () => {
    it('returns 1 for 0 or 1 failures', () => {
      const store = useHealthMonitorStore.getState();
      expect(store.getBackoffMultiplier('engine')).toBe(1);

      store.recordPollResult('engine', false);
      expect(useHealthMonitorStore.getState().getBackoffMultiplier('engine')).toBe(1);
    });

    it('returns exponential backoff for repeated failures', () => {
      const store = useHealthMonitorStore.getState();

      store.recordPollResult('engine', false);
      store.recordPollResult('engine', false);
      expect(useHealthMonitorStore.getState().getBackoffMultiplier('engine')).toBe(2);

      store.recordPollResult('engine', false);
      expect(useHealthMonitorStore.getState().getBackoffMultiplier('engine')).toBe(4);

      store.recordPollResult('engine', false);
      expect(useHealthMonitorStore.getState().getBackoffMultiplier('engine')).toBe(8);
    });

    it('caps at 8x', () => {
      useHealthMonitorStore.setState({
        consecutiveFailures: { engine: 10 },
      });
      expect(useHealthMonitorStore.getState().getBackoffMultiplier('engine')).toBe(8);
    });
  });

  describe('getUptimePercent', () => {
    it('returns 100% with no data', () => {
      expect(useHealthMonitorStore.getState().getUptimePercent('engine')).toBe(100);
    });

    it('calculates percentage from snapshots', () => {
      const now = Date.now();
      useHealthMonitorStore.setState({
        uptimeSnapshots: [
          { timestamp: now - 3000, statuses: { engine: true } },
          { timestamp: now - 2000, statuses: { engine: true } },
          { timestamp: now - 1000, statuses: { engine: false } },
          { timestamp: now, statuses: { engine: true } },
        ],
      });

      // 3 out of 4 are ok = 75%
      expect(useHealthMonitorStore.getState().getUptimePercent('engine')).toBe(75);
    });

    it('filters by time window', () => {
      const now = Date.now();
      useHealthMonitorStore.setState({
        uptimeSnapshots: [
          { timestamp: now - 200_000, statuses: { engine: false } }, // Outside 60s window
          { timestamp: now - 30_000, statuses: { engine: true } },
          { timestamp: now - 10_000, statuses: { engine: true } },
        ],
      });

      // 60-second window: 2 ok out of 2 = 100%
      expect(useHealthMonitorStore.getState().getUptimePercent('engine', 60_000)).toBe(100);
    });
  });

  describe('getSparklineData', () => {
    it('returns empty for no data', () => {
      expect(useHealthMonitorStore.getState().getSparklineData('engine')).toEqual([]);
    });

    it('returns sparkline points', () => {
      const now = Date.now();
      useHealthMonitorStore.setState({
        uptimeSnapshots: [
          { timestamp: now - 2000, statuses: { engine: true } },
          { timestamp: now - 1000, statuses: { engine: false } },
          { timestamp: now, statuses: { engine: true } },
        ],
      });

      const data = useHealthMonitorStore.getState().getSparklineData('engine');
      expect(data).toHaveLength(3);
      expect(data[0].ok).toBe(true);
      expect(data[1].ok).toBe(false);
      expect(data[2].ok).toBe(true);
    });

    it('limits to requested points', () => {
      const now = Date.now();
      const snapshots = Array.from({ length: 50 }, (_, i) => ({
        timestamp: now - (50 - i) * 1000,
        statuses: { engine: true },
      }));
      useHealthMonitorStore.setState({ uptimeSnapshots: snapshots });

      expect(useHealthMonitorStore.getState().getSparklineData('engine', 10)).toHaveLength(10);
    });
  });

  describe('recordPollTimestamp', () => {
    it('records current time', () => {
      const before = Date.now();
      useHealthMonitorStore.getState().recordPollTimestamp();
      const after = Date.now();

      const ts = useHealthMonitorStore.getState().lastPollTimestamp!;
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe('clearSnapshots', () => {
    it('clears all data', () => {
      useHealthMonitorStore.setState({
        uptimeSnapshots: [{ timestamp: 1, statuses: { engine: true } }],
        consecutiveFailures: { engine: 5 },
      });

      useHealthMonitorStore.getState().clearSnapshots();
      const state = useHealthMonitorStore.getState();
      expect(state.uptimeSnapshots).toHaveLength(0);
      expect(state.consecutiveFailures).toEqual({});
    });
  });
});
