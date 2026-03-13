import { useEffect } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { useSetupWizardStore } from '../stores/setupWizardStore';
import { useUIStore } from '../stores/uiStore';

const ONBOARDING_KEY = 'aios-integration-onboarding-seen';

/**
 * Auto-redirects to Integrations page if no integrations are connected
 * and the Setup Wizard isn't handling the first-run experience.
 * Defers to the Setup Wizard when it's active.
 */
export function useIntegrationOnboarding() {
  const integrations = useIntegrationStore((s) => s.integrations);
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const currentView = useUIStore((s) => s.currentView);
  const wizardOpen = useSetupWizardStore((s) => s.isOpen);

  useEffect(() => {
    // Don't redirect if wizard is handling first-run
    if (wizardOpen) return;

    // Don't redirect if already on integrations page
    if (currentView === 'integrations') return;

    // Don't redirect if user has already seen onboarding
    try {
      if (localStorage.getItem(ONBOARDING_KEY) === 'true') return;
    } catch { /* empty */ }

    const entries = Object.values(integrations);

    // Wait until at least one check has completed
    const anyChecked = entries.some((e) => e.lastChecked != null);
    if (!anyChecked) return;

    // Don't redirect while still checking
    const stillChecking = entries.some((e) => e.status === 'checking');
    if (stillChecking) return;

    // If zero integrations are connected, redirect
    const connectedCount = entries.filter((e) => e.status === 'connected').length;
    if (connectedCount === 0) {
      setCurrentView('integrations');
    }

    // Mark onboarding as seen regardless (only redirect once)
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch { /* empty */ }
  }, [integrations, currentView, setCurrentView, wizardOpen]);
}
