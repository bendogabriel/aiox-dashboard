/**
 * Graceful Degradation Map — P3
 *
 * Defines which features depend on which services and computes
 * available capabilities based on current integration status.
 */

import type { IntegrationId, IntegrationStatus } from '../stores/integrationStore';

// ── Capability definitions ─────────────────────────────────

export type Capability =
  | 'agent-execution'
  | 'workflow-execution'
  | 'job-management'
  | 'pool-monitor'
  | 'cron-management'
  | 'authority-audit'
  | 'memory-store'
  | 'team-bundles'
  | 'task-persistence'
  | 'task-history'
  | 'task-replay'
  | 'whatsapp-messaging'
  | 'telegram-messaging'
  | 'sales-room'
  | 'google-drive'
  | 'google-calendar'
  | 'llm-health'
  | 'cost-tracking'
  | 'voice-tts'
  | 'analytics-dashboard'
  | 'realtime-metrics';

export type CapabilityLevel = 'full' | 'degraded' | 'unavailable';

export interface CapabilityInfo {
  id: Capability;
  label: string;
  level: CapabilityLevel;
  reason?: string;
  dependsOn: IntegrationId[];
}

// ── Service → Capability dependency map ────────────────────

interface CapabilityDef {
  id: Capability;
  label: string;
  /** All required — if ANY are offline, capability is degraded/unavailable */
  requires: IntegrationId[];
  /** Optional dependencies — if offline, capability is degraded but still available */
  enhancedBy?: IntegrationId[];
  /** Views/routes where this capability matters */
  relevantViews: string[];
}

const CAPABILITY_DEFS: CapabilityDef[] = [
  // Engine-dependent (critical)
  {
    id: 'agent-execution',
    label: 'Agent Execution',
    requires: ['engine'],
    enhancedBy: ['api-keys'],
    relevantViews: ['chat', 'bob', 'orchestrator', 'workflow'],
  },
  {
    id: 'workflow-execution',
    label: 'Workflow Execution',
    requires: ['engine'],
    enhancedBy: ['api-keys'],
    relevantViews: ['workflow', 'orchestrator'],
  },
  {
    id: 'job-management',
    label: 'Job Management',
    requires: ['engine'],
    relevantViews: ['engine-view'],
  },
  {
    id: 'pool-monitor',
    label: 'Process Pool',
    requires: ['engine'],
    relevantViews: ['engine-view'],
  },
  {
    id: 'cron-management',
    label: 'Scheduled Jobs',
    requires: ['engine'],
    relevantViews: ['engine-view'],
  },
  {
    id: 'authority-audit',
    label: 'Authority Audit',
    requires: ['engine'],
    relevantViews: ['authority'],
  },
  {
    id: 'memory-store',
    label: 'Memory Store',
    requires: ['engine'],
    relevantViews: ['context'],
  },
  {
    id: 'team-bundles',
    label: 'Team Bundles',
    requires: ['engine'],
    relevantViews: ['engine-view'],
  },

  // Supabase-dependent (optional, has fallbacks)
  {
    id: 'task-persistence',
    label: 'Task Persistence',
    requires: [],
    enhancedBy: ['supabase'],
    relevantViews: ['workflow', 'orchestrator'],
  },
  {
    id: 'task-history',
    label: 'Task History',
    requires: [],
    enhancedBy: ['supabase'],
    relevantViews: ['workflow'],
  },
  {
    id: 'task-replay',
    label: 'Task Replay',
    requires: ['supabase'],
    relevantViews: ['workflow'],
  },

  // Messaging channels (optional)
  {
    id: 'whatsapp-messaging',
    label: 'WhatsApp',
    requires: ['engine', 'whatsapp'],
    relevantViews: ['sales-room'],
  },
  {
    id: 'telegram-messaging',
    label: 'Telegram',
    requires: ['engine', 'telegram'],
    relevantViews: ['chat'],
  },
  {
    id: 'sales-room',
    label: 'Sales Room',
    requires: ['engine'],
    enhancedBy: ['whatsapp', 'telegram'],
    relevantViews: ['sales-room'],
  },

  // Google services (optional)
  {
    id: 'google-drive',
    label: 'Google Drive',
    requires: ['engine', 'google-drive'],
    relevantViews: ['integrations'],
  },
  {
    id: 'google-calendar',
    label: 'Google Calendar',
    requires: ['engine', 'google-calendar'],
    relevantViews: ['integrations'],
  },

  // LLM / API keys
  {
    id: 'llm-health',
    label: 'LLM Providers',
    requires: ['api-keys'],
    relevantViews: ['dashboard', 'cockpit'],
  },
  {
    id: 'cost-tracking',
    label: 'Cost Tracking',
    requires: ['api-keys'],
    enhancedBy: ['engine'],
    relevantViews: ['dashboard', 'cockpit'],
  },

  // Voice
  {
    id: 'voice-tts',
    label: 'Voice / TTS',
    requires: [],
    enhancedBy: ['voice'],
    relevantViews: ['chat', 'search'],
  },

  // Analytics
  {
    id: 'analytics-dashboard',
    label: 'Analytics',
    requires: ['engine'],
    relevantViews: ['dashboard', 'cockpit'],
  },
  {
    id: 'realtime-metrics',
    label: 'Realtime Metrics',
    requires: ['engine'],
    relevantViews: ['dashboard', 'cockpit', 'monitor'],
  },
];

// ── Compute capabilities ───────────────────────────────────

type StatusMap = Record<IntegrationId, IntegrationStatus>;

function isOnline(status: IntegrationStatus): boolean {
  return status === 'connected' || status === 'partial';
}

/**
 * Compute all capability levels based on current integration statuses.
 */
export function computeCapabilities(statuses: StatusMap): CapabilityInfo[] {
  return CAPABILITY_DEFS.map((def) => {
    // Check required services
    const missingRequired = def.requires.filter((id) => !isOnline(statuses[id]));
    // Check enhanced-by services
    const missingEnhanced = (def.enhancedBy || []).filter((id) => !isOnline(statuses[id]));

    let level: CapabilityLevel;
    let reason: string | undefined;

    if (missingRequired.length > 0) {
      level = 'unavailable';
      reason = `Requires: ${missingRequired.join(', ')}`;
    } else if (missingEnhanced.length > 0) {
      level = 'degraded';
      reason = `Limited without: ${missingEnhanced.join(', ')}`;
    } else {
      level = 'full';
    }

    return {
      id: def.id,
      label: def.label,
      level,
      reason,
      dependsOn: [...def.requires, ...(def.enhancedBy || [])],
    };
  });
}

/**
 * Get capabilities relevant to a specific view.
 */
export function getViewCapabilities(statuses: StatusMap, view: string): CapabilityInfo[] {
  const all = computeCapabilities(statuses);
  const viewDefs = CAPABILITY_DEFS.filter((d) => d.relevantViews.includes(view));
  const viewCapIds = new Set(viewDefs.map((d) => d.id));
  return all.filter((c) => viewCapIds.has(c.id));
}

/**
 * Quick summary: counts by level.
 */
export function getCapabilitySummary(capabilities: CapabilityInfo[]): {
  full: number;
  degraded: number;
  unavailable: number;
  total: number;
} {
  return {
    full: capabilities.filter((c) => c.level === 'full').length,
    degraded: capabilities.filter((c) => c.level === 'degraded').length,
    unavailable: capabilities.filter((c) => c.level === 'unavailable').length,
    total: capabilities.length,
  };
}

/**
 * Get all capability definitions (for documentation/reference).
 */
export function getCapabilityDefs(): readonly CapabilityDef[] {
  return CAPABILITY_DEFS;
}
