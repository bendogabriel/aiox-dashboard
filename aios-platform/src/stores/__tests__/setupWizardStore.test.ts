import { describe, it, expect, beforeEach } from 'vitest';
import { useSetupWizardStore, STEPS } from '../setupWizardStore';

describe('setupWizardStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSetupWizardStore.getState().reset();
  });

  describe('initial state', () => {
    it('starts closed and not completed', () => {
      const state = useSetupWizardStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.wizardCompleted).toBe(false);
      expect(state.wizardDismissed).toBe(false);
      expect(state.currentStep).toBe(0);
    });

    it('has default step results', () => {
      const state = useSetupWizardStore.getState();
      for (const step of STEPS) {
        expect(state.stepResults[step]).toEqual({ completed: false, skipped: false });
      }
    });
  });

  describe('open / close', () => {
    it('opens wizard and resets to step 0', () => {
      const store = useSetupWizardStore.getState();
      store.goToStep(2);
      store.open();
      const state = useSetupWizardStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.currentStep).toBe(0);
    });

    it('closes wizard', () => {
      const store = useSetupWizardStore.getState();
      store.open();
      store.close();
      expect(useSetupWizardStore.getState().isOpen).toBe(false);
    });
  });

  describe('navigation', () => {
    it('navigates forward', () => {
      const store = useSetupWizardStore.getState();
      store.nextStep();
      expect(useSetupWizardStore.getState().currentStep).toBe(1);
      store.nextStep();
      expect(useSetupWizardStore.getState().currentStep).toBe(2);
    });

    it('does not exceed max step', () => {
      const store = useSetupWizardStore.getState();
      for (let i = 0; i < 10; i++) store.nextStep();
      expect(useSetupWizardStore.getState().currentStep).toBe(STEPS.length - 1);
    });

    it('navigates backward', () => {
      const store = useSetupWizardStore.getState();
      store.goToStep(3);
      store.prevStep();
      expect(useSetupWizardStore.getState().currentStep).toBe(2);
    });

    it('does not go below 0', () => {
      const store = useSetupWizardStore.getState();
      store.prevStep();
      expect(useSetupWizardStore.getState().currentStep).toBe(0);
    });

    it('goToStep clamps to valid range', () => {
      const store = useSetupWizardStore.getState();
      store.goToStep(-5);
      expect(useSetupWizardStore.getState().currentStep).toBe(0);
      store.goToStep(100);
      expect(useSetupWizardStore.getState().currentStep).toBe(STEPS.length - 1);
    });
  });

  describe('step results', () => {
    it('marks step as completed', () => {
      const store = useSetupWizardStore.getState();
      store.markStepCompleted('engine');
      const result = useSetupWizardStore.getState().stepResults.engine;
      expect(result.completed).toBe(true);
      expect(result.skipped).toBe(false);
    });

    it('marks step as skipped', () => {
      const store = useSetupWizardStore.getState();
      store.markStepSkipped('supabase');
      const result = useSetupWizardStore.getState().stepResults.supabase;
      expect(result.completed).toBe(false);
      expect(result.skipped).toBe(true);
    });

    it('completing overrides previous skip', () => {
      const store = useSetupWizardStore.getState();
      store.markStepSkipped('engine');
      store.markStepCompleted('engine');
      const result = useSetupWizardStore.getState().stepResults.engine;
      expect(result.completed).toBe(true);
      expect(result.skipped).toBe(false);
    });
  });

  describe('dismiss / complete', () => {
    it('dismiss sets wizardDismissed and closes', () => {
      const store = useSetupWizardStore.getState();
      store.open();
      store.dismiss();
      const state = useSetupWizardStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.wizardDismissed).toBe(true);
      expect(state.wizardCompleted).toBe(false);
    });

    it('complete sets wizardCompleted and closes', () => {
      const store = useSetupWizardStore.getState();
      store.open();
      store.complete();
      const state = useSetupWizardStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.wizardCompleted).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets everything to defaults', () => {
      const store = useSetupWizardStore.getState();
      store.open();
      store.goToStep(3);
      store.markStepCompleted('engine');
      store.complete();
      store.reset();

      const state = useSetupWizardStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.wizardCompleted).toBe(false);
      expect(state.wizardDismissed).toBe(false);
      expect(state.currentStep).toBe(0);
      expect(state.stepResults.engine.completed).toBe(false);
    });
  });

  describe('STEPS constant', () => {
    it('has 4 steps in correct order', () => {
      expect(STEPS).toEqual(['engine', 'supabase', 'api-keys', 'channels']);
    });
  });
});
