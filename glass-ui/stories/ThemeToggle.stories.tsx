import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ThemeToggle, Theme } from '../src/components/ui/ThemeToggle';
import { GlassCard } from '../src/components/ui/GlassCard';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gradient',
      values: [
        { name: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { name: 'dark', value: '#0f0f0f' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    showDropdown: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const WithDropdown: Story = {
  args: {
    showDropdown: true,
  },
};

export const Controlled: Story = {
  render: () => {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle
          theme={theme}
          onThemeChange={setTheme}
          showDropdown
        />
        <p className="text-sm text-muted-foreground">
          Current: <span className="font-medium capitalize">{theme}</span>
        </p>
      </div>
    );
  },
};

export const InHeader: Story = {
  render: () => (
    <GlassCard padding="sm" className="w-80">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Settings</h3>
        <ThemeToggle showDropdown size="sm" />
      </div>
    </GlassCard>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <ThemeToggle size="sm" />
        <p className="text-xs text-muted-foreground mt-2">Small</p>
      </div>
      <div className="text-center">
        <ThemeToggle size="md" />
        <p className="text-xs text-muted-foreground mt-2">Medium</p>
      </div>
    </div>
  ),
};
