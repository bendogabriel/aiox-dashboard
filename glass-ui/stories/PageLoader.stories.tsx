import type { Meta, StoryObj } from '@storybook/react';
import { PageLoader, InlineLoader } from '../src/components/ui/PageLoader';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GlassButton } from '../src/components/ui/GlassButton';

const meta: Meta<typeof PageLoader> = {
  title: 'UI/PageLoader',
  component: PageLoader,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'h-64',
  },
};

export const CustomMessage: Story = {
  args: {
    message: 'Fetching data...',
    className: 'h-64',
  },
};

export const InCard: Story = {
  render: () => (
    <GlassCard className="w-80 h-64">
      <PageLoader message="Loading content..." />
    </GlassCard>
  ),
};

export const InlineLoaderSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <InlineLoader size="sm" />
        <span className="text-xs text-muted-foreground">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InlineLoader size="md" />
        <span className="text-xs text-muted-foreground">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InlineLoader size="lg" />
        <span className="text-xs text-muted-foreground">Large</span>
      </div>
    </div>
  ),
};

export const InlineInButton: Story = {
  render: () => (
    <div className="flex gap-4">
      <GlassButton disabled>
        <InlineLoader size="sm" />
        <span className="ml-2">Loading...</span>
      </GlassButton>
      <GlassButton variant="primary" disabled>
        <InlineLoader size="sm" />
        <span className="ml-2">Saving...</span>
      </GlassButton>
    </div>
  ),
};

export const InlineInText: Story = {
  render: () => (
    <GlassCard className="w-80">
      <div className="flex items-center gap-2">
        <InlineLoader size="sm" />
        <span className="text-sm text-muted-foreground">Syncing changes...</span>
      </div>
    </GlassCard>
  ),
};
