import { create } from 'zustand';
import type { SalesAgent, ActivityEvent, SalesMetrics, Message, Lead, Conversation, ConnectionStatus } from './types';
import { INITIAL_AGENTS, INITIAL_ACTIVITIES, INITIAL_METRICS } from './seed';

interface SalesRoomState {
  agents: SalesAgent[];
  activities: ActivityEvent[];
  metrics: SalesMetrics;
  selectedAgentId: string;
  selectedConvIndex: number;
  whatsappStatus: ConnectionStatus;
  simulationEnabled: boolean;

  // Actions
  selectAgent: (id: string) => void;
  selectConversation: (index: number) => void;
  addMessage: (agentId: string, message: Message) => void;
  addConversation: (agentId: string, lead: Lead) => void;
  addActivity: (activity: ActivityEvent) => void;
  updateAgentStatus: (agentId: string, status: SalesAgent['status']) => void;
  updateMetrics: (partial: Partial<SalesMetrics>) => void;
  setWhatsappStatus: (status: ConnectionStatus) => void;
  setSimulationEnabled: (enabled: boolean) => void;
  incrementMetric: (key: keyof SalesMetrics, amount?: number) => void;
}

export const useSalesStore = create<SalesRoomState>((set, _get) => ({
  agents: INITIAL_AGENTS,
  activities: INITIAL_ACTIVITIES,
  metrics: { ...INITIAL_METRICS },
  selectedAgentId: INITIAL_AGENTS[0].id,
  selectedConvIndex: 0,
  whatsappStatus: 'disconnected',
  simulationEnabled: true,

  selectAgent: (id) => set({ selectedAgentId: id, selectedConvIndex: 0 }),

  selectConversation: (index) => set({ selectedConvIndex: index }),

  addMessage: (agentId, message) => set((state) => ({
    agents: state.agents.map((a) => {
      if (a.id !== agentId) return a;
      // Also add to last conversation if exists
      const convs = [...a.conversations];
      if (convs.length > 0) {
        const last = convs[convs.length - 1];
        convs[convs.length - 1] = { ...last, messages: [...last.messages, message] };
      }
      return { ...a, messages: [...a.messages, message], conversations: convs };
    }),
  })),

  addConversation: (agentId, lead) => set((state) => ({
    agents: state.agents.map((a) => {
      if (a.id !== agentId) return a;
      const conv: Conversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        lead,
        messages: [],
        startedAt: new Date(),
      };
      return {
        ...a,
        conversations: [...a.conversations, conv],
        currentLead: a.currentLead || lead,
        activeConversations: a.conversations.length + 1,
      };
    }),
  })),

  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 50),
  })),

  updateAgentStatus: (agentId, status) => set((state) => ({
    agents: state.agents.map((a) =>
      a.id === agentId ? { ...a, status } : a
    ),
  })),

  updateMetrics: (partial) => set((state) => ({
    metrics: { ...state.metrics, ...partial },
  })),

  setWhatsappStatus: (status) => set({ whatsappStatus: status }),

  setSimulationEnabled: (enabled) => set({ simulationEnabled: enabled }),

  incrementMetric: (key, amount = 1) => set((state) => ({
    metrics: {
      ...state.metrics,
      [key]: (state.metrics[key] as number) + amount,
    },
  })),
}));
