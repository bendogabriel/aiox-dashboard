import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SuccessFeedback, useSuccessFeedback } from '../src/components/ui/SuccessFeedback';
import { GlassButton } from '../src/components/ui/GlassButton';
import { GlassCard } from '../src/components/ui/GlassCard';

const meta: Meta<typeof SuccessFeedback> = {
  title: 'UI/SuccessFeedback',
  component: SuccessFeedback,
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
      options: ['checkmark', 'confetti', 'minimal'],
    },
    show: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Checkmark: Story = {
  args: {
    show: true,
    variant: 'checkmark',
    message: 'Changes saved!',
  },
};

export const Confetti: Story = {
  args: {
    show: true,
    variant: 'confetti',
    message: 'Achievement unlocked!',
  },
};

export const Minimal: Story = {
  args: {
    show: true,
    variant: 'minimal',
    message: 'Done!',
  },
};

export const Interactive: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    const [variant, setVariant] = useState<'checkmark' | 'confetti' | 'minimal'>('checkmark');

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <GlassButton
            onClick={() => { setVariant('checkmark'); setShow(true); setTimeout(() => setShow(false), 2000); }}
          >
            Checkmark
          </GlassButton>
          <GlassButton
            onClick={() => { setVariant('confetti'); setShow(true); setTimeout(() => setShow(false), 2000); }}
          >
            Confetti
          </GlassButton>
          <GlassButton
            onClick={() => { setVariant('minimal'); setShow(true); setTimeout(() => setShow(false), 2000); }}
          >
            Minimal
          </GlassButton>
        </div>
        <SuccessFeedback show={show} variant={variant} message="Action completed!" />
      </div>
    );
  },
};

export const WithHook: Story = {
  render: () => {
    const { trigger, SuccessFeedbackComponent } = useSuccessFeedback(2000);

    return (
      <GlassCard className="w-80">
        <h3 className="font-semibold mb-4">Form Example</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            className="w-full glass glass-border rounded-xl px-4 py-2"
          />
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={() => trigger('Form submitted!')}
          >
            Submit
          </GlassButton>
        </div>
        <SuccessFeedbackComponent />
      </GlassCard>
    );
  },
};
