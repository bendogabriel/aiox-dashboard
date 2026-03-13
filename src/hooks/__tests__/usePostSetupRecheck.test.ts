import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePostSetupRecheck } from '../usePostSetupRecheck';

// ── Mocks ─────────────────────────────────────────────

const mockProbeAll = vi.fn(async () => []);

vi.mock('../useHealthCheck', () => ({
  probeAllIntegrations: (...args: unknown[]) => mockProbeAll(...args),
}));

let mockWizardOpen = false;
let mockSetupModalOpen: string | null = null;

vi.mock('../../stores/setupWizardStore', () => ({
  useSetupWizardStore: (selector: (s: { isOpen: boolean }) => unknown) =>
    selector({ isOpen: mockWizardOpen }),
}));

vi.mock('../../stores/integrationStore', () => ({
  useIntegrationStore: (selector: (s: { setupModalOpen: string | null }) => unknown) =>
    selector({ setupModalOpen: mockSetupModalOpen }),
}));

describe('usePostSetupRecheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWizardOpen = false;
    mockSetupModalOpen = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not probe on initial mount', () => {
    renderHook(() => usePostSetupRecheck());
    vi.advanceTimersByTime(1000);
    expect(mockProbeAll).not.toHaveBeenCalled();
  });

  it('probes when wizard closes', () => {
    mockWizardOpen = true;
    const { rerender } = renderHook(() => usePostSetupRecheck());

    // Close wizard
    mockWizardOpen = false;
    rerender();

    // Advance past debounce
    vi.advanceTimersByTime(600);

    expect(mockProbeAll).toHaveBeenCalledTimes(1);
  });

  it('probes when setup modal closes', () => {
    mockSetupModalOpen = 'engine';
    const { rerender } = renderHook(() => usePostSetupRecheck());

    // Close modal
    mockSetupModalOpen = null;
    rerender();

    vi.advanceTimersByTime(600);

    expect(mockProbeAll).toHaveBeenCalledTimes(1);
  });

  it('does not probe when wizard opens', () => {
    const { rerender } = renderHook(() => usePostSetupRecheck());

    // Open wizard
    mockWizardOpen = true;
    rerender();

    vi.advanceTimersByTime(600);

    expect(mockProbeAll).not.toHaveBeenCalled();
  });

  it('debounces rapid close events', () => {
    mockWizardOpen = true;
    mockSetupModalOpen = 'engine';
    const { rerender } = renderHook(() => usePostSetupRecheck());

    // Close wizard
    mockWizardOpen = false;
    rerender();

    // Close modal quickly after
    mockSetupModalOpen = null;
    rerender();

    vi.advanceTimersByTime(600);

    // Should only probe once due to debounce
    expect(mockProbeAll).toHaveBeenCalledTimes(1);
  });

  it('waits 500ms debounce before probing', () => {
    mockWizardOpen = true;
    const { rerender } = renderHook(() => usePostSetupRecheck());

    mockWizardOpen = false;
    rerender();

    // At 400ms, should not have probed yet
    vi.advanceTimersByTime(400);
    expect(mockProbeAll).not.toHaveBeenCalled();

    // At 500ms, should probe
    vi.advanceTimersByTime(200);
    expect(mockProbeAll).toHaveBeenCalledTimes(1);
  });
});
