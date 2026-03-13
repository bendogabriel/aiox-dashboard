/**
 * Tier system — Dynamic plan switching with master override.
 *
 * Tiers: free < pro < enterprise
 * Master mode: unlocks ALL features + tier switcher in settings.
 *
 * Priority: localStorage override > VITE_TIER env > 'pro' default.
 */

export type Tier = 'free' | 'pro' | 'enterprise';

const STORAGE_KEY = 'aios:tier-override';
const MASTER_KEY = 'aios:master-mode';

// ── Feature lists per tier ──────────────────────────────────

const FREE_FEATURES = [
  'chat', 'dashboard', 'agents', 'settings', 'context',
  'global-search', 'notifications', 'theme-toggle',
] as const;

const PRO_FEATURES = [
  ...FREE_FEATURES,
  'bob', 'terminals', 'monitor', 'squads', 'world', 'engine',
  'stories', 'roadmap', 'knowledge', 'brainstorm', 'integrations',
  'vault', 'github', 'marketplace',
  'marketing-hub', 'sales-dashboard', 'traffic-dashboard', 'creative-gallery',
] as const;

const ENTERPRISE_FEATURES = [
  ...PRO_FEATURES,
  'sales-room', 'overnight', 'advanced-analytics',
  'custom-agents', 'white-label', 'sso', 'audit-log',
] as const;

const TIER_FEATURES: Record<Tier, readonly string[]> = {
  free: FREE_FEATURES,
  pro: PRO_FEATURES,
  enterprise: ENTERPRISE_FEATURES,
};

// ── Listeners ───────────────────────────────────────────────

type TierListener = (tier: Tier) => void;
const _listeners = new Set<TierListener>();

export function onTierChange(fn: TierListener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notify(tier: Tier) {
  for (const fn of _listeners) fn(tier);
}

// ── Core API ────────────────────────────────────────────────

export function getTier(): Tier {
  // Master mode always returns enterprise-level access
  if (isMaster()) return getOverrideTier() ?? 'enterprise';
  // Check localStorage override
  const override = getOverrideTier();
  if (override) return override;
  // Env var fallback
  const env = import.meta.env.VITE_TIER;
  if (env === 'enterprise') return 'enterprise';
  if (env === 'free') return 'free';
  return 'pro';
}

export function getTierLabel(): string {
  const labels: Record<Tier, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
  return labels[getTier()];
}

export function hasFeature(feature: string): boolean {
  if (isMaster()) return true; // master unlocks everything
  return TIER_FEATURES[getTier()].includes(feature);
}

export function isEnterprise(): boolean {
  return getTier() === 'enterprise';
}

export function isPro(): boolean {
  return getTier() === 'pro' || getTier() === 'enterprise';
}

// ── Tier override (runtime switching) ───────────────────────

function getOverrideTier(): Tier | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'free' || val === 'pro' || val === 'enterprise') return val;
  } catch { /* SSR-safe */ }
  return null;
}

export function setTierOverride(tier: Tier): void {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch { /* ignore */ }
  _notify(tier);
}

export function clearTierOverride(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  _notify(getTier());
}

// ── Master mode ─────────────────────────────────────────────

export function isMaster(): boolean {
  try {
    return localStorage.getItem(MASTER_KEY) === 'true';
  } catch { return false; }
}

export function setMasterMode(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(MASTER_KEY, 'true');
    } else {
      localStorage.removeItem(MASTER_KEY);
    }
  } catch { /* ignore */ }
  _notify(getTier());
}

// ── Utilities ───────────────────────────────────────────────

export function getAllTiers(): Tier[] {
  return ['free', 'pro', 'enterprise'];
}

export function getTierFeatures(tier: Tier): readonly string[] {
  return TIER_FEATURES[tier];
}

export function getExclusiveFeatures(tier: Tier): string[] {
  const lower = tier === 'enterprise' ? 'pro' : tier === 'pro' ? 'free' : null;
  if (!lower) return [...TIER_FEATURES[tier]];
  const lowerSet = new Set(TIER_FEATURES[lower]);
  return TIER_FEATURES[tier].filter(f => !lowerSet.has(f));
}
