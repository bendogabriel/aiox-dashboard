/**
 * Marketplace Submission Store — Wizard state with auto-save
 * PRD: PRD-MARKETPLACE | Story: 4.2, 4.3
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import type {
  SubmitWizardStep,
  SubmitWizardState,
  PricingModel,
  MarketplaceCategory,
  MarketplaceAgentConfig,
} from '../types/marketplace';

interface SubmissionActions {
  // Navigation
  setStep: (step: SubmitWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  // Step 1: Basic Info
  updateBasicInfo: (partial: Partial<SubmitWizardState['basicInfo']>) => void;
  // Step 2: Agent Config
  updateAgentConfig: (partial: Partial<MarketplaceAgentConfig>) => void;
  addCommand: (command: { command: string; action: string; description?: string }) => void;
  removeCommand: (index: number) => void;
  addCapability: (cap: string) => void;
  removeCapability: (cap: string) => void;
  // Step 3: Pricing
  updatePricing: (partial: Partial<SubmitWizardState['pricing']>) => void;
  // Step 5: Checklist
  toggleChecklistItem: (key: string) => void;
  // Validation
  validateStep: (step: SubmitWizardStep) => boolean;
  // Reset
  resetWizard: () => void;
  setListingId: (id: string | null) => void;
}

const CHECKLIST_KEYS = [
  'description_clear',
  'persona_defined',
  'has_commands',
  'pricing_set',
  'tested_3_prompts',
  'screenshots_added',
  'tags_relevant',
  'terms_accepted',
];

const defaultState: SubmitWizardState = {
  currentStep: 1,
  listingId: null,
  basicInfo: {
    name: '',
    tagline: '',
    description: '',
    category: 'default' as MarketplaceCategory,
    tags: [],
    icon: '',
    cover_image_url: '',
    screenshots: [],
  },
  agentConfig: {
    persona: {},
    commands: [],
    capabilities: [],
  },
  pricing: {
    model: 'free' as PricingModel,
    amount: 0,
    currency: 'BRL',
    credits_per_use: null,
    sla_response_ms: null,
    sla_uptime_pct: null,
    sla_max_tokens: null,
  },
  preSubmitChecklist: Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, false])),
  stepValid: { 1: false, 2: false, 3: false, 4: false, 5: false },
};

export const useSubmissionStore = create<SubmitWizardState & SubmissionActions>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const current = get().currentStep;
        if (current < 5) set({ currentStep: (current + 1) as SubmitWizardStep });
      },

      prevStep: () => {
        const current = get().currentStep;
        if (current > 1) set({ currentStep: (current - 1) as SubmitWizardStep });
      },

      updateBasicInfo: (partial) =>
        set((s) => ({ basicInfo: { ...s.basicInfo, ...partial } })),

      updateAgentConfig: (partial) =>
        set((s) => ({ agentConfig: { ...s.agentConfig, ...partial } })),

      addCommand: (cmd) =>
        set((s) => ({
          agentConfig: {
            ...s.agentConfig,
            commands: [...(s.agentConfig.commands ?? []), cmd],
          },
        })),

      removeCommand: (index) =>
        set((s) => ({
          agentConfig: {
            ...s.agentConfig,
            commands: (s.agentConfig.commands ?? []).filter((_, i) => i !== index),
          },
        })),

      addCapability: (cap) =>
        set((s) => ({
          agentConfig: {
            ...s.agentConfig,
            capabilities: [...new Set([...(s.agentConfig.capabilities ?? []), cap])],
          },
        })),

      removeCapability: (cap) =>
        set((s) => ({
          agentConfig: {
            ...s.agentConfig,
            capabilities: (s.agentConfig.capabilities ?? []).filter((c) => c !== cap),
          },
        })),

      updatePricing: (partial) =>
        set((s) => ({ pricing: { ...s.pricing, ...partial } })),

      toggleChecklistItem: (key) =>
        set((s) => ({
          preSubmitChecklist: {
            ...s.preSubmitChecklist,
            [key]: !s.preSubmitChecklist[key],
          },
        })),

      validateStep: (step) => {
        const s = get();
        let valid = false;

        switch (step) {
          case 1:
            valid = !!(s.basicInfo.name.trim() && s.basicInfo.tagline.trim() && s.basicInfo.description.trim() && s.basicInfo.category !== 'default');
            break;
          case 2:
            valid = !!(s.agentConfig.persona?.role?.trim());
            break;
          case 3:
            valid = s.pricing.model === 'free' || s.pricing.amount > 0;
            break;
          case 4:
            valid = true; // Testing is optional
            break;
          case 5:
            valid = Object.values(s.preSubmitChecklist).every(Boolean);
            break;
        }

        set((prev) => ({ stepValid: { ...prev.stepValid, [step]: valid } }));
        return valid;
      },

      resetWizard: () => set(defaultState),

      setListingId: (id) => set({ listingId: id }),
    }),
    {
      name: 'aios-marketplace-submission',
      storage: safePersistStorage,
    },
  ),
);

export { CHECKLIST_KEYS };
