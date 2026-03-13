import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../ui';
import { useChat } from '../../hooks/useChat';
import { engineApi } from '../../services/api/engine';
import { cn } from '../../lib/utils';
import { useEngineStore } from '../../stores/engineStore';
import { ActionIcon, CommandIcon, PromptIcon, TaskIcon, WorkflowIcon } from './activity-panel-icons';
import type { AgentWithUI } from '../../hooks/useAgents';
import type { AgentAction } from './activity-panel-types';

export interface SquadCommand {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'workflow';
  file: string;
}

export function AgentCommandsPanel({ agent }: { agent: AgentWithUI & { actions?: AgentAction[] } }) {
  const { sendMessage } = useChat();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const engineStatus = useEngineStore((s) => s.status);

  // Fetch squad tasks and workflows from engine
  const { data: squadCommands } = useQuery<{ tasks: SquadCommand[]; workflows: SquadCommand[] }>({
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
    enabled: !!agent.squad,
  });

  // Agent-level data
  const agentActions = agent.actions || [];
  const agentCommands = agent.commands || [];
  const agentPrompts = agent.sampleTasks || [];

  // Squad-level data
  const tasks = squadCommands?.tasks || [];
  const workflows = squadCommands?.workflows || [];

  const handleUse = (command: string) => {
    sendMessage(command);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Command categories configuration
  const categories: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    items: unknown[];
    color: string;
    getCommand: (item: unknown) => string;
    getLabel: (item: unknown) => string;
    getDescription: (item: unknown) => string | null | undefined;
  }> = [
    {
      id: 'actions',
      label: 'Ações',
      icon: <ActionIcon />,
      items: agentActions,
      color: 'yellow',
      getCommand: (item: unknown) => { const a = item as AgentAction; return a.description || a.name; },
      getLabel: (item: unknown) => (item as AgentAction).name,
      getDescription: (item: unknown) => (item as AgentAction).trigger,
    },
    {
      id: 'commands',
      label: 'Comandos',
      icon: <CommandIcon />,
      items: agentCommands,
      color: 'purple',
      getCommand: (item: unknown) => (item as { command: string }).command,
      getLabel: (item: unknown) => (item as { command: string }).command,
      getDescription: (item: unknown) => (item as { description?: string }).description,
    },
    {
      id: 'prompts',
      label: 'Prompts',
      icon: <PromptIcon />,
      items: agentPrompts,
      color: 'green',
      getCommand: (item: unknown) => item as string,
      getLabel: (item: unknown) => { const s = item as string; return s.slice(0, 40) + (s.length > 40 ? '...' : ''); },
      getDescription: () => null,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <TaskIcon />,
      items: tasks,
      color: 'orange',
      getCommand: (item: unknown) => `*${(item as SquadCommand).id}`,
      getLabel: (item: unknown) => { const c = item as SquadCommand; return c.name || c.id; },
      getDescription: (item: unknown) => (item as SquadCommand).description,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: <WorkflowIcon />,
      items: workflows,
      color: 'cyan',
      getCommand: (item: unknown) => `@workflow:${(item as SquadCommand).id}`,
      getLabel: (item: unknown) => { const c = item as SquadCommand; return c.name || c.id; },
      getDescription: (item: unknown) => (item as SquadCommand).description,
    },
  ];

  const colorClasses: Record<string, string> = {
    yellow: 'bg-[var(--bb-warning)]/10 border-[var(--bb-warning)]/20 text-[var(--bb-warning)] hover:bg-[var(--bb-warning)]/20',
    purple: 'bg-[var(--aiox-gray-muted)]/10 border-[var(--aiox-gray-muted)]/20 text-[var(--aiox-gray-muted)] hover:bg-[var(--aiox-gray-muted)]/20',
    green: 'bg-[var(--color-status-success)]/10 border-[var(--color-status-success)]/20 text-[var(--color-status-success)] hover:bg-[var(--color-status-success)]/20',
    orange: 'bg-[var(--bb-flare)]/10 border-[var(--bb-flare)]/20 text-[var(--bb-flare)] hover:bg-[var(--bb-flare)]/20',
    cyan: 'bg-[var(--aiox-blue)]/10 border-[var(--aiox-blue)]/20 text-[var(--aiox-blue)] hover:bg-[var(--aiox-blue)]/20',
  };

  const totalItems = agentActions.length + agentCommands.length + agentPrompts.length + tasks.length + workflows.length;

  if (totalItems === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-tertiary text-xs">Nenhum comando disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        if (category.items.length === 0) return null;

        const isExpanded = expandedCategories[category.id];
        const hasMore = category.items.length > 3;
        const displayItems = isExpanded ? category.items : category.items.slice(0, 3);

        return (
          <div key={category.id}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('p-1 rounded', colorClasses[category.color])}>
                {category.icon}
              </span>
              <span className="text-xs font-medium text-secondary">{category.label}</span>
              <Badge variant="count" size="sm">{category.items.length}</Badge>
            </div>

            {/* Category Items */}
            <div className="space-y-1.5">
              {displayItems.map((item: unknown, index: number) => (
                  <button
                    key={index}

                    onClick={() => handleUse(category.getCommand(item))}
                    className={cn(
                      'w-full text-left p-2 rounded-lg border transition-colors',
                      colorClasses[category.color]
                    )}
                  >
                    <p className="text-xs font-medium text-primary truncate">
                      {category.getLabel(item)}
                    </p>
                    {category.getDescription(item) && (
                      <p className="text-[10px] text-tertiary truncate mt-0.5">
                        {category.getDescription(item)}
                      </p>
                    )}
                  </button>
                ))}
{/* Expand/Collapse Button */}
              {hasMore && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-[10px] text-tertiary hover:text-secondary text-center py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      +{category.items.length - 3} mais
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
