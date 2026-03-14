import { useCallback, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import { useToastStore } from '../stores/toastStore';
import { useFavoritesStore } from './useFavorites';
import { useAgentById, type AgentWithUI } from './useAgents';
import { useExecuteAgent } from './useExecute';
import type { AgentSummary, MessageAttachment } from '../types';
import { getSquadType as getSquadTypeUtil } from '../types';

export function useChat() {
  const { selectedAgentId, selectedSquadId } = useUIStore();

  // Compute effective IDs: UIStore (in-memory) takes priority,
  // falls back to persisted session data (survives page reload).
  // Uses getState() (non-hook) to keep hook call order stable.
  let effectiveAgentId = selectedAgentId;
  let effectiveSquadId = selectedSquadId;
  if (!effectiveAgentId) {
    const { sessions, activeSessionId: storedSessionId } = useChatStore.getState();
    const storedSession = storedSessionId ? sessions.find(s => s.id === storedSessionId) : null;
    if (storedSession?.agentId) {
      effectiveAgentId = storedSession.agentId;
      effectiveSquadId = storedSession.squadId;
    }
  }

  // Hook order preserved: useUIStore → useAgentById → useChatStore → useExecuteAgent
  const { data: fetchedAgent, isLoading: isAgentLoading } = useAgentById(effectiveAgentId, effectiveSquadId);

  const {
    sessions,
    activeSessionId,
    isLoading,
    isStreaming,
    error,
    createSession,
    setActiveSession,
    getActiveSession,
    getSessionByAgent,
    deleteSession,
    clearSessions,
    setError,
    stopStreaming,
  } = useChatStore();

  const executeMutation = useExecuteAgent();

  const activeSession = getActiveSession();

  // Build selectedAgent: API data first, then session fallback
  const selectedAgent = useMemo<AgentWithUI | null>(() => {
    if (fetchedAgent) return fetchedAgent;
    // Fallback: use session data as agent info even while loading
    // (handles page reload, renamed/removed agents, API loading race)
    if (activeSession?.agentId) {
      return {
        id: activeSession.agentId,
        name: activeSession.agentName || activeSession.agentId,
        squad: activeSession.squadId,
        squadType: activeSession.squadType || getSquadTypeUtil(activeSession.squadId),
        tier: 2 as const,
        role: isAgentLoading ? 'Loading...' : 'Agent (offline)',
        status: isAgentLoading ? 'busy' as const : 'offline' as const,
      };
    }
    return null;
  }, [fetchedAgent, isAgentLoading, activeSession]);

  const selectAgent = useCallback(
    (agent: AgentSummary) => {
      console.log('[useChat.selectAgent] Selecting agent:', agent.id);

      // Check if there's already a session for this agent
      const existingSession = getSessionByAgent(agent.id);
      const squadType = getSquadTypeUtil(agent.squad);

      if (existingSession) {
        console.log('[useChat.selectAgent] Using existing session:', existingSession.id);
        setActiveSession(existingSession.id);
      } else {
        // Create new session
        console.log('[useChat.selectAgent] Creating new session');
        const newSessionId = createSession(agent.id, agent.name, agent.squad, squadType);
        console.log('[useChat.selectAgent] New session created:', newSessionId);
      }

      // Update UI store - set both values atomically to avoid clearing agentId
      useUIStore.setState({
        selectedSquadId: agent.squad,
        selectedAgentId: agent.id
      });

      // Add to recents
      useFavoritesStore.getState().addRecent({
        id: agent.id,
        name: agent.name,
        squad: agent.squad,
      });
    },
    [createSession, getSessionByAgent, setActiveSession]
  );

  const sendMessage = useCallback(
    async (content: string, attachments?: MessageAttachment[]) => {
      // Get latest state directly from store to avoid stale closure
      const chatState = useChatStore.getState();
      const currentSessionId = chatState.activeSessionId;
      const currentIsStreaming = chatState.isStreaming;

      // Resolve agent/squad from selectedAgent, falling back to session data
      const session = currentSessionId
        ? chatState.sessions.find(s => s.id === currentSessionId)
        : null;
      const agentId = selectedAgent?.id || session?.agentId;
      const agentName = selectedAgent?.name || session?.agentName || agentId || '';
      const squadId = selectedAgent?.squad || session?.squadId;

      console.log('[useChat.sendMessage] Called with:', {
        content,
        attachments: attachments?.length || 0,
        agentId,
        squadId,
        activeSessionId: currentSessionId,
        isStreaming: currentIsStreaming
      });

      // squadId is optional for core agents (e.g. aios-qa, aios-dev) that have no squad
      if (!agentId || !currentSessionId || currentIsStreaming) {
        console.log('[useChat.sendMessage] Early return - missing:', {
          agentId, squadId,
          hasSession: !!currentSessionId,
          isStreaming: currentIsStreaming
        });
        return;
      }

      // Sync UIStore if it fell out of sync (e.g. after page reload)
      const uiState = useUIStore.getState();
      if (!uiState.selectedAgentId || !uiState.selectedSquadId) {
        useUIStore.setState({ selectedAgentId: agentId, selectedSquadId: squadId });
      }

      const squadType = squadId ? getSquadTypeUtil(squadId) : ('default' as ReturnType<typeof getSquadTypeUtil>);
      const { addToast } = useToastStore.getState();

      setError(null);

      console.log('[useChat.sendMessage] Executing mutation with sessionId:', currentSessionId);
      try {
        await executeMutation.mutateAsync({
          sessionId: currentSessionId,
          squadId: squadId || 'core',
          agentId,
          agentName,
          squadType,
          message: content,
          attachments,
          stream: true,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        addToast({
          type: 'error',
          title: 'Erro ao enviar mensagem',
          message: errorMessage,
        });
      }
    },
    [selectedAgent, executeMutation, setError]
  );

  return {
    // State
    sessions,
    activeSession,
    activeSessionId,
    selectedAgent,
    isAgentLoading,
    isLoading,
    isStreaming,
    error,

    // Actions
    selectAgent,
    sendMessage,
    stopStreaming,
    setActiveSession,
    deleteSession,
    clearSessions,
  };
}
