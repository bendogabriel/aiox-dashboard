/**
 * OrchestrationManager — Singleton that manages SSE connections for orchestration tasks.
 * Lives outside React component lifecycle, persists across route changes.
 * Handles: SSE connections, event processing, store updates, side effects.
 */
import { useOrchestrationStore } from '../stores/orchestrationStore';
import { useToastStore } from '../stores/toastStore';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import { supabaseTasksService } from './supabase/tasks';
import { supabaseArtifactsService } from './supabase/artifacts';
import { formatOrchestrationSummary } from '../lib/taskExport';
import type { Task, TaskArtifact } from './api/tasks';
import type {
  AgentOutput,
  StreamingOutput,
  ExecutionPlan,
  ExecutionPlanStep,
  TaskEvent,
} from '../components/orchestration/orchestration-types';
import type { OrchestrationTaskState } from '../stores/orchestrationStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const SSE_EVENTS = [
  'task:state',
  'task:analyzing',
  'task:squads-selected',
  'task:planning',
  'task:plan-ready',
  'task:squad-planned',
  'task:workflow-created',
  'task:executing',
  'step:started',
  'step:completed',
  'step:streaming:start',
  'step:streaming:chunk',
  'step:streaming:end',
  'task:completed',
  'task:failed',
];

class OrchestrationManager {
  private connections = new Map<string, EventSource>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private reconnectAttempts = new Map<string, number>();
  private catchUpTimers = new Map<string, ReturnType<typeof setInterval>>();

  // ─── Public API ────────────────────────────────────────────

  /** Submit a new task and start SSE stream */
  async submitTask(demand: string): Promise<string> {
    const store = useOrchestrationStore.getState();

    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demand }),
    });

    if (!response.ok) throw new Error('Failed to create task');

    const data = await response.json();
    const taskId = data.taskId as string;

    // Create task in store
    store.updateTask(taskId, {
      taskId,
      status: 'analyzing',
      demand,
      startTime: Date.now(),
      selectedSquads: [],
      squadSelections: [],
      workflowId: null,
      workflowSteps: [],
      currentStep: null,
      agentOutputs: [],
      streamingOutputs: [],
      error: null,
      events: [],
      plan: null,
    });

    store.setActiveTask(taskId);
    this.connectToTask(taskId, demand);
    return taskId;
  }

  /** Connect SSE to an existing/running task */
  connectToTask(taskId: string, demand?: string) {
    // Close existing connection if any
    this.disconnectTask(taskId);

    const store = useOrchestrationStore.getState();
    const task = store.taskMap[taskId];
    const demandParam = encodeURIComponent(demand || task?.demand || '');

    const eventSource = new EventSource(
      `${API_BASE}/tasks/${taskId}/stream?demand=${demandParam}`
    );
    this.connections.set(taskId, eventSource);

    eventSource.onopen = () => {
      this.reconnectAttempts.set(taskId, 0);
    };

    SSE_EVENTS.forEach((eventType) => {
      eventSource.addEventListener(eventType, (e: MessageEvent) => {
        this.handleEvent(taskId, eventType, e);
      });
    });

    eventSource.onerror = () => {
      eventSource.close();
      this.connections.delete(taskId);
      this.stopCatchUpPolling(taskId);
      this.scheduleReconnect(taskId);
    };

    // Start catch-up polling to recover from missed SSE events (race condition)
    this.startCatchUpPolling(taskId);
  }

  /** Disconnect SSE for a specific task (does NOT remove from store) */
  disconnectTask(taskId: string) {
    const es = this.connections.get(taskId);
    if (es) {
      es.close();
      this.connections.delete(taskId);
    }
    const timer = this.reconnectTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(taskId);
    }
    this.stopCatchUpPolling(taskId);
  }

  /** Start periodic catch-up polling to detect missed SSE events */
  private startCatchUpPolling(taskId: string) {
    this.stopCatchUpPolling(taskId);
    const timer = setInterval(() => {
      const store = useOrchestrationStore.getState();
      const task = store.taskMap[taskId];
      if (!task || ['completed', 'failed', 'idle'].includes(task.status)) {
        this.stopCatchUpPolling(taskId);
        return;
      }
      // Poll backend for current status
      this.fetchTaskCatchUp(taskId);
    }, 3000); // Check every 3s
    this.catchUpTimers.set(taskId, timer);
  }

  /** Stop catch-up polling for a task */
  private stopCatchUpPolling(taskId: string) {
    const timer = this.catchUpTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.catchUpTimers.delete(taskId);
    }
  }

  /** Disconnect all SSE connections */
  disconnectAll() {
    for (const [taskId] of this.connections) {
      this.disconnectTask(taskId);
    }
  }

  /** Check if SSE is connected for a task */
  isConnected(taskId: string): boolean {
    const es = this.connections.get(taskId);
    return !!es && es.readyState !== EventSource.CLOSED;
  }

  /** Approve task execution plan */
  async approvePlan(taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/approve`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to approve plan');
  }

  /** Revise task execution plan */
  async revisePlan(taskId: string, feedback: string): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    if (!response.ok) throw new Error('Failed to revise plan');
    // Reset to planning state
    useOrchestrationStore.getState().updateTask(taskId, {
      status: 'planning',
      plan: null,
    });
  }

  /** Reconnect all non-terminal tasks (call after store rehydration or on mount) */
  reconnectActiveTasks() {
    const store = useOrchestrationStore.getState();
    for (const [taskId, task] of Object.entries(store.taskMap)) {
      if (
        task.taskId &&
        !['completed', 'failed', 'idle'].includes(task.status) &&
        !this.isConnected(taskId)
      ) {
        this.connectToTask(taskId, task.demand);
      }
    }
  }

  /** Get list of all running task IDs */
  getRunningTaskIds(): string[] {
    return Object.entries(useOrchestrationStore.getState().taskMap)
      .filter(([, t]) =>
        ['analyzing', 'planning', 'awaiting_approval', 'executing'].includes(t.status)
      )
      .map(([id]) => id);
  }

  // ─── SSE Event Processing ──────────────────────────────────

  private handleEvent(taskId: string, eventType: string, event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      const store = useOrchestrationStore.getState();
      const prev = store.taskMap[taskId];
      if (!prev) return;

      const newEvent: TaskEvent = {
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
      };

      const update: Partial<OrchestrationTaskState> = {
        events: [...prev.events, newEvent],
      };

      switch (eventType) {
        case 'task:state': {
          // Initial state from SSE — catch up if task progressed beyond our local state
          const serverStatus = data.status as string;
          const terminalStatuses = ['completed', 'failed'];
          const progressOrder = ['pending', 'started', 'analyzing', 'planning', 'awaiting_approval', 'executing', 'completed', 'failed'];
          const serverIdx = progressOrder.indexOf(serverStatus);
          const localIdx = progressOrder.indexOf(prev.status);

          if (terminalStatuses.includes(serverStatus) || (serverIdx > localIdx && serverIdx >= 0)) {
            // Server is ahead — fetch full task details to catch up
            this.fetchTaskCatchUp(taskId);
          }
          break;
        }

        case 'task:analyzing':
          update.status = 'analyzing';
          break;

        case 'task:squads-selected': {
          const rawSquads = (data.squads || []) as Array<
            | string
            | {
                squadId: string;
                chief: string;
                agentCount: number;
                agents?: Array<{ id: string; name: string }>;
              }
          >;
          // Backend may send either string[] or object[] — normalize both
          update.selectedSquads = rawSquads.map((s) =>
            typeof s === 'string' ? s : s.squadId
          );
          update.squadSelections = rawSquads
            .filter((s): s is { squadId: string; chief: string; agentCount: number; agents?: Array<{ id: string; name: string }> } =>
              typeof s !== 'string'
            )
            .map((sq) => ({
              squadId: sq.squadId,
              chief: sq.chief,
              agentCount: sq.agentCount,
              agents: sq.agents || [],
            }));
          break;
        }

        case 'task:planning':
          update.status = 'planning';
          break;

        case 'task:squad-planned': {
          const plannedSquadId = data.squadId as string;
          const newSelection = {
            squadId: plannedSquadId,
            chief: data.chief as string,
            agentCount: data.agentCount as number,
            agents: (data.agents as Array<{ id: string; name: string }>) || [],
          };
          // Ensure selectedSquads includes this squad
          if (!prev.selectedSquads.includes(plannedSquadId)) {
            update.selectedSquads = [...prev.selectedSquads, plannedSquadId];
          }
          // Replace existing entry for this squad (dedup) or append
          const existingIdx = prev.squadSelections.findIndex(
            (s) => s.squadId === plannedSquadId
          );
          if (existingIdx >= 0) {
            const updated = [...prev.squadSelections];
            updated[existingIdx] = newSelection;
            update.squadSelections = updated;
          } else {
            update.squadSelections = [...prev.squadSelections, newSelection];
          }
          break;
        }

        case 'task:workflow-created':
          update.workflowId = data.workflowId as string;
          update.workflowSteps = (data.steps || []) as Array<{ id: string; name: string }>;
          break;

        case 'task:plan-ready': {
          update.status = 'awaiting_approval';
          update.workflowId = (data.workflowId as string) || prev.workflowId;
          const rawSteps = (
            (data.plan as Record<string, unknown>)?.steps || data.steps || []
          ) as Array<{
            id: string;
            name?: string;
            agent?: { id: string; name: string; squad: string; title?: string };
            role?: string;
            task?: string;
            squadId?: string;
            agentId?: string;
            agentName?: string;
            squadName?: string;
            dependsOn?: string[];
            estimatedDuration?: string;
          }>;
          if (rawSteps.length > 0) {
            const planSteps: ExecutionPlanStep[] = rawSteps.map((s, i) => ({
              id: s.id || `step-${i + 1}`,
              squadId: s.squadId || s.agent?.squad || 'core',
              agentId: s.agentId || s.agent?.id || 'unknown',
              agentName: s.agentName || s.agent?.name || s.name || 'Agent',
              squadName: s.squadName || s.agent?.squad || 'core',
              task: s.task || s.name || s.role || 'Execute task',
              dependsOn:
                s.dependsOn || (i > 0 ? [rawSteps[i - 1].id || `step-${i}`] : []),
              estimatedDuration: s.estimatedDuration,
            }));
            const plan = data.plan as Record<string, unknown> | undefined;
            update.plan = {
              summary:
                (plan?.summary as string) ||
                `Plano com ${planSteps.length} steps`,
              reasoning: (plan?.reasoning as string) || '',
              steps: planSteps,
            } as ExecutionPlan;
            update.workflowSteps = rawSteps.map((s) => s.id || '') as unknown as Array<{ id: string; name: string }>;
          } else if (data.plan) {
            update.plan = data.plan as ExecutionPlan;
          }
          break;
        }

        case 'task:executing':
          update.status = 'executing';
          break;

        case 'step:started':
          update.currentStep = data.stepId as string;
          break;

        case 'step:completed': {
          if (data.output && (data.output as Record<string, unknown>).agent) {
            const output = data.output as Record<string, unknown>;
            const stepId = data.stepId as string;
            const alreadyExists = prev.agentOutputs.some(
              (o) => o.stepId === stepId
            );

            if (!alreadyExists) {
              const agentOutput: AgentOutput = {
                stepId,
                stepName: (output.stepName as string) || 'Unknown',
                agent: output.agent as AgentOutput['agent'],
                role: (output.role as string) || 'specialist',
                response: (output.response as string) || '',
                processingTimeMs: (output.processingTimeMs as number) || 0,
                llmMetadata: output.llmMetadata as AgentOutput['llmMetadata'],
              };
              update.agentOutputs = [...prev.agentOutputs, agentOutput];
            }
            update.streamingOutputs = prev.streamingOutputs.filter(
              (s) => s.stepId !== stepId
            );
          }
          break;
        }

        case 'step:streaming:start': {
          const stepId = data.stepId as string;
          const streamingOutput: StreamingOutput = {
            stepId,
            stepName: data.stepName as string,
            agent: data.agent as StreamingOutput['agent'],
            role: data.role as string,
            accumulated: '',
            startedAt: Date.now(),
          };
          update.streamingOutputs = [...prev.streamingOutputs, streamingOutput];
          break;
        }

        case 'step:streaming:chunk': {
          const stepId = data.stepId as string;
          update.streamingOutputs = prev.streamingOutputs.map((s) =>
            s.stepId === stepId
              ? { ...s, accumulated: data.accumulated as string }
              : s
          );
          break;
        }

        case 'step:streaming:end': {
          const stepId = data.stepId as string;
          const streaming = prev.streamingOutputs.find(
            (s) => s.stepId === stepId
          );
          const agentOutput: AgentOutput = {
            stepId,
            stepName:
              (data.stepName as string) || streaming?.stepName || 'Unknown',
            agent:
              (data.agent as AgentOutput['agent']) ||
              (streaming?.agent as AgentOutput['agent']),
            role: (data.role as string) || streaming?.role || 'specialist',
            response:
              (data.response as string) || streaming?.accumulated || '',
            artifacts: (data.artifacts as TaskArtifact[]) || undefined,
            processingTimeMs: streaming
              ? Date.now() - streaming.startedAt
              : 0,
            llmMetadata: data.llmMetadata as AgentOutput['llmMetadata'],
          };
          update.agentOutputs = [...prev.agentOutputs, agentOutput];
          update.streamingOutputs = prev.streamingOutputs.filter(
            (s) => s.stepId !== stepId
          );
          break;
        }

        case 'task:completed':
          update.status = 'completed';
          update.streamingOutputs = [];
          // Side effects deferred
          queueMicrotask(() => this.handleTaskCompleted(taskId));
          break;

        case 'task:failed':
          update.status = 'failed';
          update.error = data.error as string;
          queueMicrotask(() =>
            this.handleTaskFailed(taskId, data.error as string)
          );
          break;
      }

      store.updateTask(taskId, update);
    } catch (err) {
      console.error('[OrchestrationManager] Error parsing event:', err);
    }
  }

  // ─── Side Effects ──────────────────────────────────────────

  private handleTaskCompleted(taskId: string) {
    const store = useOrchestrationStore.getState();
    const task = store.taskMap[taskId];
    if (!task) return;

    // Close SSE connection (task is done)
    this.disconnectTask(taskId);

    // Persist to Supabase
    const taskToSave: Task = {
      id: taskId,
      demand: task.demand,
      status: 'completed',
      squads: task.squadSelections,
      workflow: task.workflowId
        ? {
            id: task.workflowId,
            name: 'Workflow',
            stepCount: task.workflowSteps.length,
          }
        : null,
      outputs: task.agentOutputs.map((o) => ({
        stepId: o.stepId,
        stepName: o.stepName,
        output: {
          response: o.response,
          artifacts: o.artifacts,
          agent: o.agent,
          role: o.role,
          processingTimeMs: o.processingTimeMs,
          llmMetadata: o.llmMetadata,
        },
      })),
      createdAt: task.startTime
        ? new Date(task.startTime).toISOString()
        : new Date().toISOString(),
      startedAt: task.startTime
        ? new Date(task.startTime).toISOString()
        : undefined,
      completedAt: new Date().toISOString(),
      totalTokens:
        task.agentOutputs.reduce(
          (s, o) =>
            s +
            (o.llmMetadata?.inputTokens || 0) +
            (o.llmMetadata?.outputTokens || 0),
          0
        ) || undefined,
      totalDuration: task.startTime
        ? Date.now() - task.startTime
        : undefined,
      stepCount: task.workflowSteps.length || undefined,
      completedSteps: task.agentOutputs.length || undefined,
    };
    supabaseTasksService.persistCompletedTask(taskToSave).catch(() => {});

    // Persist artifacts
    for (const output of task.agentOutputs) {
      const artifacts = output.artifacts || [];
      if (artifacts.length > 0) {
        supabaseArtifactsService
          .saveArtifacts(taskId, output.stepId, output.stepName, artifacts, {
            agent: output.agent.id,
            squad: output.agent.squad,
            role: output.role,
          })
          .catch(() => {});
      }
    }

    // Notification
    store.addNotification({
      taskId,
      demand: task.demand,
      status: 'completed',
    });

    // Toast when not on bob view
    if (useUIStore.getState().currentView !== 'bob') {
      const preview =
        task.demand.length > 60
          ? task.demand.slice(0, 60) + '...'
          : task.demand;
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Orquestração concluída',
        message: preview,
        duration: 8000,
        action: {
          label: 'Ver resultado',
          onClick: () => useUIStore.getState().setCurrentView('bob'),
        },
      });
    }

    // Inject summary into originating chat session
    this.injectChatSummary(task, 'completed');
  }

  private handleTaskFailed(taskId: string, error: string) {
    const store = useOrchestrationStore.getState();
    const task = store.taskMap[taskId];
    if (!task) return;

    // Close SSE
    this.disconnectTask(taskId);

    // Persist to Supabase
    supabaseTasksService
      .upsertTask({
        id: taskId,
        demand: task.demand,
        status: 'failed',
        squads: task.squadSelections,
        workflow: null,
        outputs: [],
        createdAt: task.startTime
          ? new Date(task.startTime).toISOString()
          : new Date().toISOString(),
        error,
      })
      .catch(() => {});

    // Notification
    store.addNotification({
      taskId,
      demand: task.demand,
      status: 'failed',
    });

    // Toast
    if (useUIStore.getState().currentView !== 'bob') {
      const preview =
        task.demand.length > 60
          ? task.demand.slice(0, 60) + '...'
          : task.demand;
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Orquestração falhou',
        message: preview,
        duration: 8000,
        action: {
          label: 'Ver detalhes',
          onClick: () => useUIStore.getState().setCurrentView('bob'),
        },
      });
    }

    // Inject error into chat
    this.injectChatSummary(task, 'failed', error);
  }

  private injectChatSummary(
    task: OrchestrationTaskState,
    status: 'completed' | 'failed',
    error?: string
  ) {
    const sourceSession = sessionStorage.getItem(
      'orchestration-source-session'
    );
    if (!sourceSession) return;
    sessionStorage.removeItem('orchestration-source-session');

    const summary = formatOrchestrationSummary({
      demand: task.demand,
      status,
      squadSelections: task.squadSelections,
      agentOutputs: status === 'completed' ? task.agentOutputs : [],
      startTime: task.startTime,
      error,
    });

    useChatStore.getState().addMessage(sourceSession, {
      role: 'agent',
      agentId: 'bob',
      agentName: 'Bob (Orchestrator)',
      squadId: 'orchestrator',
      squadType: 'orchestrator' as import('../types').SquadType,
      content: summary,
      metadata: {
        orchestrationId: task.taskId,
        orchestrationStatus: status,
        stepCount: task.agentOutputs.length,
        duration: task.startTime ? Date.now() - task.startTime : undefined,
        ...(error ? { error } : {}),
      },
    });
  }

  // ─── Catch-up (race condition recovery) ────────────────────

  /**
   * Fetch full task details from the API to catch up on missed SSE events.
   * Called when the SSE initial state shows the task is ahead of our local state.
   */
  private async fetchTaskCatchUp(taskId: string) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`);
      if (!res.ok) return;
      const task = await res.json();

      const store = useOrchestrationStore.getState();
      const prev = store.taskMap[taskId];
      if (!prev) return;

      const update: Partial<OrchestrationTaskState> = {};

      // Map server status to our status type
      const statusMap: Record<string, OrchestrationTaskState['status']> = {
        pending: 'analyzing',
        started: 'analyzing',
        analyzing: 'analyzing',
        planning: 'planning',
        executing: 'executing',
        completed: 'completed',
        failed: 'failed',
      };
      update.status = statusMap[task.status] || prev.status;

      // Update squads if available
      if (task.squads && Array.isArray(task.squads) && task.squads.length > 0) {
        update.selectedSquads = task.squads.map((s: { squadId: string }) => s.squadId);
        update.squadSelections = task.squads.map((s: { squadId: string; chief: string; agentCount: number; agents?: Array<{ id: string; name: string }> }) => ({
          squadId: s.squadId,
          chief: s.chief || 'N/A',
          agentCount: s.agentCount || s.agents?.length || 0,
          agents: s.agents || [],
        }));
      }

      // Update workflow if available
      if (task.workflow) {
        update.workflowId = task.workflow.id || null;
        update.workflowSteps = Array.from(
          { length: task.workflow.stepCount || task.stepCount || 0 },
          (_, i) => ({ id: `step-${i}`, name: `Step ${i + 1}` })
        );
      }

      // Update outputs if available (completed task)
      if (task.outputs && Array.isArray(task.outputs) && task.outputs.length > 0 && prev.agentOutputs.length === 0) {
        update.agentOutputs = task.outputs.map((o: Record<string, unknown>) => {
          const out = (o.output || {}) as Record<string, unknown>;
          return {
            stepId: (o.stepId as string) || '',
            stepName: (o.stepName as string) || (out.stepName as string) || 'Step',
            agent: (out.agent as AgentOutput['agent']) || { id: 'unknown', name: 'Agent', squad: 'unknown' },
            role: (out.role as string) || 'specialist',
            response: (out.response as string) || '',
            processingTimeMs: (out.processingTimeMs as number) || 0,
            llmMetadata: out.llmMetadata as AgentOutput['llmMetadata'],
            artifacts: out.artifacts as import('./api/tasks').TaskArtifact[] | undefined,
          };
        });
        update.streamingOutputs = [];
      }

      // Update error
      if (task.error) {
        update.error = task.error;
      }

      store.updateTask(taskId, update);

      // If task is terminal, trigger side effects
      if (task.status === 'completed') {
        this.disconnectTask(taskId);
        this.handleTaskCompleted(taskId);
      } else if (task.status === 'failed') {
        this.disconnectTask(taskId);
        this.handleTaskFailed(taskId, task.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[OrchestrationManager] CatchUp fetch failed:', err);
    }
  }

  // ─── Reconnection ──────────────────────────────────────────

  private scheduleReconnect(taskId: string) {
    const store = useOrchestrationStore.getState();
    const task = store.taskMap[taskId];
    if (!task) return;

    const isTerminal = ['completed', 'failed', 'idle'].includes(task.status);
    if (isTerminal) return;

    const attempt = this.reconnectAttempts.get(taskId) || 0;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
    this.reconnectAttempts.set(taskId, attempt + 1);

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(taskId);
      this.connectToTask(taskId, task.demand);
    }, delay);
    this.reconnectTimers.set(taskId, timer);
  }
}

/** Singleton instance — persists across route changes */
export const orchestrationManager = new OrchestrationManager();
