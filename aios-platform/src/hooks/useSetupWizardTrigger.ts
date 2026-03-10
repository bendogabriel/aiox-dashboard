import { useEffect } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { useSetupWizardStore } from '../stores/setupWizardStore';

/**
 * Auto-opens the Setup Wizard on first run when no core integrations
 * (engine, supabase, api-keys) are connected.
 *
 * Conditions to trigger:
 * - Wizard never completed AND not dismissed
 * - At least one integration check has finished
 * - Zero core integrations connected
 */
export function useSetupWizardTrigger() {
  const integrations = useIntegrationStore((s) => s.integrations);
  const { wizardCompleted, wizardDismissed, isOpen, open } = useSetupWizardStore();

  useEffect(() => {
    // Don't trigger if already completed, dismissed, or open
    if (wizardCompleted || wizardDismissed || isOpen) return;

    const entries = Object.values(integrations);

    // Wait until at least one check has completed
    const anyChecked = entries.some((e) => e.lastChecked != null);
    if (!anyChecked) return;

    // Don't trigger while still checking
    const stillChecking = entries.some((e) => e.status === 'checking');
    if (stillChecking) return;

    // Check core integrations
    const coreIds = ['engine', 'supabase', 'api-keys'] as const;
    const coreConnected = coreIds.filter(
      (id) => integrations[id].status === 'connected',
    ).length;

    // Open wizard if no core integration is connected
    if (coreConnected === 0) {
      open();
    }
  }, [integrations, wizardCompleted, wizardDismissed, isOpen, open]);
}
