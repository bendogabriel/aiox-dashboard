import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, User, Zap } from 'lucide-react';
import { GlassCard, ProgressBar } from '../ui';
import { cn } from '../../lib/utils';
import type { Story } from '../../stores/storyStore';

interface StoryCardProps {
  story: Story;
  onClick?: () => void;
  isDragOverlay?: boolean;
}

const categoryColors: Record<Story['category'], string> = {
  feature: 'bg-blue-500/15 text-blue-400',
  fix: 'bg-red-500/15 text-red-400',
  refactor: 'bg-amber-500/15 text-amber-400',
  docs: 'bg-green-500/15 text-green-400',
};

const categoryLabels: Record<Story['category'], string> = {
  feature: 'Feature',
  fix: 'Fix',
  refactor: 'Refactor',
  docs: 'Docs',
};

const complexityColors: Record<Story['complexity'], string> = {
  simple: 'bg-green-500/15 text-green-400',
  standard: 'bg-yellow-500/15 text-yellow-400',
  complex: 'bg-red-500/15 text-red-400',
};

const priorityIndicators: Record<Story['priority'], { color: string; label: string }> = {
  low: { color: 'bg-gray-400', label: 'Low' },
  medium: { color: 'bg-blue-400', label: 'Medium' },
  high: { color: 'bg-orange-400', label: 'High' },
  critical: { color: 'bg-red-500', label: 'Critical' },
};

const progressVariant = (progress: number) => {
  if (progress >= 100) return 'success' as const;
  if (progress >= 60) return 'info' as const;
  if (progress >= 30) return 'warning' as const;
  return 'default' as const;
};

export function StoryCard({ story, onClick, isDragOverlay = false }: StoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: story.id,
    data: {
      type: 'story',
      story,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityIndicators[story.priority];

  if (isDragOverlay) {
    return (
      <div
        className="w-[280px]"
        style={{ transform: 'rotate(3deg) scale(1.05)', opacity: 0.9 }}
      >
        <StoryCardContent story={story} priority={priority} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group transition-opacity duration-150',
        isDragging && 'opacity-40'
      )}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        <GlassCard
          variant="subtle"
          padding="sm"
          radius="md"
          animate={false}
          interactive
          className="cursor-pointer relative"
          onClick={onClick}
        >
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center',
              'opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity',
              'cursor-grab active:cursor-grabbing touch-manipulation'
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical size={14} className="text-tertiary" />
          </div>

          <div className="pl-4">
            <StoryCardContent story={story} priority={priority} />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function StoryCardContent({
  story,
  priority,
}: {
  story: Story;
  priority: { color: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Top row: badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Priority dot */}
        <span
          className={cn('w-2 h-2 rounded-full flex-shrink-0', priority.color)}
          title={`Priority: ${priority.label}`}
        />

        {/* Category badge */}
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
            categoryColors[story.category]
          )}
        >
          {categoryLabels[story.category]}
        </span>

        {/* Complexity badge */}
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
            complexityColors[story.complexity]
          )}
        >
          {story.complexity}
        </span>

        {/* Bob orchestrated indicator */}
        {story.bobOrchestrated && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400"
            title="Bob Orchestrated"
          >
            <Zap size={10} className="mr-0.5" />
            Bob
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-primary leading-tight line-clamp-2">
        {story.title}
      </h4>

      {/* Description */}
      {story.description && (
        <p className="text-xs text-tertiary line-clamp-2 leading-relaxed">
          {story.description}
        </p>
      )}

      {/* Progress bar */}
      {story.progress > 0 && (
        <ProgressBar
          value={story.progress}
          size="sm"
          variant={progressVariant(story.progress)}
          showLabel
          animate={false}
        />
      )}

      {/* Bottom row: agent + ID */}
      <div className="flex items-center justify-between">
        {story.assignedAgent ? (
          <div className="flex items-center gap-1 text-xs text-secondary">
            <User size={12} />
            <span className="truncate max-w-[120px]">{story.assignedAgent}</span>
          </div>
        ) : (
          <span className="text-xs text-tertiary italic">Unassigned</span>
        )}
        <span className="text-[10px] text-tertiary font-mono">{story.id}</span>
      </div>
    </div>
  );
}
