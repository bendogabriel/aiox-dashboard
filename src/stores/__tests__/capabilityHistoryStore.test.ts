import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCapabilityHistoryStore } from '../capabilityHistoryStore';

describe('capabilityHistoryStore', () => {
  beforeEach(() => {
    // Reset store
    useCapabilityHistoryStore.setState({
      events: [],
      webhooks: [],
    });
  });

  describe('recordEvent', () => {
    it('records a health event', () => {
      const store = useCapabilityHistoryStore.getState();
      store.recordEvent({
        integrationId: 'engine',
        previousStatus: 'disconnected',
        newStatus: 'connected',
        capabilitiesAffected: 12,
        capabilitySummary: { full: 18, degraded: 2, unavailable: 1, total: 21 },
      });

      const events = useCapabilityHistoryStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].integrationId).toBe('engine');
      expect(events[0].previousStatus).toBe('disconnected');
      expect(events[0].newStatus).toBe('connected');
      expect(events[0].capabilitiesAffected).toBe(12);
      expect(events[0].timestamp).toBeGreaterThan(0);
      expect(events[0].id).toBeTruthy();
    });

    it('prepends new events (most recent first)', () => {
      const store = useCapabilityHistoryStore.getState();
      store.recordEvent({
        integrationId: 'engine',
        previousStatus: 'disconnected',
        newStatus: 'connected',
        capabilitiesAffected: 5,
        capabilitySummary: { full: 10, degraded: 0, unavailable: 0, total: 10 },
      });
      store.recordEvent({
        integrationId: 'supabase',
        previousStatus: 'disconnected',
        newStatus: 'connected',
        capabilitiesAffected: 3,
        capabilitySummary: { full: 15, degraded: 0, unavailable: 0, total: 15 },
      });

      const events = useCapabilityHistoryStore.getState().events;
      expect(events).toHaveLength(2);
      expect(events[0].integrationId).toBe('supabase');
      expect(events[1].integrationId).toBe('engine');
    });

    it('limits to 500 events', () => {
      const store = useCapabilityHistoryStore.getState();
      for (let i = 0; i < 510; i++) {
        store.recordEvent({
          integrationId: 'engine',
          previousStatus: 'disconnected',
          newStatus: 'connected',
          capabilitiesAffected: 1,
          capabilitySummary: { full: 1, degraded: 0, unavailable: 0, total: 1 },
        });
      }

      expect(useCapabilityHistoryStore.getState().events).toHaveLength(500);
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      const store = useCapabilityHistoryStore.getState();
      // Add events with known timestamps
      useCapabilityHistoryStore.setState({
        events: [
          {
            id: 'e3', timestamp: 3000, integrationId: 'supabase',
            previousStatus: 'disconnected', newStatus: 'connected',
            capabilitiesAffected: 2, capabilitySummary: { full: 20, degraded: 0, unavailable: 1, total: 21 },
          },
          {
            id: 'e2', timestamp: 2000, integrationId: 'engine',
            previousStatus: 'connected', newStatus: 'disconnected',
            capabilitiesAffected: 10, capabilitySummary: { full: 5, degraded: 5, unavailable: 11, total: 21 },
          },
          {
            id: 'e1', timestamp: 1000, integrationId: 'engine',
            previousStatus: 'disconnected', newStatus: 'connected',
            capabilitiesAffected: 10, capabilitySummary: { full: 18, degraded: 2, unavailable: 1, total: 21 },
          },
        ],
      });
    });

    it('getEventsForIntegration filters by ID', () => {
      const events = useCapabilityHistoryStore.getState().getEventsForIntegration('engine');
      expect(events).toHaveLength(2);
      events.forEach((e) => expect(e.integrationId).toBe('engine'));
    });

    it('getEventsInRange filters by time', () => {
      const events = useCapabilityHistoryStore.getState().getEventsInRange(1500, 3500);
      expect(events).toHaveLength(2);
    });

    it('getLatestEvents returns N most recent', () => {
      const events = useCapabilityHistoryStore.getState().getLatestEvents(2);
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('e3');
      expect(events[1].id).toBe('e2');
    });
  });

  describe('clearHistory', () => {
    it('clears all events', () => {
      const store = useCapabilityHistoryStore.getState();
      store.recordEvent({
        integrationId: 'engine',
        previousStatus: 'disconnected',
        newStatus: 'connected',
        capabilitiesAffected: 1,
        capabilitySummary: { full: 1, degraded: 0, unavailable: 0, total: 1 },
      });
      store.clearHistory();
      expect(useCapabilityHistoryStore.getState().events).toHaveLength(0);
    });
  });

  describe('webhooks CRUD', () => {
    it('adds a webhook', () => {
      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://hooks.slack.com/test', ['integration_down', 'integration_up']);

      const webhooks = useCapabilityHistoryStore.getState().webhooks;
      expect(webhooks).toHaveLength(1);
      expect(webhooks[0].url).toBe('https://hooks.slack.com/test');
      expect(webhooks[0].enabled).toBe(true);
      expect(webhooks[0].triggers).toEqual(['integration_down', 'integration_up']);
    });

    it('removes a webhook', () => {
      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://example.com/hook', ['integration_down']);
      const id = useCapabilityHistoryStore.getState().webhooks[0].id;
      store.removeWebhook(id);
      expect(useCapabilityHistoryStore.getState().webhooks).toHaveLength(0);
    });

    it('toggles a webhook', () => {
      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://example.com/hook', ['integration_down']);
      const id = useCapabilityHistoryStore.getState().webhooks[0].id;

      store.toggleWebhook(id);
      expect(useCapabilityHistoryStore.getState().webhooks[0].enabled).toBe(false);

      store.toggleWebhook(id);
      expect(useCapabilityHistoryStore.getState().webhooks[0].enabled).toBe(true);
    });

    it('updates a webhook', () => {
      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://example.com/hook', ['integration_down']);
      const id = useCapabilityHistoryStore.getState().webhooks[0].id;

      store.updateWebhook(id, {
        url: 'https://example.com/new-hook',
        triggers: ['all_clear'],
      });

      const wh = useCapabilityHistoryStore.getState().webhooks[0];
      expect(wh.url).toBe('https://example.com/new-hook');
      expect(wh.triggers).toEqual(['all_clear']);
    });
  });

  describe('webhook dispatch on recordEvent', () => {
    it('fires webhook on integration_down event', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
      global.fetch = mockFetch;

      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://example.com/hook', ['integration_down']);

      store.recordEvent({
        integrationId: 'engine',
        previousStatus: 'connected',
        newStatus: 'disconnected',
        capabilitiesAffected: 10,
        capabilitySummary: { full: 5, degraded: 5, unavailable: 11, total: 21 },
      });

      // Give async webhook time to fire
      await new Promise((r) => setTimeout(r, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('integration_down'),
        }),
      );
    });

    it('does not fire webhook when trigger does not match', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
      global.fetch = mockFetch;

      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://example.com/hook', ['all_clear']); // Only all_clear

      store.recordEvent({
        integrationId: 'engine',
        previousStatus: 'connected',
        newStatus: 'disconnected',
        capabilitiesAffected: 10,
        capabilitySummary: { full: 5, degraded: 5, unavailable: 11, total: 21 },
      });

      await new Promise((r) => setTimeout(r, 10));

      // Should not be called because trigger is 'integration_down' but webhook only listens for 'all_clear'
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not fire disabled webhook', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
      global.fetch = mockFetch;

      const store = useCapabilityHistoryStore.getState();
      store.addWebhook('https://example.com/hook', ['integration_down']);
      const id = useCapabilityHistoryStore.getState().webhooks[0].id;
      store.toggleWebhook(id); // Disable it

      store.recordEvent({
        integrationId: 'engine',
        previousStatus: 'connected',
        newStatus: 'disconnected',
        capabilitiesAffected: 10,
        capabilitySummary: { full: 5, degraded: 5, unavailable: 11, total: 21 },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
