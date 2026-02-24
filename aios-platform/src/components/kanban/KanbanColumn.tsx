import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, type LucideIcon } from 'lucide-react';
import { GlassButton } from '../ui';
import { cn } from '../../lib/utils';
import { StoryCard } from './StoryCard';
import type { Story, StoryStatus } from '../../stores/storyStore';

export interface ColumnConfig {
  id: StoryStatus;
  label: string;
  color: string;
  icon: LucideIcon;
}

interface KanbanColumnProps {
  column: ColumnConfig;
  stories: Story[];
  onStoryClick: (story: Story) => void;
  onAddStory: (status: StoryStatus) => void;
}

export function KanbanColumn({
  column,
  stories,
  onStoryClick,
  onAddStory,
}: KanbanColumnProps) {
  const [collapsed, setCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      status: column.id,
    },
  });

  const storyIds = stories.map((s) => s.id);

  return (
    <div
      className={cn(
        'flex flex-col min-w-[300px] max-w-[300px] rounded-xl transition-colors duration-200',
        isOver && 'ring-2 ring-blue-500/30 bg-blue-500/5'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label={collapsed ? `Expand ${column.label}` : `Collapse ${column.label}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <span className="text-sm font-semibold text-primary">
              {column.label}
            </span>
            <motion.span
              animate={{ rotate: collapsed ? -90 : 0 }}
              transition={{ duration: 0.15 }}
              className="text-tertiary"
            >
              <ChevronDown size={14} />
            </motion.span>
          </button>

          {/* Count badge */}
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-white/10 text-[10px] font-medium text-tertiary">
            {stories.length}
          </span>
        </div>

        {/* Add story button */}
        <GlassButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity"
          onClick={() => onAddStory(column.id)}
          aria-label={`Add story to ${column.label}`}
          style={{ opacity: 1 }}
        >
          <Plus size={14} />
        </GlassButton>
      </div>

      {/* Drop zone */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              ref={setNodeRef}
              className={cn(
                'flex flex-col gap-2 px-1.5 pb-2 min-h-[80px] transition-colors rounded-lg',
                isOver && 'bg-blue-500/5'
              )}
            >
              <SortableContext
                items={storyIds}
                strategy={verticalListSortingStrategy}
              >
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={() => onStoryClick(story)}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-xs text-tertiary italic">
                    No stories
                  </div>
                )}
              </SortableContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
