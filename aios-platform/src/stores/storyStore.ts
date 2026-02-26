import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';

export type StoryStatus =
  | 'backlog'
  | 'in_progress'
  | 'ai_review'
  | 'human_review'
  | 'pr_created'
  | 'done'
  | 'error';

export interface Story {
  id: string;
  title: string;
  description?: string;
  status: StoryStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'standard' | 'complex';
  category: 'feature' | 'fix' | 'refactor' | 'docs';
  assignedAgent?: string;
  epicId?: string;
  acceptanceCriteria?: string[];
  technicalNotes?: string;
  progress: number;
  bobOrchestrated?: boolean;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryState {
  stories: Story[];
  storyOrder: Record<StoryStatus, string[]>;
  draggedStoryId: string | null;
  statusFilter: StoryStatus | null;
  epicFilter: string | null;
  searchQuery: string;
}

export interface StoryActions {
  addStory: (story: Story) => void;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  moveStory: (storyId: string, newStatus: StoryStatus) => void;
  reorderStory: (status: StoryStatus, oldIndex: number, newIndex: number) => void;
  setDraggedStory: (storyId: string | null) => void;
  setStories: (stories: Story[]) => void;
  setStatusFilter: (status: StoryStatus | null) => void;
  setEpicFilter: (epicId: string | null) => void;
  setSearchQuery: (query: string) => void;
  getFilteredStories: () => Story[];
}

function buildOrderFromStories(stories: Story[]): Record<StoryStatus, string[]> {
  const order: Record<StoryStatus, string[]> = {
    backlog: [],
    in_progress: [],
    ai_review: [],
    human_review: [],
    pr_created: [],
    done: [],
    error: [],
  };

  for (const story of stories) {
    if (order[story.status]) {
      order[story.status].push(story.id);
    }
  }

  return order;
}

// Track in-progress operations to prevent race conditions
const inProgressOps = new Set<string>();

function withGuard(opKey: string, fn: () => void): void {
  if (inProgressOps.has(opKey)) return;
  inProgressOps.add(opKey);
  try {
    fn();
  } finally {
    inProgressOps.delete(opKey);
  }
}

export const useStoryStore = create<StoryState & StoryActions>()(
  persist(
    (set, get) => ({
      // State
      stories: [] as Story[],
      storyOrder: buildOrderFromStories([]),
      draggedStoryId: null,
      statusFilter: null,
      epicFilter: null,
      searchQuery: '',

      // Actions
      addStory: (story) =>
        withGuard(`add-${story.id}`, () => {
          set((state) => {
            const stories = [...state.stories, story];
            const storyOrder = { ...state.storyOrder };
            storyOrder[story.status] = [...(storyOrder[story.status] || []), story.id];
            return { stories, storyOrder };
          });
        }),

      updateStory: (id, updates) =>
        withGuard(`update-${id}`, () => {
          set((state) => {
            const stories = state.stories.map((s) =>
              s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
            );
            // If status changed, rebuild order
            const statusChanged = updates.status !== undefined;
            const storyOrder = statusChanged ? buildOrderFromStories(stories) : state.storyOrder;
            return { stories, storyOrder };
          });
        }),

      deleteStory: (id) =>
        withGuard(`delete-${id}`, () => {
          set((state) => {
            const stories = state.stories.filter((s) => s.id !== id);
            const storyOrder = buildOrderFromStories(stories);
            return { stories, storyOrder };
          });
        }),

      moveStory: (storyId, newStatus) =>
        withGuard(`move-${storyId}`, () => {
          set((state) => {
            const story = state.stories.find((s) => s.id === storyId);
            if (!story || story.status === newStatus) return state;

            const oldStatus = story.status;
            const stories = state.stories.map((s) =>
              s.id === storyId
                ? { ...s, status: newStatus, updatedAt: new Date().toISOString() }
                : s
            );

            const storyOrder = { ...state.storyOrder };
            // Remove from old column
            storyOrder[oldStatus] = (storyOrder[oldStatus] || []).filter(
              (sid) => sid !== storyId
            );
            // Add to new column
            storyOrder[newStatus] = [...(storyOrder[newStatus] || []), storyId];

            return { stories, storyOrder };
          });
        }),

      reorderStory: (status, oldIndex, newIndex) =>
        withGuard(`reorder-${status}`, () => {
          set((state) => {
            const currentOrder = [...(state.storyOrder[status] || [])];
            if (oldIndex < 0 || oldIndex >= currentOrder.length) return state;
            if (newIndex < 0 || newIndex >= currentOrder.length) return state;

            const [removed] = currentOrder.splice(oldIndex, 1);
            currentOrder.splice(newIndex, 0, removed);

            return {
              storyOrder: { ...state.storyOrder, [status]: currentOrder },
            };
          });
        }),

      setDraggedStory: (storyId) => set({ draggedStoryId: storyId }),

      setStories: (stories) =>
        set({
          stories,
          storyOrder: buildOrderFromStories(stories),
        }),

      setStatusFilter: (status) => set({ statusFilter: status }),
      setEpicFilter: (epicId) => set({ epicFilter: epicId }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      getFilteredStories: (): Story[] => {
        const { stories, statusFilter, epicFilter, searchQuery } = get();
        let filtered: Story[] = stories;

        if (statusFilter) {
          filtered = filtered.filter((s: Story) => s.status === statusFilter);
        }

        if (epicFilter) {
          filtered = filtered.filter((s: Story) => s.epicId === epicFilter);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (s: Story) =>
              s.title.toLowerCase().includes(q) ||
              s.id.toLowerCase().includes(q) ||
              (s.description && s.description.toLowerCase().includes(q))
          );
        }

        return filtered;
      },
    }),
    {
      name: 'aios-story-store',
      storage: safePersistStorage,
      partialize: (state) => ({
        stories: state.stories,
        storyOrder: state.storyOrder,
        statusFilter: state.statusFilter,
        epicFilter: state.epicFilter,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
