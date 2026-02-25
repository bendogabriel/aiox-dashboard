import type { Preview } from "@storybook/react"
import { withThemeByClassName } from "@storybook/addon-themes"
import "../src/styles/globals.css"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "gradient",
      values: [
        {
          name: "gradient",
          value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        {
          name: "dark-gradient",
          value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        },
        {
          name: "light",
          value: "#f5f5f5",
        },
        {
          name: "dark",
          value: "#0f0f0f",
        },
        {
          name: "image",
          value: "url(https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920)",
        },
      ],
    },
    layout: "centered",
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
}

export default preview
