import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import {
  Plus,
  LayoutGrid,
  Loader2,
  ClipboardList,
  RefreshCw,
  Bot,
  User,
  GitMerge,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GlassButton } from '../ui';
import { KanbanColumn, type ColumnConfig } from './KanbanColumn';
import { StoryCard } from './StoryCard';
import { StoryCreateModal } from './StoryCreateModal';
import { StoryDetailModal } from './StoryDetailModal';
import { useStories } from '../../hooks/useStories';
import { useStoryStore, type Story, type StoryStatus } from '../../stores/storyStore';

const COLUMNS: ColumnConfig[] = [
  { id: 'backlog', label: 'Backlog', color: '#6b7280', icon: ClipboardList },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6', icon: RefreshCw },
  { id: 'ai_review', label: 'AI Review', color: '#a855f7', icon: Bot },
  { id: 'human_review', label: 'Human Review', color: '#f97316', icon: User },
  { id: 'pr_created', label: 'PR Created', color: '#22c55e', icon: GitMerge },
  { id: 'done', label: 'Done', color: '#10b981', icon: CheckCircle },
  { id: 'error', label: 'Error', color: '#ef4444', icon: XCircle },
];

export default function KanbanBoard() {
  const { stories, isLoading } = useStories();
  const {
    storyOrder,
    addStory,
    updateStory,
    deleteStory,
    moveStory,
    reorderStory,
    setDraggedStory,
  } = useStoryStore();

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<StoryStatus>('backlog');
  const [detailStory, setDetailStory] = useState<Story | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Drag state
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Group stories by column using storyOrder
  const storiesByColumn = useMemo(() => {
    const storyMap = new Map(stories.map((s: Story) => [s.id, s]));
    const result: Record<StoryStatus, Story[]> = {
      backlog: [],
      in_progress: [],
      ai_review: [],
      human_review: [],
      pr_created: [],
      done: [],
      error: [],
    };

    for (const col of COLUMNS) {
      const orderedIds = storyOrder[col.id] || [];
      // Add stories that are in the order
      for (const id of orderedIds) {
        const story = storyMap.get(id);
        if (story) {
          result[col.id].push(story);
          storyMap.delete(id);
        }
      }
    }

    // Add any remaining stories that are not in the order (fallback)
    for (const [, story] of storyMap) {
      if (result[story.status]) {
        result[story.status].push(story);
      }
    }

    return result;
  }, [stories, storyOrder]);

  const totalStories = stories.length;

  // Find which column a story is in
  const findColumnOfStory = useCallback(
    (storyId: string): StoryStatus | null => {
      for (const col of COLUMNS) {
        const colStories = storiesByColumn[col.id];
        if (colStories.some((s: Story) => s.id === storyId)) {
          return col.id;
        }
      }
      return null;
    },
    [storiesByColumn]
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const story = stories.find((s: Story) => s.id === active.id);
      if (story) {
        setActiveStory(story);
        setDraggedStory(story.id);
      }
    },
    [stories, setDraggedStory]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnOfStory(activeId);
      if (!activeColumn) return;

      // Determine the target column
      let overColumn: StoryStatus | null = null;

      // Check if we're over a column directly
      if (COLUMNS.some((c) => c.id === overId)) {
        overColumn = overId as StoryStatus;
      } else {
        // We're over another story card - find its column
        overColumn = findColumnOfStory(overId);
      }

      if (!overColumn || activeColumn === overColumn) return;

      // Move story to a different column
      moveStory(activeId, overColumn);
    },
    [findColumnOfStory, moveStory]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveStory(null);
      setDraggedStory(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // If dropped on a column header, just the moveStory from dragOver already handled it
      if (COLUMNS.some((c) => c.id === overId)) return;

      // If dropped on another story in the same column, reorder
      const activeColumn = findColumnOfStory(activeId);
      const overColumn = findColumnOfStory(overId);

      if (activeColumn && activeColumn === overColumn) {
        const colStories = storiesByColumn[activeColumn];
        const oldIndex = colStories.findIndex((s: Story) => s.id === activeId);
        const newIndex = colStories.findIndex((s: Story) => s.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reorderStory(activeColumn, oldIndex, newIndex);
        }
      }
    },
    [findColumnOfStory, storiesByColumn, reorderStory, setDraggedStory]
  );

  // Story card click
  const handleStoryClick = useCallback((story: Story) => {
    setDetailStory(story);
    setDetailModalOpen(true);
  }, []);

  // Add story to column
  const handleAddStory = useCallback((status: StoryStatus) => {
    setCreateDefaultStatus(status);
    setCreateModalOpen(true);
  }, []);

  // Create story
  const handleCreateStory = useCallback(
    (story: Story) => {
      addStory(story);
    },
    [addStory]
  );

  // Update story
  const handleUpdateStory = useCallback(
    (id: string, updates: Partial<Story>) => {
      updateStory(id, updates);
      // Refresh the detail story with updated data
      if (detailStory && detailStory.id === id) {
        setDetailStory((prev) =>
          prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null
        );
      }
    },
    [updateStory, detailStory]
  );

  // Delete story
  const handleDeleteStory = useCallback(
    (id: string) => {
      deleteStory(id);
    },
    [deleteStory]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-tertiary animate-spin" />
          <span className="text-sm text-secondary">Loading stories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-6 py-4 border-b border-glass-border flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <LayoutGrid size={20} className="text-secondary" />
          <h1 className="text-lg font-semibold text-primary">Kanban Board</h1>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-white/10 text-[10px] font-medium text-tertiary">
            {totalStories}
          </span>
        </div>

        <GlassButton
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setCreateDefaultStatus('backlog');
            setCreateModalOpen(true);
          }}
        >
          New Story
        </GlassButton>
      </motion.div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex flex-col h-full">
                <KanbanColumn
                  column={column}
                  stories={storiesByColumn[column.id]}
                  onStoryClick={handleStoryClick}
                  onAddStory={handleAddStory}
                />
              </div>
            ))}
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeStory ? (
              <StoryCard story={activeStory} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create modal */}
      <StoryCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateStory}
        defaultStatus={createDefaultStatus}
      />

      {/* Detail modal */}
      <StoryDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailStory(null);
        }}
        story={detailStory}
        onUpdate={handleUpdateStory}
        onDelete={handleDeleteStory}
      />
    </div>
  );
}
