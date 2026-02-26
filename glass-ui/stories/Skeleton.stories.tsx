import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard } from '../src/components/ui/Skeleton';
import { GlassCard } from '../src/components/ui/GlassCard';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
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
    variant: {
      control: 'select',
      options: ['default', 'circular', 'text'],
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
    className: 'w-48 h-24',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    className: 'w-12 h-12',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    className: 'w-48',
  },
};

export const TextLines: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonText lines={4} />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <SkeletonAvatar size="sm" />
      <SkeletonAvatar size="md" />
      <SkeletonAvatar size="lg" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <SkeletonCard className="w-80" />
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <GlassCard className="w-80">
      <div className="flex items-start gap-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={3} />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </GlassCard>
  ),
};

export const ListItems: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      {[1, 2, 3].map((i) => (
        <GlassCard key={i} padding="sm" className="flex items-center gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </GlassCard>
      ))}
    </div>
  ),
};

export const NoAnimation: Story = {
  args: {
    className: 'w-48 h-24',
    animate: false,
  },
};
