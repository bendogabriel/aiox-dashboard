import { useState, useRef, useEffect, useMemo } from 'react';
import { SmartMessageList } from './VirtualizedMessageList';
import { ChatInput } from './ChatInput';
import type { SlashCommand } from './SlashCommandMenu';
import { ChatConversationPanel } from './ChatConversationPanel';
import { ChatHeader } from './ChatHeader';
import { WelcomeMessage } from './WelcomeMessage';
import { EmptyChat } from './EmptyChat';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useRegistryTasks, useRegistryWorkflows } from '../../hooks/useEngine';
import { ORCHESTRATION_TRIGGERS } from './chat-types';

export function ChatContainer() {
  const {
    activeSession,
    selectedAgent,
    isAgentLoading,
    isStreaming,
    sendMessage,
    stopStreaming,
  } = useChat();
  const { sessions, activeSessionId, setActiveSession, deleteSession } = useChatStore();
  const { selectedAgentId, setCurrentView } = useUIStore();
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);

  // Fetch squad tasks/workflows for dynamic slash commands
  const squadId = selectedAgent?.squad;
  const { data: tasksData } = useRegistryTasks(squadId || undefined);
  const { data: workflowsData } = useRegistryWorkflows(squadId || undefined);

  // Build dynamic slash commands from agent commands + squad tasks/workflows
  const agentSlashCommands = useMemo<SlashCommand[]>(() => {
    const cmds: SlashCommand[] = [];

    // Agent-level commands (from YAML/markdown)
    if (selectedAgent?.commands) {
      for (const cmd of selectedAgent.commands) {
        cmds.push({
          command: cmd.command.startsWith('*') ? `/${cmd.command.slice(1)}` : `/${cmd.command}`,
          label: cmd.command.replace(/^\*/, ''),
          description: cmd.description || cmd.action || '',
          icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', // zap
          category: 'agent',
        });
      }
    }

    // Squad tasks
    if (tasksData?.tasks) {
      for (const task of tasksData.tasks) {
        cmds.push({
          command: `/${task.id}`,
          label: task.name || task.id,
          description: task.purpose || `Task: ${task.name}`,
          icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', // check-square
          category: 'workflow',
        });
      }
    }

    // Squad workflows
    if (workflowsData?.workflows) {
      for (const wf of workflowsData.workflows) {
        cmds.push({
          command: `/${wf.id}`,
          label: wf.name || wf.id,
          description: wf.description || `Workflow: ${wf.name}`,
          icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // layers
          category: 'workflow',
        });
      }
    }

    return cmds;
  }, [selectedAgent?.commands, tasksData, workflowsData]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(gap > 200);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(sessionId);
      useUIStore.setState({
        selectedSquadId: session.squadId,
        selectedAgentId: session.agentId,
      });
    }
  };

  const handleNewChat = () => {
    useUIStore.setState({ selectedAgentId: null, selectedSquadId: null });
    useChatStore.getState().setActiveSession(null);
  };

  // Show loading while agent data is being fetched (prevents flash of EmptyChat)
  if (!selectedAgent && isAgentLoading && selectedAgentId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--aiox-lime)] border-t-transparent rounded-full" />
      </div>
    );
  }

  // No agent selected — show EmptyChat with conversation sidebar if sessions exist
  if (!selectedAgent) {
    if (sessions.length > 0) {
      return (
        <div className="h-full flex">
          <ChatConversationPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            isOpen={chatSidebarOpen}
            onToggle={() => setChatSidebarOpen(!chatSidebarOpen)}
            onSelectSession={handleSelectSession}
            onDeleteSession={deleteSession}
            onNewChat={handleNewChat}
          />
          <div className="flex-1 min-w-0">
            <EmptyChat />
          </div>
        </div>
      );
    }
    return <EmptyChat />;
  }

  return (
    <div className="h-full flex">
      {/* Conversation Sidebar */}
      <ChatConversationPanel
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={chatSidebarOpen}
        onToggle={() => setChatSidebarOpen(!chatSidebarOpen)}
        onSelectSession={handleSelectSession}
        onDeleteSession={deleteSession}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <ChatHeader
          agent={selectedAgent}
          session={activeSession}
          chatSidebarOpen={chatSidebarOpen}
          onToggleSidebar={() => setChatSidebarOpen(!chatSidebarOpen)}
        />

        {/* Messages Area */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto glass-scrollbar px-4 md:px-6 py-4 relative">
          {activeSession?.messages && activeSession.messages.length > 0 ? (
            <div className="min-h-full flex flex-col justify-end">
              <SmartMessageList
                messages={activeSession.messages}
                virtualizationThreshold={50}
              />
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <WelcomeMessage agent={selectedAgent} />
          )}

          {/* Scroll to bottom floating button */}
          {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white/70 hover:text-white text-xs transition-colors shadow-lg"
                title="Ir para o final"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="7 13 12 18 17 13" />
                  <polyline points="7 6 12 11 17 6" />
                </svg>
                Novas mensagens
              </button>
            )}
</div>

        {/* Input Area */}
        <div className="p-4 pt-0">
          <ChatInput
            onSend={(message, attachments) => {
              // Detect orchestration commands and redirect to TaskOrchestrator
              if (ORCHESTRATION_TRIGGERS.some(re => re.test(message.trim()))) {
                const demand = message.replace(/^(\/orquestrar|\/orchestrate|@bob)\s*/i, '').trim();
                setCurrentView('bob');
                if (demand) {
                  sessionStorage.setItem('orchestration-demand', demand);
                }
                // Store originating session ID so results can be injected back
                if (activeSessionId) {
                  sessionStorage.setItem('orchestration-source-session', activeSessionId);
                }
                return;
              }
              sendMessage(message, attachments);
            }}
            onStop={stopStreaming}
            disabled={isStreaming}
            isStreaming={isStreaming}
            agentName={selectedAgent.name}
            agentCommands={agentSlashCommands}
          />
        </div>
      </div>

    </div>
  );
}
