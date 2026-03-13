import { Bot } from 'lucide-react';
import { CockpitCard, Badge, ProgressBar } from '../ui';
import { cn } from '../../lib/utils';
import type { Story } from '../../stores/storyStore';

interface StoryCardProps {
  story: Story;
  onClick?: () => void;
}

const categoryColors: Record<Story['category'], string> = {
  feature: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  fix: 'bg-[var(--bb-error)]/15 text-[var(--bb-error)]',
  refactor: 'bg-[var(--bb-warning)]/15 text-[var(--bb-warning)]',
  docs: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
};

const categoryLabels: Record<Story['category'], string> = {
  feature: 'Feature',
  fix: 'Fix',
  refactor: 'Refactor',
  docs: 'Docs',
};

const complexityColors: Record<Story['complexity'], string> = {
  simple: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
  standard: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  complex: 'bg-[var(--aiox-gray-muted)]/15 text-[var(--aiox-gray-muted)]',
};

const priorityColors: Record<Story['priority'], string> = {
  low: 'bg-[var(--aiox-gray-dim)]/15 text-tertiary',
  medium: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  high: 'bg-[var(--bb-flare)]/15 text-[var(--bb-flare)]',
  critical: 'bg-[var(--bb-error)]/15 text-[var(--bb-error)]',
};

const statusRing: Record<Story['status'], string> = {
  backlog: '',
  in_progress: 'ring-1 ring-[var(--aiox-lime)]/30',
  ai_review: 'ring-1 ring-[var(--aiox-gray-muted)]/30',
  human_review: 'ring-1 ring-[var(--bb-flare)]/30',
  pr_created: 'ring-1 ring-[var(--aiox-lime)]/30',
  done: 'bg-[var(--color-status-success)]/5',
  error: 'bg-[var(--bb-error)]/5 ring-1 ring-[var(--bb-error)]/30',
};

export function StoryCard({ story, onClick }: StoryCardProps) {
  return (
    <CockpitCard
      interactive
      padding="sm"
      className={cn(
        'cursor-pointer select-none',
        statusRing[story.status],
      )}
      onClick={onClick}
    >
      {/* Header: category + complexity */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md', categoryColors[story.category])}>
          {categoryLabels[story.category]}
        </span>
        <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md', complexityColors[story.complexity])}>
          {story.complexity}
        </span>
        {story.bobOrchestrated && (
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]" title="Bob Orchestrated">
            <Bot size={10} className="mr-0.5" />
            BOB
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-primary line-clamp-2 mb-1">
        {story.title}
      </h3>

      {/* Description */}
      {story.description && (
        <p className="text-xs text-secondary line-clamp-2 mb-2">
          {story.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-glass-border">
        <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md', priorityColors[story.priority])}>
          {story.priority}
        </span>
        {story.assignedAgent && (
          <Badge size="sm" variant="default">
            {story.assignedAgent}
          </Badge>
        )}
        {story.progress > 0 && (
          <div className="flex-1 ml-1">
            <ProgressBar value={story.progress} size="sm" variant="info" />
          </div>
        )}
      </div>
    </CockpitCard>
  );
}
