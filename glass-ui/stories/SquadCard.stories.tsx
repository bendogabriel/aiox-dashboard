import type { Meta, StoryObj } from '@storybook/react';
import { SquadCard, Squad, SquadType } from '../src/components/molecules/SquadCard';

const meta: Meta<typeof SquadCard> = {
  title: 'Molecules/SquadCard',
  component: SquadCard,
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
    selected: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSquad: Squad = {
  id: '1',
  name: 'Product & Dev',
  type: 'product',
  description: 'Core product development team handling features, architecture, and implementation.',
  capabilities: ['Development', 'Architecture', 'Testing', 'Code Review'],
  agentCount: 5,
  status: 'working',
};

export const Default: Story = {
  args: {
    squad: sampleSquad,
    className: 'w-80',
  },
};

export const Selected: Story = {
  args: {
    squad: sampleSquad,
    selected: true,
    className: 'w-80',
  },
};

export const AllTypes: Story = {
  render: () => {
    const squads: Squad[] = [
      {
        id: '1',
        name: 'Operations',
        type: 'operations',
        description: 'Infrastructure and DevOps team',
        capabilities: ['CI/CD', 'Monitoring', 'Deployment'],
        agentCount: 3,
        status: 'working',
      },
      {
        id: '2',
        name: 'Product & Dev',
        type: 'product',
        description: 'Product development and engineering',
        capabilities: ['Development', 'Architecture', 'Testing'],
        agentCount: 5,
        status: 'working',
      },
      {
        id: '3',
        name: 'Content & Marketing',
        type: 'content',
        description: 'Content creation and marketing',
        capabilities: ['Copywriting', 'SEO', 'Social Media'],
        agentCount: 4,
        status: 'idle',
      },
      {
        id: '4',
        name: 'Data & Strategy',
        type: 'data',
        description: 'Data analysis and business strategy',
        capabilities: ['Analytics', 'BI', 'Forecasting'],
        agentCount: 3,
        status: 'waiting',
      },
      {
        id: '5',
        name: 'Sales & Ads',
        type: 'sales',
        description: 'Sales and advertising campaigns',
        capabilities: ['Campaigns', 'Lead Gen', 'Ads'],
        agentCount: 4,
        status: 'success',
      },
    ];

    return (
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {squads.map((squad) => (
          <SquadCard key={squad.id} squad={squad} />
        ))}
      </div>
    );
  },
};

export const Minimal: Story = {
  args: {
    squad: {
      id: '1',
      name: 'New Squad',
      type: 'default',
      agentCount: 0,
    },
    className: 'w-80',
  },
};

export const ManyCapabilities: Story = {
  args: {
    squad: {
      ...sampleSquad,
      capabilities: ['Development', 'Architecture', 'Testing', 'Code Review', 'Documentation', 'Security', 'Performance'],
    },
    className: 'w-80',
  },
};

export const Interactive: Story = {
  render: () => {
    const squads: Squad[] = [
      { id: '1', name: 'Operations', type: 'operations', agentCount: 3, status: 'working' },
      { id: '2', name: 'Product', type: 'product', agentCount: 5, status: 'idle' },
      { id: '3', name: 'Content', type: 'content', agentCount: 4, status: 'waiting' },
    ];

    return (
      <div className="flex gap-4">
        {squads.map((squad) => (
          <SquadCard
            key={squad.id}
            squad={squad}
            onClick={() => alert(`Clicked ${squad.name}`)}
          />
        ))}
      </div>
    );
  },
};
