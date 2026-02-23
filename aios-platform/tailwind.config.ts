import type { Config } from 'tailwindcss'

// Import design tokens preset
import tokensPreset from '../.aios-core/design-system/tokens/dist/tailwind/preset.js'

export default {
  // Extend from tokens preset
  presets: [tokensPreset],

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: 'class',

  theme: {
    extend: {
      // Project-specific overrides (if needed)
      // These will merge with the tokens preset
    },
  },

  plugins: [],
} satisfies Config
