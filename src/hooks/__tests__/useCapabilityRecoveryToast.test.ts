import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCapabilityRecoveryToast } from '../useCapabilityRecoveryToast';

// ── Mocks ─────────────────────────────────────────────

const mockAddToast = vi.fn();

vi.mock('../../stores/toastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}));

// Controllable integration statuses — using a module-level object
// that can be mutated between renders
const _state = {
  statuses: {} as Record<string, { id: string; status: string; config: Record<string, string> }>,
};

function resetStatuses() {
  _state.statuses = {
    engine: { id: 'engine', status: 'disconnected', config: {} },
    supabase: { id: 'supabase', status: 'disconnected', config: {} },
    'api-keys': { id: 'api-keys', status: 'disconnected', config: {} },
    whatsapp: { id: 'whatsapp', status: 'disconnected', config: {} },
    telegram: { id: 'telegram', status: 'disconnected', config: {} },
    voice: { id: 'voice', status: 'disconnected', config: {} },
    'google-drive': { id: 'google-drive', status: 'disconnected', config: {} },
    'google-calendar': { id: 'google-calendar', status: 'disconnected', config: {} },
  };
}

// vi.mock is hoisted, so we use _state object reference that's accessible
vi.mock('../../stores/integrationStore', () => ({
  useIntegrationStore: Object.assign(
    (selector: (s: { integrations: typeof _state.statuses }) => unknown) =>
      selector({ integrations: _state.statuses }),
    {
      getState: () => ({ integrations: _state.statuses }),
    },
  ),
}));

// Mock degradation-map
vi.mock('../../lib/degradation-map', () => ({
  computeCapabilities: vi.fn(() => [
    { id: 'agent-execution', label: 'Agent Execution', level: 'full', dependsOn: [] },
    { id: 'job-management', label: 'Job Management', level: 'full', dependsOn: [] },
  ]),
  getCapabilitySummary: vi.fn(() => ({
    full: 18,
    degraded: 2,
    unavailable: 1,
    total: 21,
  })),
}));

describe('useCapabilityRecoveryToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStatuses();
  });

  it('does not fire toast on initial mount', () => {
    renderHook(() => useCapabilityRecoveryToast());
    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('fires success toast when integration recovers', () => {
    const { rerender } = renderHook(() => useCapabilityRecoveryToast());

    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'connected', config: {} },
    };
    rerender();

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringContaining('Engine'),
      }),
    );
  });

  it('fires warning toast when integration goes offline', () => {
    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'connected', config: {} },
    };
    const { rerender } = renderHook(() => useCapabilityRecoveryToast());

    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'disconnected', config: {} },
    };
    rerender();

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: expect.stringContaining('Engine'),
      }),
    );
  });

  it('ignores checking status (transient)', () => {
    const { rerender } = renderHook(() => useCapabilityRecoveryToast());

    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'checking', config: {} },
    };
    rerender();

    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('handles multiple integrations recovering at once', () => {
    const { rerender } = renderHook(() => useCapabilityRecoveryToast());

    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'connected', config: {} },
      supabase: { id: 'supabase', status: 'connected', config: {} },
    };
    rerender();

    expect(mockAddToast).toHaveBeenCalledTimes(1);
    const call = mockAddToast.mock.calls[0][0];
    expect(call.type).toBe('success');
    expect(call.title).toContain('Engine');
    expect(call.title).toContain('Supabase');
  });

  it('includes capability count in success message', () => {
    const { rerender } = renderHook(() => useCapabilityRecoveryToast());

    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'connected', config: {} },
    };
    rerender();

    const call = mockAddToast.mock.calls[0][0];
    expect(call.message).toContain('18/21');
  });

  it('treats partial as online', () => {
    const { rerender } = renderHook(() => useCapabilityRecoveryToast());

    _state.statuses = {
      ..._state.statuses,
      engine: { id: 'engine', status: 'partial', config: {} },
    };
    rerender();

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
  });
});
