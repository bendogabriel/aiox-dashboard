import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { MarketplaceOrder } from '../../types/marketplace';

// ── Mocks ───────────────────────────────────────────────────────────────

const mockUseMyPurchases = vi.fn();

vi.mock('../useMarketplaceListing', () => ({
  useMyPurchases: (...args: unknown[]) => mockUseMyPurchases(...args),
}));

// We need to import AFTER mocks are set up
import { useMarketplaceAgents, useIsMarketplaceAgent } from '../useMarketplaceAgents';

// ── Test Helpers ────────────────────────────────────────────────────────

function createMockOrder(overrides: Partial<MarketplaceOrder> = {}): MarketplaceOrder {
  return {
    id: 'order-100',
    buyer_id: 'buyer-1',
    listing_id: 'listing-1',
    seller_id: 'seller-1',
    order_type: 'task',
    status: 'active',
    task_description: null,
    task_deliverables: null,
    hours_contracted: null,
    hours_used: 0,
    hourly_rate: null,
    subscription_period: null,
    subscription_start: null,
    subscription_end: null,
    auto_renew: false,
    credits_purchased: null,
    credits_remaining: null,
    subtotal: 1500,
    platform_fee: 225,
    seller_payout: 1275,
    currency: 'BRL',
    escrow_status: 'held',
    escrow_release_at: null,
    stripe_payment_id: null,
    stripe_subscription_id: null,
    agent_instance_id: null,
    agent_config_snapshot: {
      persona: { role: 'Test Agent' },
      capabilities: ['typescript'],
      commands: [{ command: '/run', action: 'execute', description: 'Run' }],
    },
    created_at: '2026-03-01T10:00:00Z',
    started_at: null,
    completed_at: null,
    updated_at: '2026-03-01T10:00:00Z',
    listing: {
      id: 'listing-1',
      seller_id: 'seller-1',
      slug: 'test-agent',
      name: 'Test Marketplace Agent',
      tagline: 'A test agent',
      description: 'Description',
      category: 'development',
      tags: ['test'],
      icon: 'Bot',
      cover_image_url: null,
      screenshots: [],
      agent_config: {},
      agent_tier: 2,
      squad_type: 'development',
      capabilities: ['test'],
      supported_models: ['claude-sonnet'],
      required_tools: [],
      required_mcps: [],
      pricing_model: 'per_task',
      price_amount: 1500,
      price_currency: 'BRL',
      credits_per_use: null,
      sla_response_ms: null,
      sla_uptime_pct: null,
      sla_max_tokens: null,
      downloads: 100,
      active_hires: 5,
      rating_avg: 4.5,
      rating_count: 10,
      status: 'approved',
      rejection_reason: null,
      featured: false,
      featured_at: null,
      version: '1.0.0',
      changelog: null,
      published_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    } as never,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('useMarketplaceAgents', () => {
  beforeEach(() => {
    mockUseMyPurchases.mockReset();
  });

  it('returns empty array when no purchases exist', () => {
    mockUseMyPurchases.mockReturnValue({
      data: { data: [], total: 0, offset: 0, limit: 20 },
    });

    const { result } = renderHook(() => useMarketplaceAgents('buyer-1'));
    expect(result.current).toEqual([]);
  });

  it('returns empty array when data is undefined (loading)', () => {
    mockUseMyPurchases.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useMarketplaceAgents('buyer-1'));
    expect(result.current).toEqual([]);
  });

  it('filters out orders without agent_config_snapshot', () => {
    const orderWithSnapshot = createMockOrder({ id: 'order-with', status: 'active' });
    const orderWithoutSnapshot = createMockOrder({
      id: 'order-without',
      status: 'active',
      agent_config_snapshot: null,
    });

    mockUseMyPurchases.mockReturnValue({
      data: { data: [orderWithSnapshot, orderWithoutSnapshot], total: 2, offset: 0, limit: 20 },
    });

    const { result } = renderHook(() => useMarketplaceAgents('buyer-1'));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('mkt-order-with');
  });

  it('filters out orders that are not active or in_progress', () => {
    const activeOrder = createMockOrder({ id: 'order-active', status: 'active' });
    const inProgressOrder = createMockOrder({ id: 'order-ip', status: 'in_progress' });
    const completedOrder = createMockOrder({ id: 'order-done', status: 'completed' });
    const cancelledOrder = createMockOrder({ id: 'order-cancelled', status: 'cancelled' });
    const pendingOrder = createMockOrder({ id: 'order-pending', status: 'pending' });

    mockUseMyPurchases.mockReturnValue({
      data: {
        data: [activeOrder, inProgressOrder, completedOrder, cancelledOrder, pendingOrder],
        total: 5,
        offset: 0,
        limit: 20,
      },
    });

    const { result } = renderHook(() => useMarketplaceAgents('buyer-1'));
    expect(result.current).toHaveLength(2);
    expect(result.current.map((a) => a.id)).toEqual(['mkt-order-active', 'mkt-order-ip']);
  });

  it('maps orders to Agent type with mkt- prefix on ID', () => {
    const order = createMockOrder({ id: 'order-abc123' });

    mockUseMyPurchases.mockReturnValue({
      data: { data: [order], total: 1, offset: 0, limit: 20 },
    });

    const { result } = renderHook(() => useMarketplaceAgents('buyer-1'));
    const agent = result.current[0];

    expect(agent.id).toBe('mkt-order-abc123');
    expect(agent.name).toBe('Test Marketplace Agent');
    expect(agent.status).toBe('online');
    expect(agent.capabilities).toEqual(['typescript']);
    expect(agent.commandCount).toBe(1);
  });

  it('sets agent status to online for active orders', () => {
    const order = createMockOrder({ status: 'active' });

    mockUseMyPurchases.mockReturnValue({
      data: { data: [order], total: 1, offset: 0, limit: 20 },
    });

    const { result } = renderHook(() => useMarketplaceAgents('buyer-1'));
    expect(result.current[0].status).toBe('online');
  });

  it('passes buyerId and status filter to useMyPurchases', () => {
    mockUseMyPurchases.mockReturnValue({ data: { data: [] } });

    renderHook(() => useMarketplaceAgents('buyer-xyz'));

    expect(mockUseMyPurchases).toHaveBeenCalledWith('buyer-xyz', { status: 'active' });
  });
});

describe('useIsMarketplaceAgent', () => {
  it('returns true for agent IDs with mkt- prefix', () => {
    const { result } = renderHook(() => useIsMarketplaceAgent('mkt-order-123'));
    expect(result.current).toBe(true);
  });

  it('returns false for non-marketplace agent IDs', () => {
    const { result } = renderHook(() => useIsMarketplaceAgent('core-agent-1'));
    expect(result.current).toBe(false);
  });

  it('returns false for null agentId', () => {
    const { result } = renderHook(() => useIsMarketplaceAgent(null));
    expect(result.current).toBe(false);
  });

  it('returns false for empty string', () => {
    const { result } = renderHook(() => useIsMarketplaceAgent(''));
    expect(result.current).toBe(false);
  });
});
