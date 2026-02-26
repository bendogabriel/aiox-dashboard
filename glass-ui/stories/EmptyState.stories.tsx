import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../src/components/ui/EmptyState';
import { GlassButton } from '../src/components/ui/GlassButton';
import { Inbox, Search, FileQuestion, Users, FolderOpen } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
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
    icon: <Inbox size={48} />,
    title: 'No messages',
    description: 'You have no messages in your inbox yet.',
    className: 'w-96',
  },
};

export const WithAction: Story = {
  args: {
    icon: <Users size={48} />,
    title: 'No team members',
    description: 'Start by inviting team members to collaborate on your project.',
    action: <GlassButton variant="primary">Invite Members</GlassButton>,
    className: 'w-96',
  },
};

export const SearchEmpty: Story = {
  args: {
    icon: <Search size={48} />,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
    action: <GlassButton variant="ghost">Clear Filters</GlassButton>,
    className: 'w-96',
  },
};

export const FileNotFound: Story = {
  args: {
    icon: <FileQuestion size={48} />,
    title: 'File not found',
    description: 'The file you\'re looking for doesn\'t exist or has been moved.',
    action: (
      <div className="flex gap-2">
        <GlassButton variant="ghost">Go Back</GlassButton>
        <GlassButton variant="primary">Browse Files</GlassButton>
      </div>
    ),
    className: 'w-96',
  },
};

export const EmptyFolder: Story = {
  args: {
    icon: <FolderOpen size={48} />,
    title: 'This folder is empty',
    description: 'Upload files or create a new subfolder to get started.',
    action: (
      <div className="flex gap-2">
        <GlassButton>New Folder</GlassButton>
        <GlassButton variant="primary">Upload Files</GlassButton>
      </div>
    ),
    className: 'w-96',
  },
};

export const Minimal: Story = {
  args: {
    title: 'Nothing here yet',
    className: 'w-80',
  },
};
