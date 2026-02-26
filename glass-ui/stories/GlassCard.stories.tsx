import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from '../src/components/ui/GlassCard';

const meta: Meta<typeof GlassCard> = {
  title: 'UI/GlassCard',
  component: GlassCard,
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
      options: ['default', 'subtle', 'strong'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    radius: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    interactive: {
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
    children: (
      <div className="w-64">
        <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
        <p className="text-sm text-muted-foreground">
          A beautiful glassmorphism card with backdrop blur and subtle borders.
        </p>
      </div>
    ),
  },
};

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    children: (
      <div className="w-64">
        <h3 className="text-lg font-semibold mb-2">Subtle Variant</h3>
        <p className="text-sm text-muted-foreground">
          A more subtle glass effect with less blur.
        </p>
      </div>
    ),
  },
};

export const Strong: Story = {
  args: {
    variant: 'strong',
    children: (
      <div className="w-64">
        <h3 className="text-lg font-semibold mb-2">Strong Variant</h3>
        <p className="text-sm text-muted-foreground">
          Maximum blur for a more pronounced glass effect.
        </p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <div className="w-64">
        <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
        <p className="text-sm text-muted-foreground">
          Hover over this card to see the shadow effect.
        </p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <img
        src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=200&fit=crop"
        alt="Gradient"
        className="w-64 h-40 object-cover rounded-3xl"
      />
    ),
  },
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {['default', 'subtle', 'strong'].map((variant) => (
        <GlassCard key={variant} variant={variant as any} className="w-48">
          <h4 className="font-medium capitalize">{variant}</h4>
          <p className="text-xs text-muted-foreground mt-1">Glass variant</p>
        </GlassCard>
      ))}
    </div>
  ),
};
