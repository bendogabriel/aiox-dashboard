import { create } from 'zustand';

export interface MonitorEvent {
  id: string;
  timestamp: string;
  type: 'tool_call' | 'message' | 'error' | 'system';
  agent: string;
  description: string;
  duration?: number;
  success?: boolean;
}

interface MonitorState {
  connected: boolean;
  events: MonitorEvent[];
  currentTool: { name: string; startedAt: string } | null;
  stats: {
    total: number;
    successRate: number;
    errorCount: number;
    activeSessions: number;
  };
  addEvent: (event: MonitorEvent) => void;
  clearEvents: () => void;
  setConnected: (connected: boolean) => void;
  setCurrentTool: (tool: { name: string; startedAt: string } | null) => void;
}

// Generate mock events with timestamps within last 5 minutes
function generateMockEvents(): MonitorEvent[] {
  const now = Date.now();
  const events: Omit<MonitorEvent, 'id' | 'timestamp'>[] = [
    { type: 'system', agent: 'SYNAPSE', description: 'Engine initialized — 8 layers loaded', success: true },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Read src/components/ui/GlassCard.tsx', duration: 45, success: true },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Grep "StatusDot" in src/', duration: 120, success: true },
    { type: 'message', agent: 'AIOS Dev', description: 'Starting implementation of TerminalCard component' },
    { type: 'tool_call', agent: 'AIOS QA', description: 'Bash: npm run typecheck', duration: 3200, success: true },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Write src/components/terminals/TerminalCard.tsx', duration: 89, success: true },
    { type: 'system', agent: 'IDS', description: 'Gate G3 passed — architecture validation OK', success: true },
    { type: 'error', agent: 'AIOS QA', description: 'Test failed: useChat.test.ts — timeout exceeded', success: false },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Edit src/hooks/useChat.ts — fix timeout handling', duration: 156, success: true },
    { type: 'tool_call', agent: 'AIOS QA', description: 'Bash: npm run test -- --reporter=verbose', duration: 8500, success: true },
    { type: 'message', agent: 'AIOS Architect', description: 'Reviewing component hierarchy for Phase 4' },
    { type: 'tool_call', agent: 'AIOS DevOps', description: 'Bash: git status --short', duration: 210, success: true },
    { type: 'system', agent: 'SYNAPSE', description: 'L2 agent context injected for aios-dev', success: true },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Glob **/*.test.ts in src/', duration: 35, success: true },
    { type: 'tool_call', agent: 'AIOS PM', description: 'Read docs/stories/story-4.1.md', duration: 62, success: true },
    { type: 'message', agent: 'AIOS PM', description: 'Story AIOS-42 progress updated to 75%' },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Write src/stores/monitorStore.ts', duration: 78, success: true },
    { type: 'error', agent: 'AIOS Dev', description: 'Lint warning: unused import in TerminalsView.tsx', success: false },
    { type: 'tool_call', agent: 'AIOS Dev', description: 'Edit src/components/terminals/TerminalsView.tsx — remove unused import', duration: 23, success: true },
    { type: 'system', agent: 'COA', description: 'Campaign optimization analysis scheduled for 08:00 BRT', success: true },
  ];

  return events.map((evt, i) => ({
    ...evt,
    id: `evt-${i + 1}`,
    // Spread events across last 5 minutes (300s), oldest first
    timestamp: new Date(now - (events.length - i) * 15000).toISOString(),
  }));
}

const mockEvents = generateMockEvents();

const errorCount = mockEvents.filter((e) => e.type === 'error').length;
const toolCalls = mockEvents.filter((e) => e.type === 'tool_call');
const successfulTools = toolCalls.filter((e) => e.success);

export const useMonitorStore = create<MonitorState>((set) => ({
  connected: true,
  events: mockEvents,
  currentTool: { name: 'Edit', startedAt: new Date(Date.now() - 2400).toISOString() },
  stats: {
    total: mockEvents.length,
    successRate: toolCalls.length > 0
      ? Math.round((successfulTools.length / toolCalls.length) * 100)
      : 100,
    errorCount,
    activeSessions: 6,
  },

  addEvent: (event) =>
    set((state) => {
      const newEvents = [...state.events, event].slice(-50);
      const newErrorCount = newEvents.filter((e) => e.type === 'error').length;
      const newToolCalls = newEvents.filter((e) => e.type === 'tool_call');
      const newSuccessful = newToolCalls.filter((e) => e.success);
      return {
        events: newEvents,
        stats: {
          ...state.stats,
          total: newEvents.length,
          errorCount: newErrorCount,
          successRate: newToolCalls.length > 0
            ? Math.round((newSuccessful.length / newToolCalls.length) * 100)
            : 100,
        },
      };
    }),

  clearEvents: () =>
    set({
      events: [],
      stats: { total: 0, successRate: 100, errorCount: 0, activeSessions: 6 },
    }),

  setConnected: (connected) => set({ connected }),

  setCurrentTool: (tool) => set({ currentTool: tool }),
}));
