import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';

// ── Types ──────────────────────────────────────────────────────────

export type IdeaType = 'text' | 'voice' | 'link' | 'image' | 'file';
export type IdeaStatus = 'raw' | 'tagged' | 'organized';
export type OutputType = 'story' | 'prd' | 'epic' | 'requirements' | 'action-plan';
export type RoomPhase = 'collecting' | 'organizing' | 'reviewing' | 'exporting';

export interface BrainstormIdea {
  id: string;
  type: IdeaType;
  content: string;
  rawContent?: string; // audio blob URL, original link, etc.
  tags: string[];
  groupId: string | null;
  position: { x: number; y: number };
  color?: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaGroup {
  id: string;
  label: string;
  color: string;
  ideaIds: string[];
}

export interface BrainstormOutput {
  id: string;
  type: OutputType;
  title: string;
  content: string; // markdown
  structuredData: Record<string, unknown>;
  createdAt: string;
}

export interface BrainstormRoom {
  id: string;
  name: string;
  description?: string;
  phase: RoomPhase;
  ideas: BrainstormIdea[];
  groups: IdeaGroup[];
  outputs: BrainstormOutput[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrainstormState {
  rooms: BrainstormRoom[];
  activeRoomId: string | null;
  isOrganizing: boolean;
  organizingProgress: number;
}

export interface BrainstormActions {
  // Room CRUD
  createRoom: (name: string, description?: string) => string;
  deleteRoom: (roomId: string) => void;
  setActiveRoom: (roomId: string | null) => void;
  updateRoom: (roomId: string, updates: Partial<Pick<BrainstormRoom, 'name' | 'description'>>) => void;

  // Idea CRUD
  addIdea: (roomId: string, idea: Pick<BrainstormIdea, 'type' | 'content' | 'rawContent' | 'tags' | 'color'>) => string;
  updateIdea: (roomId: string, ideaId: string, updates: Partial<BrainstormIdea>) => void;
  removeIdea: (roomId: string, ideaId: string) => void;
  moveIdea: (roomId: string, ideaId: string, position: { x: number; y: number }) => void;

  // Tagging & Grouping
  tagIdea: (roomId: string, ideaId: string, tags: string[]) => void;
  createGroup: (roomId: string, label: string, color: string) => string;
  assignToGroup: (roomId: string, ideaId: string, groupId: string | null) => void;
  removeGroup: (roomId: string, groupId: string) => void;

  // AI Organization
  setOrganizing: (isOrganizing: boolean, progress?: number) => void;
  setRoomPhase: (roomId: string, phase: RoomPhase) => void;
  addOutput: (roomId: string, output: Omit<BrainstormOutput, 'id' | 'createdAt'>) => void;
  clearOutputs: (roomId: string) => void;
  removeOutput: (roomId: string, outputId: string) => void;

  // Selectors
  getActiveRoom: () => BrainstormRoom | undefined;
  getRoomIdeas: (roomId: string) => BrainstormIdea[];
}

// ── Helpers ─────────────────────────────────────────────────────────

const uid = () =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
const now = () => new Date().toISOString();

function nextPosition(ideas: BrainstormIdea[]): { x: number; y: number } {
  const cols = 4;
  const gapX = 280;
  const gapY = 200;
  const idx = ideas.length;
  return {
    x: 40 + (idx % cols) * gapX,
    y: 40 + Math.floor(idx / cols) * gapY,
  };
}

// ── Store ───────────────────────────────────────────────────────────

export const useBrainstormStore = create<BrainstormState & BrainstormActions>()(
  persist(
    (set, get) => ({
      // State
      rooms: [],
      activeRoomId: null,
      isOrganizing: false,
      organizingProgress: 0,

      // Room CRUD
      createRoom: (name, description) => {
        const id = uid();
        const room: BrainstormRoom = {
          id,
          name,
          description,
          phase: 'collecting',
          ideas: [],
          groups: [],
          outputs: [],
          tags: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ rooms: [...s.rooms, room], activeRoomId: id }));
        return id;
      },

      deleteRoom: (roomId) =>
        set((s) => ({
          rooms: s.rooms.filter((r) => r.id !== roomId),
          activeRoomId: s.activeRoomId === roomId ? null : s.activeRoomId,
        })),

      setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

      updateRoom: (roomId, updates) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId ? { ...r, ...updates, updatedAt: now() } : r
          ),
        })),

      // Idea CRUD
      addIdea: (roomId, idea) => {
        const id = uid();
        set((s) => ({
          rooms: s.rooms.map((r) => {
            if (r.id !== roomId) return r;
            const newIdea: BrainstormIdea = {
              id,
              type: idea.type,
              content: idea.content,
              rawContent: idea.rawContent,
              tags: idea.tags || [],
              groupId: null,
              position: nextPosition(r.ideas),
              color: idea.color,
              status: 'raw',
              createdAt: now(),
              updatedAt: now(),
            };
            // Collect new unique tags
            const allTags = new Set([...r.tags, ...newIdea.tags]);
            return {
              ...r,
              ideas: [...r.ideas, newIdea],
              tags: [...allTags],
              updatedAt: now(),
            };
          }),
        }));
        return id;
      },

      updateIdea: (roomId, ideaId, updates) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  ideas: r.ideas.map((i) =>
                    i.id === ideaId ? { ...i, ...updates, updatedAt: now() } : i
                  ),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      removeIdea: (roomId, ideaId) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? { ...r, ideas: r.ideas.filter((i) => i.id !== ideaId), updatedAt: now() }
              : r
          ),
        })),

      moveIdea: (roomId, ideaId, position) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  ideas: r.ideas.map((i) =>
                    i.id === ideaId ? { ...i, position, updatedAt: now() } : i
                  ),
                }
              : r
          ),
        })),

      // Tagging
      tagIdea: (roomId, ideaId, tags) =>
        set((s) => ({
          rooms: s.rooms.map((r) => {
            if (r.id !== roomId) return r;
            const allTags = new Set([...r.tags, ...tags]);
            return {
              ...r,
              ideas: r.ideas.map((i) =>
                i.id === ideaId
                  ? { ...i, tags, status: tags.length > 0 ? 'tagged' as const : 'raw' as const, updatedAt: now() }
                  : i
              ),
              tags: [...allTags],
              updatedAt: now(),
            };
          }),
        })),

      createGroup: (roomId, label, color) => {
        const id = uid();
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? { ...r, groups: [...r.groups, { id, label, color, ideaIds: [] }], updatedAt: now() }
              : r
          ),
        }));
        return id;
      },

      assignToGroup: (roomId, ideaId, groupId) =>
        set((s) => ({
          rooms: s.rooms.map((r) => {
            if (r.id !== roomId) return r;
            return {
              ...r,
              ideas: r.ideas.map((i) =>
                i.id === ideaId ? { ...i, groupId, updatedAt: now() } : i
              ),
              groups: r.groups.map((g) => ({
                ...g,
                ideaIds: groupId === g.id
                  ? [...new Set([...g.ideaIds, ideaId])]
                  : g.ideaIds.filter((id) => id !== ideaId),
              })),
              updatedAt: now(),
            };
          }),
        })),

      removeGroup: (roomId, groupId) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  groups: r.groups.filter((g) => g.id !== groupId),
                  ideas: r.ideas.map((i) =>
                    i.groupId === groupId ? { ...i, groupId: null } : i
                  ),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      // AI Organization
      setOrganizing: (isOrganizing, progress = 0) =>
        set({ isOrganizing, organizingProgress: progress }),

      setRoomPhase: (roomId, phase) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId ? { ...r, phase, updatedAt: now() } : r
          ),
        })),

      addOutput: (roomId, output) => {
        const id = uid();
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  outputs: [...r.outputs, { ...output, id, createdAt: now() }],
                  updatedAt: now(),
                }
              : r
          ),
        }));
      },

      clearOutputs: (roomId) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId ? { ...r, outputs: [], updatedAt: now() } : r
          ),
        })),

      removeOutput: (roomId, outputId) =>
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? { ...r, outputs: r.outputs.filter((o) => o.id !== outputId), updatedAt: now() }
              : r
          ),
        })),

      // Selectors
      getActiveRoom: () => {
        const { rooms, activeRoomId } = get();
        return rooms.find((r) => r.id === activeRoomId);
      },

      getRoomIdeas: (roomId) => {
        const room = get().rooms.find((r) => r.id === roomId);
        return room?.ideas ?? [];
      },
    }),
    {
      name: 'aios-brainstorm-store',
      storage: safePersistStorage,
      partialize: (state) => ({
        rooms: state.rooms,
        activeRoomId: state.activeRoomId,
      }),
    }
  )
);
