import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import type { IntegrationId, IntegrationStatus } from './integrationStore';

// ── Types ─────────────────────────────────────────────

export interface HealthEvent {
  id: string;
  timestamp: number;
  integrationId: IntegrationId;
  previousStatus: IntegrationStatus;
  newStatus: IntegrationStatus;
  /** Number of capabilities affected by this change */
  capabilitiesAffected: number;
  /** Summary of capability state after this event */
  capabilitySummary: {
    full: number;
    degraded: number;
    unavailable: number;
    total: number;
  };
}

export interface WebhookConfig {
  id: string;
  url: string;
  enabled: boolean;
  /** Events that trigger this webhook */
  triggers: WebhookTrigger[];
  /** Optional custom header (e.g., Bearer token) */
  authHeader?: string;
}

export type WebhookTrigger = 'integration_down' | 'integration_up' | 'all_clear' | 'degraded';

interface CapabilityHistoryState {
  events: HealthEvent[];
  webhooks: WebhookConfig[];
}

interface CapabilityHistoryActions {
  /** Record a new health event */
  recordEvent: (event: Omit<HealthEvent, 'id' | 'timestamp'>) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Get events for a specific integration */
  getEventsForIntegration: (id: IntegrationId) => HealthEvent[];
  /** Get events in a time range */
  getEventsInRange: (startMs: number, endMs: number) => HealthEvent[];
  /** Get latest N events */
  getLatestEvents: (n: number) => HealthEvent[];
  /** Add a webhook config */
  addWebhook: (url: string, triggers: WebhookTrigger[]) => void;
  /** Remove a webhook */
  removeWebhook: (id: string) => void;
  /** Toggle webhook enabled/disabled */
  toggleWebhook: (id: string) => void;
  /** Update webhook config */
  updateWebhook: (id: string, updates: Partial<Pick<WebhookConfig, 'url' | 'triggers' | 'authHeader'>>) => void;
}

const MAX_EVENTS = 500;

// ── Store ─────────────────────────────────────────────

export const useCapabilityHistoryStore = create<CapabilityHistoryState & CapabilityHistoryActions>()(
  persist(
    (set, get) => ({
      events: [],
      webhooks: [],

      recordEvent: (event) => {
        const newEvent: HealthEvent = {
          ...event,
          id: `he-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          events: [newEvent, ...state.events].slice(0, MAX_EVENTS),
        }));

        // Fire webhooks asynchronously
        const { webhooks } = get();
        if (webhooks.length > 0) {
          fireWebhooks(webhooks, newEvent);
        }
      },

      clearHistory: () => set({ events: [] }),

      getEventsForIntegration: (id) =>
        get().events.filter((e) => e.integrationId === id),

      getEventsInRange: (startMs, endMs) =>
        get().events.filter((e) => e.timestamp >= startMs && e.timestamp <= endMs),

      getLatestEvents: (n) => get().events.slice(0, n),

      addWebhook: (url, triggers) =>
        set((state) => ({
          webhooks: [
            ...state.webhooks,
            {
              id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              url,
              enabled: true,
              triggers,
            },
          ],
        })),

      removeWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.filter((w) => w.id !== id),
        })),

      toggleWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w,
          ),
        })),

      updateWebhook: (id, updates) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, ...updates } : w,
          ),
        })),
    }),
    {
      name: 'aios-capability-history',
      storage: safePersistStorage,
      partialize: (state) => ({
        events: state.events.slice(0, 200), // Persist fewer to save space
        webhooks: state.webhooks,
      }),
    },
  ),
);

// ── Webhook dispatch ──────────────────────────────────

function mapEventToTrigger(event: HealthEvent): WebhookTrigger | null {
  const isOnline = (s: IntegrationStatus) => s === 'connected' || s === 'partial';
  const wasOnline = isOnline(event.previousStatus);
  const nowOnline = isOnline(event.newStatus);

  if (wasOnline && !nowOnline) return 'integration_down';
  if (!wasOnline && nowOnline) return 'integration_up';
  if (event.capabilitySummary.unavailable === 0 && event.capabilitySummary.degraded === 0) return 'all_clear';
  if (event.capabilitySummary.degraded > 0 || event.capabilitySummary.unavailable > 0) return 'degraded';
  return null;
}

async function fireWebhooks(webhooks: WebhookConfig[], event: HealthEvent) {
  const trigger = mapEventToTrigger(event);
  if (!trigger) return;

  const payload = {
    type: 'aios-health-event',
    trigger,
    event: {
      integrationId: event.integrationId,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      capabilitiesAffected: event.capabilitiesAffected,
      summary: event.capabilitySummary,
      timestamp: new Date(event.timestamp).toISOString(),
    },
  };

  for (const wh of webhooks) {
    if (!wh.enabled) continue;
    if (!wh.triggers.includes(trigger)) continue;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (wh.authHeader) headers['Authorization'] = wh.authHeader;

      fetch(wh.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }).catch(() => { /* best-effort, don't block UI */ });
    } catch {
      /* best-effort */
    }
  }
}
