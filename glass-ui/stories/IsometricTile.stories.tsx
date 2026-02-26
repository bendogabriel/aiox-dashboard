import type { Meta, StoryObj } from '@storybook/react';
import { IsometricTile, createIsometricGrid } from '../src/components/world/IsometricTile';

const meta: Meta<typeof IsometricTile> = {
  title: 'World/IsometricTile',
  component: IsometricTile,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f0f' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative w-[200px] h-[100px]">
      <IsometricTile
        col={0}
        row={0}
        color="#3b82f6"
        borderColor="#60a5fa"
        offsetX={100}
        offsetY={25}
      />
    </div>
  ),
};

export const WithPulse: Story = {
  render: () => (
    <div className="relative w-[200px] h-[100px]">
      <IsometricTile
        col={0}
        row={0}
        color="#22c55e"
        borderColor="#4ade80"
        pulse
        offsetX={100}
        offsetY={25}
      />
    </div>
  ),
};

export const Highlighted: Story = {
  render: () => (
    <div className="relative w-[200px] h-[100px]">
      <IsometricTile
        col={0}
        row={0}
        color="#8b5cf6"
        borderColor="#a78bfa"
        highlighted
        offsetX={100}
        offsetY={25}
      />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="relative w-[200px] h-[100px]">
      <IsometricTile
        col={0}
        row={0}
        color="#f59e0b"
        borderColor="#fbbf24"
        onClick={() => alert('Tile clicked!')}
        offsetX={100}
        offsetY={25}
      />
    </div>
  ),
};

export const WithContent: Story = {
  render: () => (
    <div className="relative w-[200px] h-[100px]">
      <IsometricTile
        col={0}
        row={0}
        color="#ec4899"
        borderColor="#f472b6"
        offsetX={100}
        offsetY={25}
      >
        <span className="text-white text-xs font-bold">🏠</span>
      </IsometricTile>
    </div>
  ),
};

export const SmallGrid: Story = {
  render: () => {
    const { tiles, offsetX, offsetY } = createIsometricGrid(3, 3, {
      centerX: 200,
      centerY: 50,
    });

    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

    return (
      <div className="relative w-[400px] h-[200px]">
        {tiles.map((tile, i) => (
          <IsometricTile
            key={`${tile.col}-${tile.row}`}
            col={tile.col}
            row={tile.row}
            color={colors[i % colors.length]}
            borderColor={colors[i % colors.length]}
            offsetX={offsetX}
            offsetY={offsetY}
          />
        ))}
      </div>
    );
  },
};

export const SquadLayout: Story = {
  render: () => {
    const squads = [
      { name: 'Operations', color: '#06b6d4', col: 0, row: 0 },
      { name: 'Product', color: '#8b5cf6', col: 1, row: 0 },
      { name: 'Content', color: '#f97316', col: 2, row: 0 },
      { name: 'Data', color: '#3b82f6', col: 0, row: 1 },
      { name: 'Sales', color: '#22c55e', col: 1, row: 1 },
    ];

    return (
      <div className="relative w-[500px] h-[250px]">
        {squads.map((squad) => (
          <IsometricTile
            key={squad.name}
            col={squad.col}
            row={squad.row}
            color={squad.color}
            borderColor={squad.color}
            highlighted
            onClick={() => alert(`${squad.name} clicked!`)}
            offsetX={200}
            offsetY={50}
            tileWidth={120}
            tileHeight={60}
          >
            <span className="text-white text-[10px] font-semibold drop-shadow-lg">
              {squad.name}
            </span>
          </IsometricTile>
        ))}
      </div>
    );
  },
};

export const LargerGrid: Story = {
  render: () => {
    const { tiles, offsetX, offsetY } = createIsometricGrid(5, 5, {
      centerX: 300,
      centerY: 50,
    });

    return (
      <div className="relative w-[600px] h-[300px]">
        {tiles.map((tile) => {
          const isCenter = tile.col === 2 && tile.row === 2;
          return (
            <IsometricTile
              key={`${tile.col}-${tile.row}`}
              col={tile.col}
              row={tile.row}
              color={isCenter ? '#22c55e' : '#1e293b'}
              borderColor={isCenter ? '#4ade80' : '#334155'}
              pulse={isCenter}
              highlighted={isCenter}
              offsetX={offsetX}
              offsetY={offsetY}
            />
          );
        })}
      </div>
    );
  },
};
