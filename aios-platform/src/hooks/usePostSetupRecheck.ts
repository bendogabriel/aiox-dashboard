import { useEffect, useRef } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { useSetupWizardStore } from '../stores/setupWizardStore';
import { probeAllIntegrations } from './useHealthCheck';

/**
 * Triggers a full health recheck when:
 * 1. Setup wizard closes (complete or dismiss)
 * 2. A setup modal closes (individual integration config)
 *
 * Debounces to avoid rapid-fire probes.
 */
export function usePostSetupRecheck() {
  const wizardOpen = useSetupWizardStore((s) => s.isOpen);
  const setupModalOpen = useIntegrationStore((s) => s.setupModalOpen);
  const prevWizardOpen = useRef(wizardOpen);
  const prevModalOpen = useRef(setupModalOpen);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const wizardJustClosed = prevWizardOpen.current && !wizardOpen;
    const modalJustClosed = prevModalOpen.current !== null && setupModalOpen === null;

    prevWizardOpen.current = wizardOpen;
    prevModalOpen.current = setupModalOpen;

    if (wizardJustClosed || modalJustClosed) {
      // Debounce: wait 500ms after close to let any pending writes settle
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        probeAllIntegrations();
      }, 500);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [wizardOpen, setupModalOpen]);
}
