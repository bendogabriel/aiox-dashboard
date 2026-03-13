import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScheduledHealthCheck } from '../useScheduledHealthCheck';
import { useHealthMonitorStore } from '../../stores/healthMonitorStore';

// Mock probeIntegration
vi.mock('../useHealthCheck', () => ({
  probeIntegration: vi.fn().mockResolvedValue({
    id: 'engine',
    ok: true,
    msg: 'OK',
    previousStatus: 'disconnected',
    newStatus: 'connected',
  }),
}));

// Mock integration store
vi.mock('../../stores/integrationStore', () => ({
  useIntegrationStore: Object.assign(
    (selector?: any) => {
      const state = {
        integrations: {
          engine: { id: 'engine', status: 'connected', config: {} },
          supabase: { id: 'supabase', status: 'disconnected', config: {} },
          'api-keys': { id: 'api-keys', status: 'connected', config: {} },
          whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
          telegram: { id: 'telegram', status: 'disconnected', config: {} },
          voice: { id: 'voice', status: 'disconnected', config: {} },
          'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
          'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
        },
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        integrations: {
          engine: { id: 'engine', status: 'connected', config: {} },
          supabase: { id: 'supabase', status: 'disconnected', config: {} },
          'api-keys': { id: 'api-keys', status: 'connected', config: {} },
          whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
          telegram: { id: 'telegram', status: 'disconnected', config: {} },
          voice: { id: 'voice', status: 'disconnected', config: {} },
          'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
          'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
        },
      }),
    },
  ),
}));

describe('useScheduledHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useHealthMonitorStore.setState({
      enabled: false,
      intervalSeconds: 60,
      lastPollTimestamp: null,
      consecutiveFailures: {},
      uptimeSnapshots: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll when disabled', async () => {
    const { probeIntegration } = await import('../useHealthCheck');

    renderHook(() => useScheduledHealthCheck());

    // Advance past initial delay
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(probeIntegration).not.toHaveBeenCalled();
  });

  it('starts polling when enabled', async () => {
    const { probeIntegration } = await import('../useHealthCheck');
    vi.mocked(probeIntegration).mockClear();

    useHealthMonitorStore.setState({ enabled: true, intervalSeconds: 30 });

    renderHook(() => useScheduledHealthCheck());

    // Advance past initial 3s delay
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    // Should have probed all 8 integrations
    expect(probeIntegration).toHaveBeenCalled();
  });

  it('records poll timestamp', async () => {
    useHealthMonitorStore.setState({ enabled: true, intervalSeconds: 30 });

    renderHook(() => useScheduledHealthCheck());

    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    expect(useHealthMonitorStore.getState().lastPollTimestamp).not.toBeNull();
  });

  it('provides pollNow callback', () => {
    const { result } = renderHook(() => useScheduledHealthCheck());
    expect(typeof result.current.pollNow).toBe('function');
  });

  it('stops polling when disabled', async () => {
    const { probeIntegration } = await import('../useHealthCheck');

    useHealthMonitorStore.setState({ enabled: true, intervalSeconds: 10 });
    const { rerender } = renderHook(() => useScheduledHealthCheck());

    // First poll
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    vi.mocked(probeIntegration).mockClear();

    // Disable
    await act(async () => {
      useHealthMonitorStore.setState({ enabled: false });
    });
    rerender();

    // Advance more time
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // Should not have probed again after disable
    expect(probeIntegration).not.toHaveBeenCalled();
  });
});
