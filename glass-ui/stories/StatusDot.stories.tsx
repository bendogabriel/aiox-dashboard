import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from '../src/components/ui/StatusDot';

const meta: Meta<typeof StatusDot> = {
  title: 'UI/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f0f' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'working', 'waiting', 'error', 'success', 'offline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    glow: {
      control: 'boolean',
    },
    pulse: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: 'idle',
    label: 'Idle',
  },
};

export const Working: Story = {
  args: {
    status: 'working',
    label: 'Working',
    pulse: true,
    glow: true,
  },
};

export const Waiting: Story = {
  args: {
    status: 'waiting',
    label: 'Waiting',
    pulse: true,
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    label: 'Error',
    glow: true,
  },
};

export const Success: Story = {
  args: {
    status: 'success',
    label: 'Success',
    glow: true,
  },
};

export const Offline: Story = {
  args: {
    status: 'offline',
    label: 'Offline',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StatusDot status="idle" label="Idle" />
      <StatusDot status="working" label="Working" pulse glow />
      <StatusDot status="waiting" label="Waiting" pulse />
      <StatusDot status="success" label="Success" glow />
      <StatusDot status="error" label="Error" glow />
      <StatusDot status="offline" label="Offline" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <StatusDot status="working" size="sm" label="Small" />
      <StatusDot status="working" size="md" label="Medium" />
      <StatusDot status="working" size="lg" label="Large" />
    </div>
  ),
};

export const WithoutLabel: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusDot status="idle" />
      <StatusDot status="working" pulse />
      <StatusDot status="success" glow />
      <StatusDot status="error" glow />
    </div>
  ),
};
