import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { CockpitButton } from '../ui';
import { useChat } from '../../hooks/useChat';
import { engineApi } from '../../services/api/engine';
import { cn } from '../../lib/utils';
import { useEngineStore } from '../../stores/engineStore';
import type { AgentCommand } from '../../types';
import type { AgentAction, ChatAgent } from './chat-types';

interface SquadCommand {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'workflow';
  file: string;
}

type TabType = 'actions' | 'commands' | 'prompts' | 'tasks' | 'workflows';

interface CommandsModalProps {
  agent: ChatAgent;
  isOpen: boolean;
  onClose: () => void;
}

export function CommandsModal({ agent, isOpen, onClose }: CommandsModalProps) {
  const { sendMessage } = useChat();
  const [activeTab, setActiveTab] = useState<TabType>('commands');
  const engineStatus = useEngineStore((s) => s.status);

  // Fetch squad tasks and workflows from engine
  const { data: squadCommands, isLoading } = useQuery<{ tasks: SquadCommand[]; workflows: SquadCommand[] }>({
    queryKey: ['squad-commands', agent.squad, engineStatus],
    queryFn: async () => {
      if (engineStatus !== 'online') return { tasks: [], workflows: [] };
      try {
        const [tasksRes, workflowsRes] = await Promise.all([
          engineApi.getRegistryTasks(agent.squad),
          engineApi.getRegistryWorkflows(agent.squad),
        ]);
        return {
          tasks: (tasksRes.tasks || []).map(t => ({
            id: t.id,
            name: t.name,
            description: t.purpose || t.name,
            type: 'task' as const,
            file: t.file,
          })),
          workflows: (workflowsRes.workflows || []).map(w => ({
            id: w.id,
            name: w.name,
            description: w.description || w.name,
            type: 'workflow' as const,
            file: w.file,
          })),
        };
      } catch {
        return { tasks: [], workflows: [] };
      }
    },
    enabled: isOpen && !!agent.squad,
  });

  // Agent-level data
  const agentActions = agent.actions || [];
  const agentCommands = agent.commands || [];
  const agentPrompts = agent.sampleTasks || [];

  // Squad-level data
  const tasks = squadCommands?.tasks || [];
  const workflows = squadCommands?.workflows || [];

  const handleUseCommand = (command: string) => {
    sendMessage(command);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    isOpen ? (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/90 z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto">
            <div
              className="flex flex-col max-h-[85vh] rounded-none border border-white/10 shadow-2xl overflow-hidden"
              style={{
                background: 'rgba(20, 20, 30, 1)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Ações & Comandos</h2>
                  <p className="text-xs text-tertiary">{agent.name} • {agent.squad}</p>
                </div>
                <CockpitButton variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </CockpitButton>
              </div>

              {/* Tabs - Alphabetical order */}
              <div className="flex border-b border-white/10 overflow-x-auto" role="tablist" aria-label="Abas de informacoes do agente">
                {/* Ações */}
                <TabButton
                  active={activeTab === 'actions'}
                  onClick={() => setActiveTab('actions')}
                  count={agentActions.length}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Ações
                </TabButton>

                {/* Comandos */}
                <TabButton
                  active={activeTab === 'commands'}
                  onClick={() => setActiveTab('commands')}
                  count={agentCommands.length}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </svg>
                  Comandos
                </TabButton>

                {/* Prompts */}
                <TabButton
                  active={activeTab === 'prompts'}
                  onClick={() => setActiveTab('prompts')}
                  count={agentPrompts.length}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Prompts
                </TabButton>

                {/* Tasks */}
                <TabButton
                  active={activeTab === 'tasks'}
                  onClick={() => setActiveTab('tasks')}
                  count={tasks.length}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  Tasks
                </TabButton>

                {/* Workflows */}
                <TabButton
                  active={activeTab === 'workflows'}
                  onClick={() => setActiveTab('workflows')}
                  count={workflows.length}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="5" r="3" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="6" cy="19" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="12" y1="12" x2="6" y2="16" />
                    <line x1="12" y1="12" x2="18" y2="16" />
                  </svg>
                  Workflows
                </TabButton>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto glass-scrollbar p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-tertiary">
                    <div className="animate-spin h-6 w-6 border-2 border-[var(--aiox-blue)] border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm">Carregando...</p>
                  </div>
                ) : (
                  <>
                    {/* Ações Tab */}
                    {activeTab === 'actions' && (
                      <div className="space-y-2">
                        {agentActions.length === 0 ? (
                          <ModalEmptyState message="Nenhuma ação definida para este agent" />
                        ) : (
                          agentActions.map((action: AgentAction, index: number) => (
                            <CommandItem
                              key={index}
                              command={action.name}
                              description={action.description || action.trigger || ''}
                              type="action"
                              onUse={() => handleUseCommand(action.description || action.name)}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {/* Comandos Tab */}
                    {activeTab === 'commands' && (
                      <div className="space-y-2">
                        {agentCommands.length === 0 ? (
                          <ModalEmptyState message="Nenhum comando definido para este agent" />
                        ) : (
                          agentCommands.map((cmd: AgentCommand, index: number) => (
                            <CommandItem
                              key={index}
                              command={cmd.command}
                              description={cmd.description || ''}
                              type="command"
                              onUse={() => handleUseCommand(cmd.command)}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {/* Prompts Tab */}
                    {activeTab === 'prompts' && (
                      <div className="space-y-2">
                        {agentPrompts.length === 0 ? (
                          <ModalEmptyState message="Nenhum prompt sugerido para este agent" />
                        ) : (
                          agentPrompts.map((prompt: string, index: number) => (
                            <CommandItem
                              key={index}
                              command={prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '')}
                              description={prompt}
                              type="prompt"
                              onUse={() => handleUseCommand(prompt)}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                      <div className="space-y-2">
                        {tasks.length === 0 ? (
                          <ModalEmptyState message="Nenhuma task definida para este squad" />
                        ) : (
                          tasks.map((task) => (
                            <CommandItem
                              key={task.id}
                              command={`*${task.id}`}
                              description={task.description || task.name}
                              type="task"
                              onUse={() => handleUseCommand(`*${task.id}`)}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {/* Workflows Tab */}
                    {activeTab === 'workflows' && (
                      <div className="space-y-2">
                        {workflows.length === 0 ? (
                          <ModalEmptyState message="Nenhum workflow definido para este squad" />
                        ) : (
                          workflows.map((workflow) => (
                            <CommandItem
                              key={workflow.id}
                              command={`@workflow:${workflow.id}`}
                              description={workflow.description || workflow.name}
                              type="workflow"
                              onUse={() => handleUseCommand(`@workflow:${workflow.id}`)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5">
                <p className="text-xs text-tertiary text-center">
                  Clique em um item para usá-lo na conversa
                </p>
              </div>
            </div>
            </div>
          </div>
        </>
    ) : null,
    document.body
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
        active
          ? 'text-[var(--aiox-cream,#E5E5E5)] border-b-2 border-[var(--aiox-cream,#E5E5E5)] bg-white/5'
          : 'text-tertiary hover:text-secondary hover:bg-white/5'
      )}
    >
      {children}
      {count > 0 && (
        <span className={cn(
          'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
          active ? 'bg-white/15 text-[var(--aiox-cream,#E5E5E5)]' : 'bg-white/10 text-tertiary'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function CommandItem({
  command,
  description,
  type,
  onUse,
}: {
  command: string;
  description: string;
  type: 'action' | 'command' | 'prompt' | 'task' | 'workflow';
  onUse: () => void;
}) {
  const typeColors: Record<string, string> = {
    action: 'bg-white/10 border-white/20 text-[var(--aiox-cream,#E5E5E5)]',
    command: 'bg-[var(--aiox-blue)]/10 border-[var(--aiox-blue)]/20 text-[var(--aiox-blue)]',
    prompt: 'bg-[#BDBDBD]/10 border-[#BDBDBD]/20 text-[#BDBDBD]',
    task: 'bg-[#ED4609]/10 border-[#ED4609]/20 text-[#ED4609]',
    workflow: 'bg-[var(--aiox-blue)]/10 border-[var(--aiox-blue)]/20 text-[var(--aiox-blue)]',
  };

  const typeLabels: Record<string, string> = {
    action: 'AÇÃO',
    command: 'CMD',
    prompt: 'PROMPT',
    task: 'TASK',
    workflow: 'FLOW',
  };

  return (
    <button
      onClick={onUse}
      className="w-full flex items-start gap-3 p-3 rounded-none border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left group"
    >
      <span className={cn(
        'px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 mt-0.5',
        typeColors[type]
      )}>
        {typeLabels[type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono text-primary group-hover:text-[var(--aiox-cream,#E5E5E5)] transition-colors">
          {command}
        </p>
        {description && (
          <p className="text-xs text-tertiary mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-tertiary group-hover:text-[var(--aiox-cream,#E5E5E5)] flex-shrink-0 mt-1 transition-colors"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function ModalEmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="mx-auto text-tertiary mb-3"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm text-tertiary">{message}</p>
    </div>
  );
}
