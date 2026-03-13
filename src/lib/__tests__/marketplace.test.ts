import { describe, it, expect } from 'vitest';
import {
  instantiateMarketplaceAgent,
  isMarketplaceAgent,
  getOrderIdFromAgentId,
  getMarketplaceMetadata,
} from '../marketplace';
import type { MarketplaceOrder } from '../../types/marketplace';
import type { Agent } from '../../types/index';

// ── Test Helpers ────────────────────────────────────────────────────────

function createMockOrder(overrides: Partial<MarketplaceOrder> = {}): MarketplaceOrder {
  return {
    id: 'order-789',
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
      persona: { role: 'Marketplace Agent' },
      capabilities: ['typescript', 'react'],
      commands: [
        { command: '/code', action: 'generate', description: 'Generate code' },
        { command: '/test', action: 'run', description: 'Run tests' },
      ],
      voiceDna: {
        sentenceStarters: ['Here is', 'Let me'],
        vocabulary: { alwaysUse: ['clean'], neverUse: ['messy'] },
      },
      antiPatterns: { neverDo: ['skip tests'] },
      integration: { receivesFrom: ['pm'], handoffTo: ['qa'] },
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
      tagline: 'A powerful test agent',
      description: 'Handles testing tasks',
      category: 'development',
      tags: ['test'],
      icon: 'Bot',
      cover_image_url: null,
      screenshots: [],
      agent_config: {},
      agent_tier: 2,
      squad_type: 'development',
      capabilities: ['test', 'lint'],
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

// ── instantiateMarketplaceAgent ─────────────────────────────────────────

describe('instantiateMarketplaceAgent', () => {
  it('creates an Agent with mkt- prefixed ID', () => {
    const order = createMockOrder({ id: 'order-abc' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.id).toBe('mkt-order-abc');
  });

  it('maps listing name to agent name', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.name).toBe('Test Marketplace Agent');
  });

  it('falls back to "Marketplace Agent" when no listing name', () => {
    const order = createMockOrder({ listing: undefined });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.name).toBe('Marketplace Agent');
  });

  it('maps listing tagline to agent title', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.title).toBe('A powerful test agent');
  });

  it('maps listing icon to agent icon', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.icon).toBe('Bot');
  });

  it('maps listing description to agent description', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.description).toBe('Handles testing tasks');
  });

  it('maps listing agent_tier to agent tier', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.tier).toBe(2);
  });

  it('maps listing squad_type to agent squad', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.squad).toBe('development');
    expect(agent.squadType).toBe('development');
  });

  it('maps seller_id to agent squadId', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.squadId).toBe('seller-1');
  });

  it('maps persona from agent_config_snapshot', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.persona).toEqual({ role: 'Marketplace Agent' });
    expect(agent.role).toBe('Marketplace Agent');
  });

  it('maps capabilities from config snapshot (preferred over listing)', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.capabilities).toEqual(['typescript', 'react']);
  });

  it('falls back to listing capabilities when snapshot has none', () => {
    const order = createMockOrder({
      agent_config_snapshot: {
        persona: { role: 'Test' },
      },
    });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.capabilities).toEqual(['test', 'lint']);
  });

  it('maps commands and counts them', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.commands).toHaveLength(2);
    expect(agent.commandCount).toBe(2);
  });

  it('maps voiceDna from config snapshot', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.voiceDna?.sentenceStarters).toEqual(['Here is', 'Let me']);
  });

  it('maps antiPatterns from config snapshot', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.antiPatterns?.neverDo).toEqual(['skip tests']);
  });

  it('maps integration from config snapshot', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.integration?.receivesFrom).toEqual(['pm']);
    expect(agent.integration?.handoffTo).toEqual(['qa']);
  });

  it('sets quality flags based on config presence', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.quality).toEqual({
      hasVoiceDna: true,
      hasAntiPatterns: true,
      hasIntegration: true,
    });
  });

  it('sets quality flags to false when config sections are missing', () => {
    const order = createMockOrder({
      agent_config_snapshot: {
        persona: { role: 'Simple' },
      },
    });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.quality).toEqual({
      hasVoiceDna: false,
      hasAntiPatterns: false,
      hasIntegration: false,
    });
  });

  it('maps active order status to "online" agent status', () => {
    const order = createMockOrder({ status: 'active' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('online');
  });

  it('maps in_progress order status to "online" agent status', () => {
    const order = createMockOrder({ status: 'in_progress' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('online');
  });

  it('maps disputed order status to "busy" agent status', () => {
    const order = createMockOrder({ status: 'disputed' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('busy');
  });

  it('maps completed order status to "offline" agent status', () => {
    const order = createMockOrder({ status: 'completed' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('offline');
  });

  it('maps cancelled order status to "offline" agent status', () => {
    const order = createMockOrder({ status: 'cancelled' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('offline');
  });

  it('maps pending order status to "offline" agent status', () => {
    const order = createMockOrder({ status: 'pending' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('offline');
  });

  it('maps refunded order status to "offline" agent status', () => {
    const order = createMockOrder({ status: 'refunded' });
    const agent = instantiateMarketplaceAgent(order);
    expect(agent.status).toBe('offline');
  });

  it('sets executionCount to 0', () => {
    const agent = instantiateMarketplaceAgent(createMockOrder());
    expect(agent.executionCount).toBe(0);
  });

  it('sets lastActive to a valid ISO string', () => {
    const before = new Date().toISOString();
    const agent = instantiateMarketplaceAgent(createMockOrder());
    const after = new Date().toISOString();

    expect(agent.lastActive).toBeDefined();
    expect(agent.lastActive! >= before).toBe(true);
    expect(agent.lastActive! <= after).toBe(true);
  });

  it('handles null agent_config_snapshot gracefully', () => {
    const order = createMockOrder({ agent_config_snapshot: null });
    const agent = instantiateMarketplaceAgent(order);

    expect(agent.id).toBe('mkt-order-789');
    expect(agent.persona).toBeUndefined();
    expect(agent.commands).toBeUndefined();
    expect(agent.commandCount).toBe(0);
  });
});

// ── isMarketplaceAgent ──────────────────────────────────────────────────

describe('isMarketplaceAgent', () => {
  it('returns true for IDs starting with "mkt-"', () => {
    expect(isMarketplaceAgent('mkt-order-123')).toBe(true);
  });

  it('returns true for minimal "mkt-" prefix', () => {
    expect(isMarketplaceAgent('mkt-x')).toBe(true);
  });

  it('returns false for IDs without "mkt-" prefix', () => {
    expect(isMarketplaceAgent('core-agent-1')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isMarketplaceAgent('')).toBe(false);
  });

  it('returns false for IDs containing "mkt-" but not at start', () => {
    expect(isMarketplaceAgent('some-mkt-agent')).toBe(false);
  });

  it('returns false for just "mkt" without dash', () => {
    expect(isMarketplaceAgent('mkt')).toBe(false);
  });
});

// ── getOrderIdFromAgentId ───────────────────────────────────────────────

describe('getOrderIdFromAgentId', () => {
  it('extracts order ID from marketplace agent ID', () => {
    expect(getOrderIdFromAgentId('mkt-order-123')).toBe('order-123');
  });

  it('extracts UUID-style order IDs', () => {
    expect(getOrderIdFromAgentId('mkt-550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('returns null for non-marketplace agent IDs', () => {
    expect(getOrderIdFromAgentId('core-agent-1')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getOrderIdFromAgentId('')).toBeNull();
  });

  it('handles minimal marketplace ID', () => {
    expect(getOrderIdFromAgentId('mkt-x')).toBe('x');
  });
});

// ── getMarketplaceMetadata ──────────────────────────────────────────────

describe('getMarketplaceMetadata', () => {
  it('returns metadata for a marketplace agent', () => {
    const agent: Agent = {
      id: 'mkt-order-abc',
      name: 'Test',
      tier: 2 as never,
      squad: 'development',
      squadId: 'seller-xyz',
    };

    const metadata = getMarketplaceMetadata(agent);
    expect(metadata).toEqual({
      orderId: 'order-abc',
      listingId: undefined,
      sellerId: 'seller-xyz',
    });
  });

  it('returns null for non-marketplace agents', () => {
    const agent: Agent = {
      id: 'core-agent-1',
      name: 'Core Agent',
      tier: 1 as never,
      squad: 'development',
    };

    expect(getMarketplaceMetadata(agent)).toBeNull();
  });

  it('includes squadId as sellerId when available', () => {
    const agent: Agent = {
      id: 'mkt-order-123',
      name: 'Test',
      tier: 2 as never,
      squad: 'development',
      squadId: 'seller-456',
    };

    const metadata = getMarketplaceMetadata(agent);
    expect(metadata?.sellerId).toBe('seller-456');
  });

  it('sellerId is undefined when agent has no squadId', () => {
    const agent: Agent = {
      id: 'mkt-order-123',
      name: 'Test',
      tier: 2 as never,
      squad: 'development',
    };

    const metadata = getMarketplaceMetadata(agent);
    expect(metadata?.sellerId).toBeUndefined();
  });
});
