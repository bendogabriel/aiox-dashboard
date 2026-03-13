import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import type { ChatSession, Message, SquadType } from '../types';
import { generateId } from '../lib/utils';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  abortController: AbortController | null;
}

interface ChatActions {
  createSession: (agentId: string, agentName: string, squadId: string, squadType: SquadType) => string;
  setActiveSession: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (sessionId: string, messageId: string, content: string, metadata?: Message['metadata']) => void;
  deleteSession: (sessionId: string) => void;
  clearSessions: () => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  stopStreaming: () => void;
  setError: (error: string | null) => void;
  getActiveSession: () => ChatSession | null;
  getSessionByAgent: (agentId: string) => ChatSession | undefined;
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      // State
      sessions: [],
      activeSessionId: null,
      isLoading: false,
      isStreaming: false,
      error: null,
      abortController: null,

      // Actions
      createSession: (agentId, agentName, squadId, squadType) => {
        const id = generateId();
        const newSession: ChatSession = {
          id,
          agentId,
          agentName,
          squadId,
          squadType,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));

        return id;
      },

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

      addMessage: (sessionId, message) => {
        const messageId = generateId();
        const newMessage: Message = {
          ...message,
          id: messageId,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                }
              : session
          ),
        }));

        return messageId;
      },

      updateMessage: (sessionId, messageId, content, metadata) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((msg) =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          content,
                          isStreaming: false,
                          metadata: metadata ? { ...msg.metadata, ...metadata } : msg.metadata,
                        }
                      : msg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : session
          ),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId:
            state.activeSessionId === sessionId
              ? state.sessions[0]?.id || null
              : state.activeSessionId,
        }));
      },

      clearSessions: () => set({ sessions: [], activeSessionId: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      setAbortController: (controller) => set({ abortController: controller }),

      stopStreaming: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set({ isStreaming: false, abortController: null });
      },

      setError: (error) => set({ error }),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || null;
      },

      getSessionByAgent: (agentId) => {
        return get().sessions.find((s) => s.agentId === agentId);
      },
    }),
    {
      name: 'aios-chat-store',
      storage: safePersistStorage,
      partialize: (state) => ({
        // Keep last 50 sessions, but strip large attachment data to avoid localStorage limits
        sessions: state.sessions.slice(0, 50).map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            // Strip base64 data from attachments to save space, keep only URLs and metadata
            attachments: msg.attachments?.map(att => ({
              ...att,
              data: undefined, // Don't persist base64 data
              // Keep URL if it's not a blob URL (blob URLs don't persist)
              url: att.url?.startsWith('blob:') ? undefined : att.url,
            })),
          })),
        })),
        activeSessionId: state.activeSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clean up stuck streaming messages and backfill missing agent data
        // from session-level fields (handles messages persisted before
        // agentName/agentId/squadType were added to the Message type).
        let dirty = false;
        const cleaned = state.sessions.map(session => {
          let sessionDirty = false;
          const msgs = session.messages.map(msg => {
            let patched = msg;
            // Fix stuck streaming
            if (patched.isStreaming) {
              sessionDirty = true;
              patched = {
                ...patched,
                isStreaming: false,
                content: patched.content || '*[Resposta não recebida — tente novamente]*',
              };
            }
            // Backfill missing agent data on agent messages
            if (patched.role === 'agent' && !patched.agentName && session.agentName) {
              sessionDirty = true;
              patched = {
                ...patched,
                agentName: session.agentName,
                agentId: patched.agentId || session.agentId,
                squadId: patched.squadId || session.squadId,
                squadType: patched.squadType || session.squadType,
              };
            }
            return patched;
          });
          if (sessionDirty) dirty = true;
          return sessionDirty ? { ...session, messages: msgs } : session;
        });
        if (dirty) {
          useChatStore.setState({ sessions: cleaned });
        }
      },
    }
  )
);
