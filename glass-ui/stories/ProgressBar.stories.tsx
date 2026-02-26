import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from '../src/components/ui/ProgressBar';
import { GlassCard } from '../src/components/ui/GlassCard';

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
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
      options: ['default', 'success', 'warning', 'error', 'gradient'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    value: {
      control: { type: 'range', min: 0, max: 100 },
    },
    showLabel: {
      control: 'boolean',
    },
    animate: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    className: 'w-64',
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
    label: 'Progress',
    className: 'w-64',
  },
};

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
    label: 'Complete',
    className: 'w-64',
  },
};

export const Warning: Story = {
  args: {
    value: 80,
    variant: 'warning',
    showLabel: true,
    label: 'Storage',
    className: 'w-64',
  },
};

export const Error: Story = {
  args: {
    value: 95,
    variant: 'error',
    showLabel: true,
    label: 'Memory Usage',
    className: 'w-64',
  },
};

export const Gradient: Story = {
  args: {
    value: 50,
    variant: 'gradient',
    showLabel: true,
    className: 'w-64',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <ProgressBar value={60} size="sm" label="Small" showLabel />
      <ProgressBar value={60} size="md" label="Medium" showLabel />
      <ProgressBar value={60} size="lg" label="Large" showLabel />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <ProgressBar value={40} variant="default" label="Default" showLabel />
      <ProgressBar value={60} variant="success" label="Success" showLabel />
      <ProgressBar value={75} variant="warning" label="Warning" showLabel />
      <ProgressBar value={90} variant="error" label="Error" showLabel />
      <ProgressBar value={50} variant="gradient" label="Gradient" showLabel />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <GlassCard className="w-80">
      <h3 className="font-semibold mb-4">Upload Progress</h3>
      <ProgressBar
        value={67}
        variant="gradient"
        showLabel
        label="Uploading files..."
      />
      <p className="text-xs text-muted-foreground mt-2">
        23 of 34 files uploaded
      </p>
    </GlassCard>
  ),
};
