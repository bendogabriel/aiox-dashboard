import { describe, it, expect } from 'vitest';
import { iconMap, getIconComponent, EMOTE_LIST, iconSizes, ICON_SIZES, ThemeIcons } from '@/lib/icons';
import { FolderOpen } from 'lucide-react';

// ── iconMap ──

describe('iconMap', () => {
  it('has entries for core navigation icons', () => {
    expect(iconMap).toHaveProperty('dashboard');
    expect(iconMap).toHaveProperty('terminal');
    expect(iconMap).toHaveProperty('settings');
    expect(iconMap).toHaveProperty('menu');
  });

  it('has entries for status icons', () => {
    expect(iconMap).toHaveProperty('check');
    expect(iconMap).toHaveProperty('clock');
    expect(iconMap).toHaveProperty('loader');
    expect(iconMap).toHaveProperty('alert-circle');
  });

  it('has entries for agent icons', () => {
    expect(iconMap).toHaveProperty('bot');
    expect(iconMap).toHaveProperty('user');
    expect(iconMap).toHaveProperty('code');
    expect(iconMap).toHaveProperty('wrench');
  });

  it('has entries for git icons', () => {
    expect(iconMap).toHaveProperty('git-branch');
    expect(iconMap).toHaveProperty('git-pull-request');
    expect(iconMap).toHaveProperty('git-commit');
  });

  it('every value is a valid React component (function or object)', () => {
    for (const [key, component] of Object.entries(iconMap)) {
      // lucide-react uses React.forwardRef which produces objects in jsdom
      expect(['function', 'object']).toContain(typeof component);
      expect(component).toBeTruthy();
    }
  });
});

// ── getIconComponent ──

describe('getIconComponent', () => {
  it('returns the mapped component for a known icon name', () => {
    const icon = getIconComponent('dashboard');
    expect(icon).toBe(iconMap.dashboard);
  });

  it('returns the correct component for hyphenated names', () => {
    expect(getIconComponent('chevron-down')).toBe(iconMap['chevron-down']);
    expect(getIconComponent('git-branch')).toBe(iconMap['git-branch']);
  });

  it('returns FolderOpen fallback for unknown names', () => {
    expect(getIconComponent('nonexistent-icon')).toBe(FolderOpen);
  });

  it('returns FolderOpen fallback for empty string', () => {
    expect(getIconComponent('')).toBe(FolderOpen);
  });

  it('returns FolderOpen fallback for emoji strings', () => {
    expect(getIconComponent('🚀')).toBe(FolderOpen);
    expect(getIconComponent('🤖')).toBe(FolderOpen);
  });

  it('returns a valid component for every iconMap key', () => {
    for (const key of Object.keys(iconMap)) {
      const component = getIconComponent(key);
      expect(['function', 'object']).toContain(typeof component);
      expect(component).toBeTruthy();
    }
  });
});

// ── EMOTE_LIST ──

describe('EMOTE_LIST', () => {
  it('contains expected emote entries', () => {
    const keys = EMOTE_LIST.map((e) => e.key);
    expect(keys).toContain('heart');
    expect(keys).toContain('thumbsUp');
    expect(keys).toContain('star');
    expect(keys).toContain('flame');
  });

  it('every entry has key, label, and Icon', () => {
    for (const emote of EMOTE_LIST) {
      expect(typeof emote.key).toBe('string');
      expect(typeof emote.label).toBe('string');
      expect(['function', 'object']).toContain(typeof emote.Icon);
      expect(emote.Icon).toBeTruthy();
    }
  });
});

// ── iconSizes & ICON_SIZES ──

describe('iconSizes', () => {
  it('has all expected size keys', () => {
    expect(iconSizes).toHaveProperty('xs');
    expect(iconSizes).toHaveProperty('sm');
    expect(iconSizes).toHaveProperty('md');
    expect(iconSizes).toHaveProperty('lg');
    expect(iconSizes).toHaveProperty('xl');
  });

  it('values are Tailwind class strings', () => {
    for (const value of Object.values(iconSizes)) {
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^h-/);
    }
  });
});

describe('ICON_SIZES', () => {
  it('has numeric values for each size key', () => {
    expect(ICON_SIZES.xs).toBe(12);
    expect(ICON_SIZES.sm).toBe(14);
    expect(ICON_SIZES.md).toBe(16);
    expect(ICON_SIZES.lg).toBe(20);
    expect(ICON_SIZES.xl).toBe(24);
  });
});

// ── ThemeIcons ──

describe('ThemeIcons', () => {
  it('maps known theme IDs to components', () => {
    expect(ThemeIcons).toHaveProperty('light');
    expect(ThemeIcons).toHaveProperty('dark');
    expect(ThemeIcons).toHaveProperty('matrix');
    expect(ThemeIcons.light).toBeTruthy();
    expect(ThemeIcons.dark).toBeTruthy();
  });
});
