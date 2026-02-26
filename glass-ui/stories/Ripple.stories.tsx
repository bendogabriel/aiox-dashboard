import type { Meta, StoryObj } from '@storybook/react';
import { RippleWrapper, useRipple } from '../src/components/ui/Ripple';
import { GlassCard } from '../src/components/ui/GlassCard';

const meta: Meta<typeof RippleWrapper> = {
  title: 'UI/Ripple',
  component: RippleWrapper,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <button className="px-6 py-3 rounded-xl glass glass-border font-medium">
        Click me
      </button>
    ),
  },
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <RippleWrapper color="rgba(255, 255, 255, 0.3)">
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium">
          White Ripple
        </button>
      </RippleWrapper>
      <RippleWrapper color="rgba(59, 130, 246, 0.3)">
        <button className="px-6 py-3 rounded-xl glass glass-border font-medium">
          Blue Ripple
        </button>
      </RippleWrapper>
      <RippleWrapper color="rgba(239, 68, 68, 0.3)">
        <button className="px-6 py-3 rounded-xl glass glass-border font-medium">
          Red Ripple
        </button>
      </RippleWrapper>
    </div>
  ),
};

export const OnCard: Story = {
  render: () => (
    <RippleWrapper color="rgba(255, 255, 255, 0.1)" className="rounded-2xl">
      <GlassCard interactive className="cursor-pointer">
        <h3 className="font-semibold mb-2">Interactive Card</h3>
        <p className="text-sm text-muted-foreground">
          Click anywhere on this card to see the ripple effect.
        </p>
      </GlassCard>
    </RippleWrapper>
  ),
};

export const CustomDuration: Story = {
  render: () => (
    <div className="flex gap-4">
      <RippleWrapper duration={300}>
        <button className="px-6 py-3 rounded-xl glass glass-border font-medium">
          Fast (300ms)
        </button>
      </RippleWrapper>
      <RippleWrapper duration={600}>
        <button className="px-6 py-3 rounded-xl glass glass-border font-medium">
          Normal (600ms)
        </button>
      </RippleWrapper>
      <RippleWrapper duration={1000}>
        <button className="px-6 py-3 rounded-xl glass glass-border font-medium">
          Slow (1000ms)
        </button>
      </RippleWrapper>
    </div>
  ),
};

export const WithHook: Story = {
  render: () => {
    const { createRipple, RippleContainer } = useRipple({ color: 'rgba(59, 130, 246, 0.4)' });

    return (
      <button
        className="relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
        onMouseDown={createRipple}
      >
        Custom Hook Usage
        <RippleContainer />
      </button>
    );
  },
};

export const ListItems: Story = {
  render: () => (
    <GlassCard padding="sm" className="w-64">
      {['Dashboard', 'Settings', 'Profile', 'Logout'].map((item) => (
        <RippleWrapper key={item} color="rgba(255, 255, 255, 0.1)" className="rounded-lg">
          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
            {item}
          </button>
        </RippleWrapper>
      ))}
    </GlassCard>
  ),
};
