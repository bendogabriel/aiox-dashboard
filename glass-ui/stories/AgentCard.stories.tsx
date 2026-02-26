import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AgentCard, Agent } from '../src/components/molecules/AgentCard';
import { Bot, Code, Palette, FileText, Zap } from 'lucide-react';

const meta: Meta<typeof AgentCard> = {
  title: 'Molecules/AgentCard',
  component: AgentCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gradient',
      values: [
        { name: 'gradient', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
        { name: 'dark', value: '#0f0f0f' },
      ],
    },
  },
  argTypes: {
    compact: { control: 'boolean' },
    selected: { control: 'boolean' },
    showTier: { control: 'boolean' },
    favorite: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleAgent: Agent = {
  id: '1',
  name: 'Dex',
  title: 'Full-Stack Developer',
  description: 'Expert in React, TypeScript, and Node.js. Handles all implementation tasks.',
  icon: <Code size={24} className="text-white" />,
  squad: 'Product & Dev',
  tier: 0,
  commandCount: 15,
  status: 'working',
};

export const Default: Story = {
  args: {
    agent: sampleAgent,
    className: 'w-80',
  },
};

export const Compact: Story = {
  args: {
    agent: sampleAgent,
    compact: true,
    className: 'w-72',
  },
};

export const Selected: Story = {
  args: {
    agent: sampleAgent,
    selected: true,
    className: 'w-80',
  },
};

export const WithFavorite: Story = {
  render: () => {
    const [favorite, setFavorite] = useState(false);
    return (
      <AgentCard
        agent={sampleAgent}
        favorite={favorite}
        onFavoriteToggle={() => setFavorite(!favorite)}
        className="w-80"
      />
    );
  },
};

export const TierVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <AgentCard
        agent={{
          ...sampleAgent,
          id: '1',
          name: 'Morgan',
          title: 'Product Manager',
          tier: 0,
          icon: <Zap size={24} className="text-white" />,
        }}
      />
      <AgentCard
        agent={{
          ...sampleAgent,
          id: '2',
          name: 'Aria',
          title: 'Software Architect',
          tier: 1,
          icon: <Bot size={24} className="text-white" />,
        }}
      />
      <AgentCard
        agent={{
          ...sampleAgent,
          id: '3',
          name: 'Uma',
          title: 'UX Designer',
          tier: 2,
          icon: <Palette size={24} className="text-white" />,
        }}
      />
    </div>
  ),
};

export const CompactList: Story = {
  render: () => {
    const agents: Agent[] = [
      { id: '1', name: 'Dex', title: 'Developer', tier: 0, status: 'working', icon: <Code size={20} className="text-white" /> },
      { id: '2', name: 'Uma', title: 'Designer', tier: 1, status: 'idle', icon: <Palette size={20} className="text-white" /> },
      { id: '3', name: 'Alex', title: 'Analyst', tier: 2, status: 'waiting', icon: <FileText size={20} className="text-white" /> },
    ];

    return (
      <div className="space-y-2 w-72">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} compact />
        ))}
      </div>
    );
  },
};

export const WithoutIcon: Story = {
  args: {
    agent: {
      id: '1',
      name: 'Quinn',
      title: 'QA Engineer',
      description: 'Ensures quality across all deliverables',
      tier: 1,
      commandCount: 8,
    },
    className: 'w-80',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {(['idle', 'working', 'waiting', 'success', 'error', 'offline'] as const).map((status) => (
        <AgentCard
          key={status}
          agent={{
            id: status,
            name: `Agent ${status}`,
            title: `Status: ${status}`,
            status,
            tier: 1,
          }}
          compact
        />
      ))}
    </div>
  ),
};
