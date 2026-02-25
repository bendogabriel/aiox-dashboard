import type { Config } from "tailwindcss"

/**
 * Tailwind CSS v4 Configuration
 *
 * Note: In Tailwind v4, most configuration is done via CSS using @theme directive.
 * See src/styles/globals.css for design tokens and theme customization.
 *
 * This file exists for:
 * - IDE support and autocomplete
 * - Compatibility with tools expecting tailwind.config
 * - Documentation of the design system structure
 */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./stories/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // Glass Design System tokens are defined in src/styles/globals.css
      // using Tailwind v4's @theme directive for better CSS-first approach.
      //
      // Key tokens available:
      // - Blur: --glass-blur-{subtle,default,strong,maximum}
      // - Backgrounds: --glass-bg, --glass-bg-hover, --glass-bg-{panel,card,input,button}
      // - Borders: --glass-border-color, --glass-border-subtle
      // - Shadows: --glass-shadow, --glass-shadow-large, --glass-shadow-hover
      // - Easing: --ease-glass, --ease-spring
      // - Durations: --duration-{fast,base,slow,slower}
    },
  },
  plugins: [],
} satisfies Config
