import type { Meta, StoryObj } from '@storybook/react';
import { SectionLabel } from '../src/components/ui/SectionLabel';
import { GlassButton } from '../src/components/ui/GlassButton';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Settings, Users, Activity, Plus, ChevronRight } from 'lucide-react';

const meta: Meta<typeof SectionLabel> = {
  title: 'UI/SectionLabel',
  component: SectionLabel,
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
    children: 'Section Title',
    className: 'w-64',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Users size={14} />,
    children: 'Team Members',
    className: 'w-64',
  },
};

export const WithAction: Story = {
  args: {
    icon: <Activity size={14} />,
    children: 'Recent Activity',
    action: (
      <GlassButton size="sm" variant="ghost">
        View All
        <ChevronRight size={14} />
      </GlassButton>
    ),
    className: 'w-80',
  },
};

export const WithAddButton: Story = {
  args: {
    icon: <Settings size={14} />,
    children: 'Configurations',
    action: (
      <GlassButton size="icon" variant="ghost" aria-label="Add configuration">
        <Plus size={16} />
      </GlassButton>
    ),
    className: 'w-80',
  },
};

export const InContext: Story = {
  render: () => (
    <GlassCard className="w-96">
      <SectionLabel icon={<Users size={14} />} children="Team Members" />
      <div className="space-y-2">
        {['Alice', 'Bob', 'Charlie'].map((name) => (
          <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            <span className="text-sm">{name}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  ),
};

export const MultipleSections: Story = {
  render: () => (
    <GlassCard className="w-96 space-y-6">
      <div>
        <SectionLabel icon={<Activity size={14} />} children="Status" />
        <p className="text-sm text-muted-foreground">All systems operational</p>
      </div>

      <div>
        <SectionLabel
          icon={<Users size={14} />}
          children="Collaborators"
          action={<GlassButton size="sm" variant="ghost">Manage</GlassButton>}
        />
        <p className="text-sm text-muted-foreground">5 team members</p>
      </div>

      <div>
        <SectionLabel icon={<Settings size={14} />} children="Settings" />
        <p className="text-sm text-muted-foreground">Configure project preferences</p>
      </div>
    </GlassCard>
  ),
};
