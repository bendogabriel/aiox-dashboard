import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';

export type WizardStep = 'engine' | 'supabase' | 'api-keys' | 'channels';

export interface StepResult {
  completed: boolean;
  skipped: boolean;
}

interface SetupWizardState {
  /** Wizard has been completed at least once */
  wizardCompleted: boolean;
  /** Wizard was dismissed without completing */
  wizardDismissed: boolean;
  /** Wizard is currently open */
  isOpen: boolean;
  /** Current step index */
  currentStep: number;
  /** Results per step */
  stepResults: Record<WizardStep, StepResult>;
}

interface SetupWizardActions {
  open: () => void;
  close: () => void;
  dismiss: () => void;
  complete: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  markStepCompleted: (step: WizardStep) => void;
  markStepSkipped: (step: WizardStep) => void;
  reset: () => void;
}

const STEPS: WizardStep[] = ['engine', 'supabase', 'api-keys', 'channels'];

const defaultStepResults: Record<WizardStep, StepResult> = {
  engine: { completed: false, skipped: false },
  supabase: { completed: false, skipped: false },
  'api-keys': { completed: false, skipped: false },
  channels: { completed: false, skipped: false },
};

export { STEPS };

export const useSetupWizardStore = create<SetupWizardState & SetupWizardActions>()(
  persist(
    (set) => ({
      wizardCompleted: false,
      wizardDismissed: false,
      isOpen: false,
      currentStep: 0,
      stepResults: { ...defaultStepResults },

      open: () => set({ isOpen: true, currentStep: 0 }),
      close: () => set({ isOpen: false }),
      dismiss: () => set({ isOpen: false, wizardDismissed: true }),
      complete: () => set({ isOpen: false, wizardCompleted: true }),

      nextStep: () =>
        set((s) => ({
          currentStep: Math.min(s.currentStep + 1, STEPS.length - 1),
        })),

      prevStep: () =>
        set((s) => ({
          currentStep: Math.max(s.currentStep - 1, 0),
        })),

      goToStep: (index) =>
        set({ currentStep: Math.max(0, Math.min(index, STEPS.length - 1)) }),

      markStepCompleted: (step) =>
        set((s) => ({
          stepResults: {
            ...s.stepResults,
            [step]: { completed: true, skipped: false },
          },
        })),

      markStepSkipped: (step) =>
        set((s) => ({
          stepResults: {
            ...s.stepResults,
            [step]: { completed: false, skipped: true },
          },
        })),

      reset: () =>
        set({
          wizardCompleted: false,
          wizardDismissed: false,
          isOpen: false,
          currentStep: 0,
          stepResults: { ...defaultStepResults },
        }),
    }),
    {
      name: 'aios-setup-wizard',
      storage: safePersistStorage,
      partialize: (s) => ({
        wizardCompleted: s.wizardCompleted,
        wizardDismissed: s.wizardDismissed,
        stepResults: s.stepResults,
      }),
    },
  ),
);
