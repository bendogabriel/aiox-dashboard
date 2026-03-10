import { describe, it, expect } from 'vitest';
import {
  DOMAIN_TAXONOMY,
  DOMAIN_ORDER,
  resolveSquadDomain,
  getDomainColor,
  getDomainBg,
  getDomainBorder,
  getDomainLabel,
} from '@/lib/domain-taxonomy';

describe('DOMAIN_TAXONOMY', () => {
  it('has exactly 6 domains', () => {
    expect(Object.keys(DOMAIN_TAXONOMY)).toHaveLength(6);
  });

  it('each domain has label, color, bg, border', () => {
    for (const [key, value] of Object.entries(DOMAIN_TAXONOMY)) {
      expect(value).toHaveProperty('label');
      expect(value).toHaveProperty('color');
      expect(value).toHaveProperty('bg');
      expect(value).toHaveProperty('border');
      expect(typeof value.label).toBe('string');
    }
  });
});

describe('DOMAIN_ORDER', () => {
  it('contains all domain keys', () => {
    const keys = Object.keys(DOMAIN_TAXONOMY);
    expect(DOMAIN_ORDER).toHaveLength(keys.length);
    for (const key of keys) {
      expect(DOMAIN_ORDER).toContain(key);
    }
  });
});

describe('resolveSquadDomain', () => {
  // Priority 1: Squad overrides
  it('returns override for known squad names', () => {
    expect(resolveSquadDomain('c-level', 'anything')).toBe('strategy');
    expect(resolveSquadDomain('data', 'anything')).toBe('technical');
    expect(resolveSquadDomain('spy', 'anything')).toBe('marketing');
    expect(resolveSquadDomain('design', 'anything')).toBe('brand');
    expect(resolveSquadDomain('deep-research', 'anything')).toBe('technical');
  });

  // Priority 2: Legacy domain mapping
  it('resolves legacy domain names', () => {
    expect(resolveSquadDomain('unknown', 'business_strategy')).toBe('strategy');
    expect(resolveSquadDomain('unknown', 'business_ops')).toBe('operations');
    expect(resolveSquadDomain('unknown', 'content_marketing')).toBe('marketing');
    expect(resolveSquadDomain('unknown', 'meta_frameworks')).toBe('meta');
    expect(resolveSquadDomain('unknown', 'design-system')).toBe('brand');
  });

  // Priority 3: Direct domain match
  it('resolves direct domain keys', () => {
    expect(resolveSquadDomain('unknown', 'strategy')).toBe('strategy');
    expect(resolveSquadDomain('unknown', 'marketing')).toBe('marketing');
    expect(resolveSquadDomain('unknown', 'technical')).toBe('technical');
    expect(resolveSquadDomain('unknown', 'operations')).toBe('operations');
    expect(resolveSquadDomain('unknown', 'brand')).toBe('brand');
    expect(resolveSquadDomain('unknown', 'meta')).toBe('meta');
  });

  // Fallback
  it('falls back to meta for unknown values', () => {
    expect(resolveSquadDomain('unknown', 'random')).toBe('meta');
    expect(resolveSquadDomain('', '')).toBe('meta');
  });

  // Override wins over legacy
  it('squad override takes priority over legacy mapping', () => {
    // 'design' squad override → 'brand', even if rawDomain is a valid legacy key
    expect(resolveSquadDomain('design', 'business_strategy')).toBe('brand');
  });
});

describe('getDomainColor', () => {
  it('returns color for valid domain', () => {
    expect(getDomainColor('strategy')).toBe('var(--agent-pm)');
  });

  it('returns fallback for invalid domain', () => {
    expect(getDomainColor('nonexistent')).toBe('var(--text-muted)');
  });
});

describe('getDomainBg', () => {
  it('returns bg for valid domain', () => {
    expect(getDomainBg('technical')).toBe('var(--agent-dev-bg)');
  });

  it('returns transparent for invalid domain', () => {
    expect(getDomainBg('nonexistent')).toBe('transparent');
  });
});

describe('getDomainBorder', () => {
  it('returns border for valid domain', () => {
    expect(getDomainBorder('meta')).toBe('var(--agent-architect-border)');
  });

  it('returns fallback for invalid domain', () => {
    expect(getDomainBorder('nonexistent')).toBe('var(--border)');
  });
});

describe('getDomainLabel', () => {
  it('returns label for valid domain', () => {
    expect(getDomainLabel('strategy')).toBe('Strategy');
    expect(getDomainLabel('marketing')).toBe('Marketing & Content');
  });

  it('formats unknown domain as label', () => {
    expect(getDomainLabel('business-ops')).toBe('business ops');
    expect(getDomainLabel('some_thing')).toBe('some thing');
  });

  it('returns empty string for empty input', () => {
    expect(getDomainLabel('')).toBe('');
  });
});
