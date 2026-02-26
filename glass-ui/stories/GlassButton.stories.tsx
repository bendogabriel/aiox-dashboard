import type { Meta, StoryObj } from '@storybook/react';
import { GlassButton } from '../src/components/ui/GlassButton';
import { Mail, Send, Settings, Trash2, Plus } from 'lucide-react';

const meta: Meta<typeof GlassButton> = {
  title: 'UI/GlassButton',
  component: GlassButton,
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
    variant: {
      control: 'select',
      options: ['default', 'primary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Glass Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
    leftIcon: <Trash2 size={16} />,
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: 'Send Email',
    leftIcon: <Mail size={16} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <Send size={16} />,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Saving...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <Settings size={20} />,
    'aria-label': 'Settings',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <GlassButton size="sm">Small</GlassButton>
      <GlassButton size="md">Medium</GlassButton>
      <GlassButton size="lg">Large</GlassButton>
      <GlassButton size="icon" aria-label="Add">
        <Plus size={20} />
      </GlassButton>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <GlassButton variant="default">Default</GlassButton>
        <GlassButton variant="primary">Primary</GlassButton>
        <GlassButton variant="ghost">Ghost</GlassButton>
        <GlassButton variant="danger">Danger</GlassButton>
      </div>
      <div className="flex items-center gap-4">
        <GlassButton variant="default" disabled>Default</GlassButton>
        <GlassButton variant="primary" disabled>Primary</GlassButton>
        <GlassButton variant="ghost" disabled>Ghost</GlassButton>
        <GlassButton variant="danger" disabled>Danger</GlassButton>
      </div>
    </div>
  ),
};
