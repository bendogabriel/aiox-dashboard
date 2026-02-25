import type { Preview } from '@storybook/react-vite';
import '../src/index.css';
import '../src/styles/liquid-glass.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          name: 'dark',
          value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'gray',
          value: '#f5f5f7',
        },
      ],
    },
    a11y: {
      test: 'todo',
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return (
        <div className={`p-6 min-h-[200px] ${theme === 'dark' ? 'dark' : ''}`}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
