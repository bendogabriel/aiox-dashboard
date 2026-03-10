/**
 * SLA Store — P13 SLA / Uptime Goals
 *
 * Manages per-integration SLA targets and detects violations
 * by comparing goals against healthMonitorStore uptime data.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import type { IntegrationId } from './integrationStore';
import { useHealthMonitorStore } from './healthMonitorStore';

// ── Types ─────────────────────────────────────────────────

export interface SlaGoal {
  integrationId: IntegrationId;
  targetPercent: number; // e.g. 99.5
  windowHours: number; // e.g. 24
  enabled: boolean;
}

export interface SlaViolation {
  integrationId: IntegrationId;
  targetPercent: number;
  actualPercent: number;
  windowHours: number;
  deficit: number; // how far below target
}

export interface SlaState {
  goals: SlaGoal[];
  setGoal: (integrationId: IntegrationId, targetPercent: number, windowHours: number) => void;
  removeGoal: (integrationId: IntegrationId) => void;
  toggleGoal: (integrationId: IntegrationId) => void;
  getGoal: (integrationId: IntegrationId) => SlaGoal | undefined;
  getViolations: () => SlaViolation[];
}

// ── Store ─────────────────────────────────────────────────

export const useSlaStore = create<SlaState>()(
  persist(
    (set, get) => ({
      goals: [],

      setGoal: (integrationId, targetPercent, windowHours) =>
        set((state) => {
          const existing = state.goals.findIndex(
            (g) => g.integrationId === integrationId,
          );
          const goal: SlaGoal = {
            integrationId,
            targetPercent: Math.max(90, Math.min(100, targetPercent)),
            windowHours,
            enabled: true,
          };
          if (existing >= 0) {
            const updated = [...state.goals];
            updated[existing] = goal;
            return { goals: updated };
          }
          return { goals: [...state.goals, goal] };
        }),

      removeGoal: (integrationId) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.integrationId !== integrationId),
        })),

      toggleGoal: (integrationId) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.integrationId === integrationId
              ? { ...g, enabled: !g.enabled }
              : g,
          ),
        })),

      getGoal: (integrationId) =>
        get().goals.find((g) => g.integrationId === integrationId),

      getViolations: () => {
        const { goals } = get();
        const healthStore = useHealthMonitorStore.getState();
        const violations: SlaViolation[] = [];

        for (const goal of goals) {
          if (!goal.enabled) continue;
          const windowMs = goal.windowHours * 3_600_000;
          const actualPercent = healthStore.getUptimePercent(
            goal.integrationId,
            windowMs,
          );
          if (actualPercent < goal.targetPercent) {
            violations.push({
              integrationId: goal.integrationId,
              targetPercent: goal.targetPercent,
              actualPercent,
              windowHours: goal.windowHours,
              deficit: Math.round((goal.targetPercent - actualPercent) * 100) / 100,
            });
          }
        }

        return violations;
      },
    }),
    {
      name: 'aios-sla-goals',
      storage: safePersistStorage,
      partialize: (state) => ({
        goals: state.goals,
      }),
    },
  ),
);
