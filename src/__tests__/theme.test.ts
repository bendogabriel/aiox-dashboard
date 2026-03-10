import { describe, it, expect } from 'vitest';
import {
  squadThemes,
  tierThemes,
  statusThemes,
  getSquadTheme,
  getSquadThemeById,
  getTierTheme,
  getStatusTheme,
  getAvatarGradient,
  getBorderLeftColor,
  getCommandTypeTheme,
  commandTypeThemes,
  getSquadInlineStyle,
  type SquadTheme,
  type TierTheme,
  type StatusTheme,
} from '@/lib/theme';
import type { SquadType } from '@/types';

// ---------------------------------------------------------------------------
// All known squad types from src/types/index.ts
// ---------------------------------------------------------------------------
const ALL_SQUAD_TYPES: SquadType[] = [
  'copywriting',
  'design',
  'creator',
  'orchestrator',
  'content',
  'development',
  'engineering',
  'analytics',
  'marketing',
  'advisory',
  'default',
];

// Properties every SquadTheme object must expose
const SQUAD_THEME_KEYS: (keyof SquadTheme)[] = [
  'primary',
  'bg',
  'bgSubtle',
  'bgHover',
  'border',
  'borderSubtle',
  'text',
  'textMuted',
  'gradient',
  'gradientBg',
  'badge',
  'card',
  'cardHover',
  'iconBg',
  'dot',
  'ring',
  'borderLeft',
  'glow',
  'gradientSubtle',
  'cssVar',
];

// Properties every TierTheme object must expose
const TIER_THEME_KEYS: (keyof TierTheme)[] = [
  'label',
  'labelShort',
  'text',
  'bg',
  'badge',
  'gradient',
  'icon',
];

// Properties every StatusTheme object must expose
const STATUS_THEME_KEYS: (keyof StatusTheme)[] = ['text', 'bg', 'dot', 'border'];

// ============================= squadThemes =================================

describe('squadThemes record', () => {
  it('has an entry for every known SquadType', () => {
    for (const type of ALL_SQUAD_TYPES) {
      expect(squadThemes).toHaveProperty(type);
    }
  });

  it('has exactly the expected number of entries', () => {
    expect(Object.keys(squadThemes)).toHaveLength(ALL_SQUAD_TYPES.length);
  });

  it.each(ALL_SQUAD_TYPES)('"%s" theme contains all required properties', (type) => {
    const theme = squadThemes[type];
    for (const key of SQUAD_THEME_KEYS) {
      expect(theme).toHaveProperty(key);
      expect(typeof theme[key]).toBe('string');
    }
  });

  it.each(ALL_SQUAD_TYPES)('"%s" theme references the correct squad name in CSS classes', (type) => {
    const theme = squadThemes[type];
    expect(theme.bg).toContain(`squad-${type}`);
    expect(theme.text).toContain(`squad-${type}`);
    expect(theme.border).toContain(`squad-${type}`);
    expect(theme.dot).toContain(`squad-${type}`);
    expect(theme.cssVar).toContain(`squad-${type}`);
  });
});

// ============================= getSquadTheme ===============================

describe('getSquadTheme', () => {
  it.each(ALL_SQUAD_TYPES)('returns the correct theme for "%s"', (type) => {
    const theme = getSquadTheme(type);
    expect(theme).toBe(squadThemes[type]);
  });

  it('returns the default theme for an unknown squad type', () => {
    const theme = getSquadTheme('nonexistent' as SquadType);
    expect(theme).toBe(squadThemes.default);
  });

  it('returns the default theme when given undefined cast as SquadType', () => {
    const theme = getSquadTheme(undefined as unknown as SquadType);
    expect(theme).toBe(squadThemes.default);
  });

  it('returns the default theme when given an empty string', () => {
    const theme = getSquadTheme('' as SquadType);
    expect(theme).toBe(squadThemes.default);
  });
});

// ============================= getSquadThemeById ===========================

describe('getSquadThemeById', () => {
  it('returns a theme for a known squad id like "copywriting"', () => {
    const theme = getSquadThemeById('copywriting');
    expect(theme).toBe(squadThemes.copywriting);
  });

  it('returns the default theme for an unrecognized squad id', () => {
    const theme = getSquadThemeById('totally-unknown-squad-xyz');
    expect(theme).toBe(squadThemes.default);
  });
});

// ============================= tierThemes ==================================

describe('tierThemes record', () => {
  it('has entries for tiers 0, 1, and 2', () => {
    expect(tierThemes).toHaveProperty('0');
    expect(tierThemes).toHaveProperty('1');
    expect(tierThemes).toHaveProperty('2');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(tierThemes)).toHaveLength(3);
  });

  it.each([0, 1, 2] as const)('tier %i theme contains all required properties', (tier) => {
    const theme = tierThemes[tier];
    for (const key of TIER_THEME_KEYS) {
      expect(theme).toHaveProperty(key);
    }
  });

  it('tier 0 is labelled "Orchestrator"', () => {
    expect(tierThemes[0].label).toBe('Orchestrator');
  });

  it('tier 1 is labelled "Master"', () => {
    expect(tierThemes[1].label).toBe('Master');
  });

  it('tier 2 is labelled "Specialist"', () => {
    expect(tierThemes[2].label).toBe('Specialist');
  });

  it.each([0, 1, 2] as const)('tier %i icon is defined', (tier) => {
    expect(tierThemes[tier].icon).toBeDefined();
    expect(tierThemes[tier].icon).toBeTruthy();
  });
});

// ============================= getTierTheme ================================

describe('getTierTheme', () => {
  it.each([0, 1, 2] as const)('returns the correct theme for tier %i', (tier) => {
    expect(getTierTheme(tier)).toBe(tierThemes[tier]);
  });

  it('falls back to tier 2 for an out-of-range tier (e.g. 5)', () => {
    const theme = getTierTheme(5 as 0 | 1 | 2);
    expect(theme).toBe(tierThemes[2]);
  });

  it('falls back to tier 2 for a negative tier value', () => {
    const theme = getTierTheme(-1 as 0 | 1 | 2);
    expect(theme).toBe(tierThemes[2]);
  });

  it('falls back to tier 2 for a very large tier value', () => {
    const theme = getTierTheme(999 as 0 | 1 | 2);
    expect(theme).toBe(tierThemes[2]);
  });
});

// ============================= statusThemes ================================

describe('statusThemes record', () => {
  const KNOWN_STATUSES = ['online', 'busy', 'offline', 'error', 'success', 'pending', 'running'];

  it.each(KNOWN_STATUSES)('has an entry for "%s"', (status) => {
    expect(statusThemes).toHaveProperty(status);
  });

  it.each(KNOWN_STATUSES)('"%s" theme contains all required properties', (status) => {
    const theme = statusThemes[status];
    for (const key of STATUS_THEME_KEYS) {
      expect(theme).toHaveProperty(key);
      expect(typeof theme[key]).toBe('string');
    }
  });
});

// ============================= getStatusTheme ==============================

describe('getStatusTheme', () => {
  it('returns the correct theme for "online"', () => {
    expect(getStatusTheme('online')).toBe(statusThemes.online);
  });

  it('returns the offline theme for an unknown status', () => {
    expect(getStatusTheme('banana')).toBe(statusThemes.offline);
  });

  it('returns the offline theme for an empty string', () => {
    expect(getStatusTheme('')).toBe(statusThemes.offline);
  });
});

// ============================= getSquadInlineStyle =========================

describe('getSquadInlineStyle', () => {
  it('returns an object with bg, text, border, glow strings', () => {
    const style = getSquadInlineStyle('copywriting');
    expect(typeof style.bg).toBe('string');
    expect(typeof style.text).toBe('string');
    expect(typeof style.border).toBe('string');
    expect(typeof style.glow).toBe('string');
  });

  it('uses color-mix for bg, border, and glow', () => {
    const style = getSquadInlineStyle('orchestrator');
    expect(style.bg).toContain('color-mix');
    expect(style.border).toContain('color-mix');
    expect(style.glow).toContain('color-mix');
  });

  it('references the correct CSS variable for the squad', () => {
    const style = getSquadInlineStyle('copywriting');
    expect(style.bg).toContain('squad-copywriting');
  });
});

// ============================= getAvatarGradient ===========================

describe('getAvatarGradient', () => {
  it('returns a gradient class string containing bg-gradient-to-br', () => {
    const gradient = getAvatarGradient('orchestrator');
    expect(gradient).toContain('bg-gradient-to-br');
  });

  it('references the squad gradient from the theme', () => {
    const gradient = getAvatarGradient('design');
    expect(gradient).toContain(squadThemes.design.gradient);
  });
});

// ============================= getBorderLeftColor ==========================

describe('getBorderLeftColor', () => {
  it('returns a class string with border-l-2', () => {
    const cls = getBorderLeftColor('engineering');
    expect(cls).toContain('border-l-2');
  });

  it('includes the squad border class', () => {
    const cls = getBorderLeftColor('analytics');
    expect(cls).toContain(squadThemes.analytics.border);
  });
});

// ============================= commandTypeThemes / getCommandTypeTheme ======

describe('commandTypeThemes', () => {
  const KNOWN_TYPES = ['action', 'command', 'prompt', 'task', 'workflow'];

  it.each(KNOWN_TYPES)('has an entry for "%s"', (type) => {
    expect(commandTypeThemes).toHaveProperty(type);
  });

  it.each(KNOWN_TYPES)('"%s" entry has bg, border, and text', (type) => {
    const entry = commandTypeThemes[type];
    expect(typeof entry.bg).toBe('string');
    expect(typeof entry.border).toBe('string');
    expect(typeof entry.text).toBe('string');
  });
});

describe('getCommandTypeTheme', () => {
  it('returns the correct theme for "action"', () => {
    expect(getCommandTypeTheme('action')).toBe(commandTypeThemes.action);
  });

  it('falls back to "command" theme for unknown type', () => {
    expect(getCommandTypeTheme('unknown')).toBe(commandTypeThemes.command);
  });

  it('falls back to "command" theme for empty string', () => {
    expect(getCommandTypeTheme('')).toBe(commandTypeThemes.command);
  });
});
