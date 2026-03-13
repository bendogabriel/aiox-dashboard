/**
 * RunningTasksIndicator — Global floating indicator showing active orchestrations.
 * Mounted at app root, visible from any screen.
 * Allows switching to any running task or navigating to the orchestrator.
 */
import { useState } from 'react';
import { Loader2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { useOrchestrationStore } from '../../stores/orchestrationStore';
import { useUIStore } from '../../stores/uiStore';
import { formatDuration } from './orchestration-types';

export function RunningTasksIndicator() {
  const taskMap = useOrchestrationStore((s) => s.taskMap);
  const activeTaskId = useOrchestrationStore((s) => s.activeTaskId);
  const currentView = useUIStore((s) => s.currentView);
  const [expanded, setExpanded] = useState(false);

  // Get all non-terminal tasks
  const runningTasks = Object.values(taskMap).filter((t) =>
    ['analyzing', 'planning', 'awaiting_approval', 'executing'].includes(t.status)
  );

  // Don't show if no running tasks or already on bob view
  if (runningTasks.length === 0 || currentView === 'bob') return null;

  const statusEmoji: Record<string, string> = {
    analyzing: '[...]',
    planning: '[PLN]',
    awaiting_approval: '[WAT]',
    executing: '[RUN]',
  };

  const statusLabel: Record<string, string> = {
    analyzing: 'Analisando',
    planning: 'Planejando',
    awaiting_approval: 'Aguardando',
    executing: 'Executando',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-200">
      <div className="bg-[var(--aiox-surface,#0a0a0a)] border border-white/15 overflow-hidden min-w-[280px]">
        {/* Header — always visible */}
        <button
          onClick={() => runningTasks.length > 1 ? setExpanded(!expanded) : navigateToBob(runningTasks[0]?.taskId)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="relative">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent,#D1FF00)]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-white">
              {runningTasks.length === 1
                ? truncate(runningTasks[0].demand, 40)
                : `${runningTasks.length} orquestrações ativas`}
            </p>
            <p className="text-[10px] text-white/40">
              {runningTasks.length === 1
                ? statusLabel[runningTasks[0].status] || runningTasks[0].status
                : runningTasks.map((t) => statusEmoji[t.status] || '').join(' ')}
            </p>
          </div>
          {runningTasks.length > 1 ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-white/40" />
            )
          ) : (
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          )}
        </button>

        {/* Expanded task list */}
        {expanded && runningTasks.length > 1 && (
          <div className="border-t border-white/10">
              <div className="max-h-[200px] overflow-auto">
                {runningTasks.map((task) => {
                  const isActive = task.taskId === activeTaskId;
                  const elapsed = task.startTime ? Date.now() - task.startTime : 0;
                  return (
                    <button
                      key={task.taskId}
                      onClick={() => navigateToBob(task.taskId)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${
                        isActive ? 'bg-white/5' : ''
                      }`}
                    >
                      <span className="text-sm">{statusEmoji[task.status] || '[...]'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/80 truncate">
                          {truncate(task.demand, 35)}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] text-white/40">
                          <span>{statusLabel[task.status]}</span>
                          {elapsed > 0 && <span>{formatDuration(elapsed)}</span>}
                          {task.agentOutputs.length > 0 && (
                            <span>{task.agentOutputs.length} outputs</span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent,#D1FF00)]" />
                      )}
                    </button>
                  );
                })}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function navigateToBob(taskId: string | null) {
  if (taskId) {
    useOrchestrationStore.getState().setActiveTask(taskId);
  }
  useUIStore.getState().setCurrentView('bob');
}
