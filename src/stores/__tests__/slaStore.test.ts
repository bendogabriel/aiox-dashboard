import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSlaStore } from '../slaStore';
import { useHealthMonitorStore } from '../healthMonitorStore';

// Mock healthMonitorStore.getState().getUptimePercent
vi.mock('../healthMonitorStore', () => ({
  useHealthMonitorStore: {
    getState: vi.fn(),
  },
}));

const mockGetUptimePercent = vi.fn<(id: string, windowMs?: number) => number>();

beforeEach(() => {
  // Reset SLA store
  useSlaStore.setState({ goals: [] });

  // Setup mock
  mockGetUptimePercent.mockReturnValue(100);
  (useHealthMonitorStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
    getUptimePercent: mockGetUptimePercent,
  });
});

describe('slaStore', () => {
  describe('setGoal', () => {
    it('creates a new goal', () => {
      useSlaStore.getState().setGoal('engine', 99.5, 24);
      const goals = useSlaStore.getState().goals;

      expect(goals).toHaveLength(1);
      expect(goals[0]).toEqual({
        integrationId: 'engine',
        targetPercent: 99.5,
        windowHours: 24,
        enabled: true,
      });
    });

    it('updates an existing goal for the same integration', () => {
      const store = useSlaStore.getState();
      store.setGoal('engine', 99, 24);
      store.setGoal('engine', 99.9, 12);

      const goals = useSlaStore.getState().goals;
      expect(goals).toHaveLength(1);
      expect(goals[0].targetPercent).toBe(99.9);
      expect(goals[0].windowHours).toBe(12);
    });

    it('clamps targetPercent between 90 and 100', () => {
      const store = useSlaStore.getState();
      store.setGoal('engine', 85, 24);
      expect(useSlaStore.getState().goals[0].targetPercent).toBe(90);

      store.setGoal('supabase', 105, 24);
      expect(useSlaStore.getState().goals[1].targetPercent).toBe(100);
    });

    it('creates multiple goals for different integrations', () => {
      const store = useSlaStore.getState();
      store.setGoal('engine', 99, 24);
      store.setGoal('supabase', 95, 6);
      store.setGoal('whatsapp', 98, 168);

      expect(useSlaStore.getState().goals).toHaveLength(3);
    });
  });

  describe('removeGoal', () => {
    it('removes a goal by integrationId', () => {
      const store = useSlaStore.getState();
      store.setGoal('engine', 99, 24);
      store.setGoal('supabase', 95, 6);

      useSlaStore.getState().removeGoal('engine');

      const goals = useSlaStore.getState().goals;
      expect(goals).toHaveLength(1);
      expect(goals[0].integrationId).toBe('supabase');
    });

    it('does nothing when removing a non-existent goal', () => {
      const store = useSlaStore.getState();
      store.setGoal('engine', 99, 24);
      useSlaStore.getState().removeGoal('whatsapp');

      expect(useSlaStore.getState().goals).toHaveLength(1);
    });
  });

  describe('toggleGoal', () => {
    it('disables an enabled goal', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      expect(useSlaStore.getState().goals[0].enabled).toBe(true);

      useSlaStore.getState().toggleGoal('engine');
      expect(useSlaStore.getState().goals[0].enabled).toBe(false);
    });

    it('enables a disabled goal', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      useSlaStore.getState().toggleGoal('engine');
      expect(useSlaStore.getState().goals[0].enabled).toBe(false);

      useSlaStore.getState().toggleGoal('engine');
      expect(useSlaStore.getState().goals[0].enabled).toBe(true);
    });
  });

  describe('getGoal', () => {
    it('returns the correct goal for an integrationId', () => {
      useSlaStore.getState().setGoal('engine', 99.5, 24);
      useSlaStore.getState().setGoal('supabase', 95, 6);

      const goal = useSlaStore.getState().getGoal('supabase');
      expect(goal).toBeDefined();
      expect(goal!.integrationId).toBe('supabase');
      expect(goal!.targetPercent).toBe(95);
      expect(goal!.windowHours).toBe(6);
    });

    it('returns undefined for non-existent integrationId', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      expect(useSlaStore.getState().getGoal('whatsapp')).toBeUndefined();
    });
  });

  describe('getViolations', () => {
    it('detects violations when actual < target', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      useSlaStore.getState().setGoal('supabase', 95, 6);

      // engine: actual 90 < target 99 => violation
      // supabase: actual 80 < target 95 => violation
      mockGetUptimePercent.mockImplementation((id: string) => {
        if (id === 'engine') return 90;
        if (id === 'supabase') return 80;
        return 100;
      });

      const violations = useSlaStore.getState().getViolations();
      expect(violations).toHaveLength(2);

      const engineViolation = violations.find((v) => v.integrationId === 'engine');
      expect(engineViolation).toBeDefined();
      expect(engineViolation!.targetPercent).toBe(99);
      expect(engineViolation!.actualPercent).toBe(90);
      expect(engineViolation!.deficit).toBe(9);

      const supabaseViolation = violations.find((v) => v.integrationId === 'supabase');
      expect(supabaseViolation).toBeDefined();
      expect(supabaseViolation!.deficit).toBe(15);
    });

    it('returns empty array when all goals are met', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      useSlaStore.getState().setGoal('supabase', 95, 6);

      mockGetUptimePercent.mockReturnValue(100);

      const violations = useSlaStore.getState().getViolations();
      expect(violations).toHaveLength(0);
    });

    it('skips disabled goals', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      useSlaStore.getState().toggleGoal('engine');

      mockGetUptimePercent.mockReturnValue(50); // Would violate if enabled

      const violations = useSlaStore.getState().getViolations();
      expect(violations).toHaveLength(0);
    });

    it('passes correct windowMs to getUptimePercent', () => {
      useSlaStore.getState().setGoal('engine', 99, 24);
      useSlaStore.getState().setGoal('supabase', 95, 168);

      mockGetUptimePercent.mockReturnValue(100);
      useSlaStore.getState().getViolations();

      expect(mockGetUptimePercent).toHaveBeenCalledWith('engine', 24 * 3_600_000);
      expect(mockGetUptimePercent).toHaveBeenCalledWith('supabase', 168 * 3_600_000);
    });

    it('calculates deficit correctly with decimal targets', () => {
      useSlaStore.getState().setGoal('engine', 99.9, 24);

      mockGetUptimePercent.mockReturnValue(98);

      const violations = useSlaStore.getState().getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].deficit).toBe(1.9);
    });
  });
});
