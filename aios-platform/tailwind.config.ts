import type { Config } from 'tailwindcss'

/**
 * Helper: generate alpha variants for a CSS variable color using color-mix().
 * Returns an object with DEFAULT + numeric alpha shades (5, 10, 20, 30, 40).
 */
function withAlpha(cssVar: string, extras?: Record<string, string>) {
  return {
    DEFAULT: cssVar,
    5: `color-mix(in srgb, ${cssVar} 5%, transparent)`,
    10: `color-mix(in srgb, ${cssVar} 10%, transparent)`,
    20: `color-mix(in srgb, ${cssVar} 20%, transparent)`,
    30: `color-mix(in srgb, ${cssVar} 30%, transparent)`,
    40: `color-mix(in srgb, ${cssVar} 40%, transparent)`,
    ...extras,
  }
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
          base: 'var(--color-background-base)',
          hover: 'var(--color-background-hover)',
          active: 'var(--color-background-active)',
          disabled: 'var(--color-background-disabled)',
        },
        foreground: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
          focus: 'var(--color-border-focus)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          subtle: 'var(--color-accent-subtle)',
        },
        status: {
          success: withAlpha('var(--color-status-success)', { muted: 'var(--color-status-success-muted)' }),
          warning: withAlpha('var(--color-status-warning)', { muted: 'var(--color-status-warning-muted)' }),
          error: withAlpha('var(--color-status-error)', { muted: 'var(--color-status-error-muted)' }),
          info: withAlpha('var(--color-status-info)', { muted: 'var(--color-status-info-muted)' }),
        },
        squad: {
          copywriting: withAlpha('var(--squad-copywriting-default)', {
            muted: 'var(--squad-copywriting-muted)',
            end: 'var(--squad-copywriting-end)',
          }),
          design: withAlpha('var(--squad-design-default)', {
            muted: 'var(--squad-design-muted)',
            end: 'var(--squad-design-end)',
          }),
          creator: withAlpha('var(--squad-creator-default)', {
            muted: 'var(--squad-creator-muted)',
            end: 'var(--squad-creator-end)',
          }),
          orchestrator: withAlpha('var(--squad-orchestrator-default)', {
            muted: 'var(--squad-orchestrator-muted)',
            end: 'var(--squad-orchestrator-end)',
          }),
          development: withAlpha('var(--squad-development-default)', {
            muted: 'var(--squad-development-muted)',
            end: 'var(--squad-development-end)',
          }),
          marketing: withAlpha('var(--squad-marketing-default)', {
            muted: 'var(--squad-marketing-muted)',
            end: 'var(--squad-marketing-end)',
          }),
          content: withAlpha('var(--squad-content-default)', {
            muted: 'var(--squad-content-muted)',
            end: 'var(--squad-content-end)',
          }),
          engineering: withAlpha('var(--squad-engineering-default)', {
            muted: 'var(--squad-engineering-muted)',
            end: 'var(--squad-engineering-end)',
          }),
          analytics: withAlpha('var(--squad-analytics-default)', {
            muted: 'var(--squad-analytics-muted)',
            end: 'var(--squad-analytics-end)',
          }),
          advisory: withAlpha('var(--squad-advisory-default)', {
            muted: 'var(--squad-advisory-muted)',
            end: 'var(--squad-advisory-end)',
          }),
          default: withAlpha('var(--squad-default-default)', {
            muted: 'var(--squad-default-muted)',
            end: 'var(--squad-default-end)',
          }),
        },
        tier: {
          0: withAlpha('var(--tier-0-default)', {
            muted: 'var(--tier-0-muted)',
            end: 'var(--tier-0-end)',
          }),
          1: withAlpha('var(--tier-1-default)', {
            muted: 'var(--tier-1-muted)',
            end: 'var(--tier-1-end)',
          }),
          2: withAlpha('var(--tier-2-default)', {
            muted: 'var(--tier-2-muted)',
            end: 'var(--tier-2-end)',
          }),
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        glass: '1.25rem',
        'glass-lg': '1.5rem',
      },
      fontFamily: {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
        slower: 'var(--duration-slower)',
      },
    },
  },

  plugins: [],
} satisfies Config
