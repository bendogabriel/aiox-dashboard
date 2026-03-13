import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { EventLogViewer, filterEvents, computeStats } from '../EventLogViewer';
import type { HealthEvent } from '../../../stores/capabilityHistoryStore';
import type { IntegrationId } from '../../../stores/integrationStore';

// ── Mock Zustand stores ────────────────────────────

const mockEvents: HealthEvent[] = [];

vi.mock('../../../stores/capabilityHistoryStore', () => ({
  useCapabilityHistoryStore: (selector: (s: { events: HealthEvent[] }) => unknown) =>
    selector({ events: mockEvents }),
}));

// ── Test data factory ──────────────────────────────

const NOW = 1700000000000;

function makeEvent(overrides: Partial<HealthEvent> & { id: string }): HealthEvent {
  return {
    timestamp: NOW,
    integrationId: 'engine' as IntegrationId,
    previousStatus: 'connected',
    newStatus: 'disconnected',
    capabilitiesAffected: 3,
    capabilitySummary: { full: 5, degraded: 1, unavailable: 2, total: 8 },
    ...overrides,
  };
}

// ── Setup helper ───────────────────────────────────

function setMockEvents(events: HealthEvent[]) {
  mockEvents.length = 0;
  mockEvents.push(...events);
}

beforeEach(() => {
  setMockEvents([]);
  vi.restoreAllMocks();
});

// ── Pure function tests ────────────────────────────

describe('filterEvents', () => {
  const events: HealthEvent[] = [
    makeEvent({ id: 'e1', integrationId: 'engine', newStatus: 'disconnected', timestamp: NOW - 1000 }),
    makeEvent({ id: 'e2', integrationId: 'supabase', newStatus: 'connected', previousStatus: 'disconnected', timestamp: NOW - 2000 }),
    makeEvent({ id: 'e3', integrationId: 'engine', newStatus: 'connected', previousStatus: 'error', timestamp: NOW - 100_000 }),
    makeEvent({ id: 'e4', integrationId: 'whatsapp', newStatus: 'error', timestamp: NOW - 7_200_000 }),
  ];

  it('filters by integration', () => {
    const result = filterEvents(events, 'engine', 'all', 'all', NOW);
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.integrationId === 'engine')).toBe(true);
  });

  it('returns all events when integration is "all"', () => {
    const result = filterEvents(events, 'all', 'all', 'all', NOW);
    expect(result).toHaveLength(4);
  });

  it('filters by recovery type', () => {
    const result = filterEvents(events, 'all', 'recovery', 'all', NOW);
    expect(result).toHaveLength(2);
    result.forEach((e) => {
      expect(['connected', 'partial']).toContain(e.newStatus);
    });
  });

  it('filters by failure type', () => {
    const result = filterEvents(events, 'all', 'failure', 'all', NOW);
    expect(result).toHaveLength(2);
    result.forEach((e) => {
      expect(['disconnected', 'error']).toContain(e.newStatus);
    });
  });

  it('filters by time range (1h)', () => {
    const result = filterEvents(events, 'all', 'all', '1h', NOW);
    // events at NOW-1000, NOW-2000, NOW-100_000 are within 1h (3_600_000ms)
    // event at NOW-7_200_000 is outside 1h
    expect(result).toHaveLength(3);
  });

  it('filters by time range (all) returns everything', () => {
    const result = filterEvents(events, 'all', 'all', 'all', NOW);
    expect(result).toHaveLength(4);
  });

  it('combines integration + type filters', () => {
    const result = filterEvents(events, 'engine', 'failure', 'all', NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });
});

describe('computeStats', () => {
  it('computes correct total, failure, and recovery counts', () => {
    const events: HealthEvent[] = [
      makeEvent({ id: 's1', newStatus: 'disconnected', timestamp: 1000 }),
      makeEvent({ id: 's2', newStatus: 'connected', previousStatus: 'disconnected', timestamp: 2000 }),
      makeEvent({ id: 's3', newStatus: 'error', timestamp: 3000 }),
      makeEvent({ id: 's4', newStatus: 'partial', previousStatus: 'error', timestamp: 5000 }),
    ];
    const stats = computeStats(events);
    expect(stats.total).toBe(4);
    expect(stats.failureCount).toBe(2);
    expect(stats.recoveryCount).toBe(2);
  });

  it('computes avg time between events', () => {
    const events: HealthEvent[] = [
      makeEvent({ id: 'a1', timestamp: 1000 }),
      makeEvent({ id: 'a2', timestamp: 4000 }),
      makeEvent({ id: 'a3', timestamp: 10000 }),
    ];
    const stats = computeStats(events);
    // avg gap: (3000 + 6000) / 2 = 4500
    expect(stats.avgTimeBetween).toBe(4500);
  });

  it('returns 0 avg time with fewer than 2 events', () => {
    expect(computeStats([]).avgTimeBetween).toBe(0);
    expect(computeStats([makeEvent({ id: 'x1' })]).avgTimeBetween).toBe(0);
  });
});

// ── Component render tests ─────────────────────────

describe('EventLogViewer component', () => {
  it('renders empty state when no events', () => {
    setMockEvents([]);
    render(<EventLogViewer />);
    expect(screen.getByTestId('empty-state')).toBeDefined();
    expect(screen.getByText('No events match your filters')).toBeDefined();
  });

  it('renders event rows', () => {
    setMockEvents([
      makeEvent({ id: 'r1', newStatus: 'error', timestamp: NOW - 5000 }),
      makeEvent({ id: 'r2', newStatus: 'connected', previousStatus: 'error', timestamp: NOW - 2000 }),
    ]);
    render(<EventLogViewer />);
    const rows = screen.getAllByTestId('event-row');
    expect(rows).toHaveLength(2);
  });

  it('renders stats header with correct counts', () => {
    setMockEvents([
      makeEvent({ id: 'st1', newStatus: 'error', timestamp: NOW - 1000 }),
      makeEvent({ id: 'st2', newStatus: 'connected', previousStatus: 'error', timestamp: NOW }),
      makeEvent({ id: 'st3', newStatus: 'disconnected', timestamp: NOW - 500 }),
    ]);
    render(<EventLogViewer />);
    const statsHeader = screen.getByTestId('stats-header');
    // total=3, failures=2 (error+disconnected), recoveries=1 (connected)
    expect(within(statsHeader).getByText('3')).toBeDefined();
    expect(within(statsHeader).getByText('2')).toBeDefined();
    expect(within(statsHeader).getByText('1')).toBeDefined();
  });

  it('filters events by type when clicking filter pills', () => {
    setMockEvents([
      makeEvent({ id: 'ft1', newStatus: 'error', timestamp: NOW }),
      makeEvent({ id: 'ft2', newStatus: 'connected', previousStatus: 'error', timestamp: NOW - 1000 }),
      makeEvent({ id: 'ft3', newStatus: 'disconnected', timestamp: NOW - 2000 }),
    ]);
    render(<EventLogViewer />);

    // Click "Recovery" filter
    fireEvent.click(screen.getByTestId('type-filter-recovery'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(1);

    // Click "Failure" filter
    fireEvent.click(screen.getByTestId('type-filter-failure'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(2);

    // Back to "All"
    fireEvent.click(screen.getByTestId('type-filter-all'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(3);
  });

  it('filters events by integration', () => {
    setMockEvents([
      makeEvent({ id: 'fi1', integrationId: 'engine', timestamp: NOW }),
      makeEvent({ id: 'fi2', integrationId: 'supabase', timestamp: NOW - 1000 }),
      makeEvent({ id: 'fi3', integrationId: 'engine', timestamp: NOW - 2000 }),
    ]);
    render(<EventLogViewer />);

    const select = screen.getByTestId('integration-filter');
    fireEvent.change(select, { target: { value: 'supabase' } });
    expect(screen.getAllByTestId('event-row')).toHaveLength(1);

    fireEvent.change(select, { target: { value: 'all' } });
    expect(screen.getAllByTestId('event-row')).toHaveLength(3);
  });

  it('shows empty state when filters exclude all events', () => {
    setMockEvents([
      makeEvent({ id: 'es1', integrationId: 'engine', newStatus: 'error', timestamp: NOW }),
    ]);
    render(<EventLogViewer />);

    // Filter to supabase — no matches
    const select = screen.getByTestId('integration-filter');
    fireEvent.change(select, { target: { value: 'supabase' } });
    expect(screen.getByTestId('empty-state')).toBeDefined();
  });

  it('exports events as JSON when export button is clicked', () => {
    setMockEvents([
      makeEvent({ id: 'ex1', timestamp: NOW }),
    ]);

    // Render first so React can mount without interference
    const { getByTestId } = render(<EventLogViewer />);

    // Now set up DOM mocks for the export click
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock');
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    const appendedElements: Node[] = [];
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      appendedElements.push(node);
      return node;
    });
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => node);

    fireEvent.click(getByTestId('export-btn'));

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();
    // Verify an anchor was created for download
    const anchor = appendedElements.find(
      (el) => el instanceof HTMLElement && el.tagName === 'A',
    ) as HTMLAnchorElement | undefined;
    expect(anchor).toBeDefined();
    expect(anchor!.download).toMatch(/^aios-events-.*\.json$/);

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();

    // Suppress unused variable warning
    void originalAppendChild;
  });

  it('shows Load More button for paginated results', () => {
    // Create 30 events to trigger pagination (PAGE_SIZE = 25)
    const events = Array.from({ length: 30 }, (_, i) =>
      makeEvent({ id: `pg${i}`, timestamp: NOW - i * 1000 }),
    );
    setMockEvents(events);
    render(<EventLogViewer />);

    expect(screen.getAllByTestId('event-row')).toHaveLength(25);
    expect(screen.getByTestId('load-more-btn')).toBeDefined();

    fireEvent.click(screen.getByTestId('load-more-btn'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(30);
  });

  it('filters by time range', () => {
    // We use real timestamps relative to NOW. The component uses Date.now()
    // internally, so we mock it.
    const realDateNow = Date.now;
    Date.now = () => NOW;

    // Timestamps relative to NOW:
    // tr1: 1s ago      -> within 1h, 6h, 24h, 7d
    // tr2: ~50min ago  -> within 1h, 6h, 24h, 7d
    // tr3: 2h ago      -> outside 1h, within 6h, 24h, 7d
    // tr4: 25h ago     -> outside 1h, 6h, 24h, within 7d
    // tr5: ~8.1d ago   -> outside 7d
    setMockEvents([
      makeEvent({ id: 'tr1', timestamp: NOW - 1000 }),
      makeEvent({ id: 'tr2', timestamp: NOW - 3_000_000 }),
      makeEvent({ id: 'tr3', timestamp: NOW - 7_200_000 }),
      makeEvent({ id: 'tr4', timestamp: NOW - 90_000_000 }),
      makeEvent({ id: 'tr5', timestamp: NOW - 700_000_000 }),
    ]);
    render(<EventLogViewer />);

    // All first
    expect(screen.getAllByTestId('event-row')).toHaveLength(5);

    // Click 1h filter (tr1 + tr2 within 3.6M)
    fireEvent.click(screen.getByTestId('time-range-1h'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(2);

    // Click 6h filter (tr1 + tr2 + tr3 within 21.6M)
    fireEvent.click(screen.getByTestId('time-range-6h'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(3);

    // Click 24h filter (tr1 + tr2 + tr3 within 86.4M; tr4 at 90M is outside)
    fireEvent.click(screen.getByTestId('time-range-24h'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(3);

    // Click 7d filter (tr1-tr4 within 604.8M; tr5 at 700M is outside)
    fireEvent.click(screen.getByTestId('time-range-7d'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(4);

    // Back to all
    fireEvent.click(screen.getByTestId('time-range-all'));
    expect(screen.getAllByTestId('event-row')).toHaveLength(5);

    Date.now = realDateNow;
  });
});
