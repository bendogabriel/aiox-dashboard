/**
 * Task Orchestrator Component - Demo-style Interface
 * Beautiful, intuitive, and interactive real-time workflow visualization
 *
 * State is managed by OrchestrationManager (SSE) + OrchestrationStore (Zustand).
 * This component subscribes to the store and delegates actions to the manager.
 * SSE connections persist across route changes — tasks run in background.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Workflow,
  Zap,
  RotateCcw,
  Terminal,
  MessageSquare,
  GitBranch,
  History,
} from 'lucide-react';
import { CockpitButton } from '../ui/cockpit/CockpitButton';
import { WorkflowCanvas } from '../workflow/WorkflowCanvas';
import { WorkflowExecutionSidebar } from '../workflow/WorkflowExecutionSidebar';
import { WorkflowExecutionDetails } from '../workflow/WorkflowExecutionDetails';
import { taskStateToMission } from '../../lib/taskStateToMission';
import { taskStateToLiveExecution } from '../../lib/taskStateToLiveExecution';
import { formatElapsedTime } from '../workflow/workflow-execution-helpers';
import { CheckIcon, XIcon, SpinnerIcon, ClockIcon, ZoomInIcon, ZoomOutIcon } from '../workflow/workflow-execution-icons';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/uiStore';
import { useOrchestrationStore } from '../../stores/orchestrationStore';
import { useToastStore } from '../../stores/toastStore';
import { tasksApi } from '../../services/api/tasks';
import { supabaseTasksService } from '../../services/supabase/tasks';
import { supabaseArtifactsService } from '../../services/supabase/artifacts';
import { orchestrationManager } from '../../services/orchestration-manager';
import type { Task } from '../../services/api/tasks';
import type { TaskState, AgentOutput } from './orchestration-types';
import { initialState } from './orchestration-types';
import { LiveMetrics, PhaseProgress, SquadCard } from './OrchestrationWidgets';
import { AgentOutputCard } from './AgentOutputCard';
import { PlanApprovalCard } from './PlanApprovalCard';
import { EventsPanel, TaskHistoryPanel, TaskDetailView } from './OrchestrationPanels';
import { OrchestrationTemplates } from './OrchestrationTemplates';
import { ExportPanel } from './ExportPanel';
import { VaultImportDialog } from './VaultImportDialog';
import type { TaskArtifact } from '../../services/api/tasks';

// Main component
export default function TaskOrchestrator() {
  // ─── Store subscription: derive TaskState from global store ──
  const activeTaskId = useOrchestrationStore((s) => s.activeTaskId);
  const storeTask = useOrchestrationStore((s) =>
    s.activeTaskId ? s.taskMap[s.activeTaskId] ?? null : null
  );

  // Convert store state → TaskState (array → Map for streamingOutputs)
  const state: TaskState = useMemo(() => {
    if (!storeTask) return initialState;
    return {
      taskId: storeTask.taskId,
      status: storeTask.status,
      demand: storeTask.demand,
      selectedSquads: storeTask.selectedSquads,
      squadSelections: storeTask.squadSelections,
      workflowId: storeTask.workflowId,
      workflowSteps: storeTask.workflowSteps,
      currentStep: storeTask.currentStep,
      agentOutputs: storeTask.agentOutputs,
      streamingOutputs: new Map(
        storeTask.streamingOutputs.map((s) => [s.stepId, s])
      ),
      error: storeTask.error,
      events: storeTask.events,
      startTime: storeTask.startTime,
      plan: storeTask.plan,
    };
  }, [storeTask]);

  // ─── Local UI state ─────────────────────────────────────────
  const [inputValue, setInputValue] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [leftTab, setLeftTab] = useState<'input' | 'history' | 'events'>('input');
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<Task | null>(null);
  const [visualMode, setVisualMode] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [vaultDialogArtifact, setVaultDialogArtifact] = useState<TaskArtifact | null>(null);
  const [vaultDialogStep, setVaultDialogStep] = useState<string>('');

  // ─── Derived values ─────────────────────────────────────────
  const liveMission = useMemo(() => taskStateToMission(state), [state]);
  const liveExecState = useMemo(() => taskStateToLiveExecution(state), [state]);

  const selectedStep = useMemo(() => {
    if (!selectedNodeId || !liveExecState) return null;
    return liveExecState.steps.find((s) => s.id === selectedNodeId) ?? null;
  }, [selectedNodeId, liveExecState]);

  const [canvasElapsed, setCanvasElapsed] = useState(0);

  const finalResult = useMemo(
    () =>
      state.agentOutputs.length > 0
        ? state.agentOutputs.filter((o) => o.role === 'reviewer').pop() ||
          state.agentOutputs[state.agentOutputs.length - 1]
        : null,
    [state.agentOutputs]
  );

  // ─── Callbacks ──────────────────────────────────────────────
  const handleCopy = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleNewTask = useCallback(() => {
    // Don't disconnect old task — let it continue in background
    const store = useOrchestrationStore.getState();
    store.setActiveTask(null);
    setInputValue('');
    setSelectedHistoryTask(null);
    setApprovalSubmitting(false);
    setVisualMode(false);
    useUIStore.getState().setFocusMode(false);
  }, []);

  const handleApprovePlan = useCallback(async () => {
    if (!state.taskId) return;
    setApprovalSubmitting(true);
    try {
      await orchestrationManager.approvePlan(state.taskId);
    } catch (err) {
      console.error('Approve error:', err);
      setApprovalSubmitting(false);
    }
  }, [state.taskId]);

  const handleRevisePlan = useCallback(
    async (feedback: string) => {
      if (!state.taskId) return;
      setApprovalSubmitting(true);
      try {
        await orchestrationManager.revisePlan(state.taskId, feedback);
      } catch (err) {
        console.error('Revise error:', err);
      } finally {
        setApprovalSubmitting(false);
      }
    },
    [state.taskId]
  );

  const handleSelectHistoryTask = useCallback(async (task: Task) => {
    let fullTask = task;
    if ((!task.outputs || task.outputs.length === 0) && task.status === 'completed') {
      try {
        const supa = supabaseTasksService.isAvailable()
          ? await supabaseTasksService.getTask(task.id)
          : null;
        fullTask = supa || (await tasksApi.getTask(task.id));
      } catch {
        // Use what we have
      }
    }

    // Enrich outputs with artifacts from task_artifacts table
    if (fullTask.outputs && fullTask.outputs.length > 0 && supabaseArtifactsService.isAvailable()) {
      try {
        const savedArtifacts = await supabaseArtifactsService.getArtifactsByTask(fullTask.id);
        if (savedArtifacts && savedArtifacts.length > 0) {
          const byStep = new Map<string, TaskArtifact[]>();
          for (const a of savedArtifacts) {
            const stepId = (a as TaskArtifact & { stepId?: string }).stepId || '';
            if (!byStep.has(stepId)) byStep.set(stepId, []);
            byStep.get(stepId)!.push(a);
          }
          fullTask = {
            ...fullTask,
            outputs: fullTask.outputs.map((o) => {
              if (!o.output.artifacts || o.output.artifacts.length === 0) {
                const stepArtifacts = byStep.get(o.stepId);
                if (stepArtifacts) {
                  return { ...o, output: { ...o.output, artifacts: stepArtifacts } };
                }
              }
              return o;
            }),
          };
        }
      } catch {
        // Artifacts enrichment is best-effort
      }
    }

    setSelectedHistoryTask(fullTask);
    setLeftTab('input');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) return;
    try {
      await orchestrationManager.submitTask(inputValue);
      // Input stays for reference but submit is done
    } catch (err) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Erro ao criar tarefa',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        duration: 5000,
      });
    }
  }, [inputValue]);

  // ─── Effects ────────────────────────────────────────────────

  // Pick up orchestration demand from chat redirect
  useEffect(() => {
    const demand = sessionStorage.getItem('orchestration-demand');
    if (demand && state.status === 'idle') {
      sessionStorage.removeItem('orchestration-demand');
      setInputValue(demand);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect SSE on mount if there's an active non-terminal task without connection
  useEffect(() => {
    orchestrationManager.reconnectActiveTasks();
  }, []);

  // Restore focus mode on unmount
  useEffect(() => {
    return () => {
      useUIStore.getState().setFocusMode(false);
    };
  }, []);

  // Auto-switch to Outputs view when task completes/fails
  useEffect(() => {
    if (state.status === 'completed' || state.status === 'failed') {
      setVisualMode(false);
      setSelectedNodeId(null);
      setApprovalSubmitting(false);
    }
  }, [state.status]);

  // Canvas elapsed time timer
  useEffect(() => {
    if (
      (state.status === 'executing' ||
        state.status === 'analyzing' ||
        state.status === 'planning' ||
        state.status === 'awaiting_approval') &&
      state.startTime
    ) {
      queueMicrotask(() =>
        setCanvasElapsed(Math.floor((Date.now() - state.startTime!) / 1000))
      );
      const interval = setInterval(() => {
        setCanvasElapsed(Math.floor((Date.now() - state.startTime!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.status, state.startTime]);

  // ─── Render helpers ─────────────────────────────────────────
  const isRunning = ['analyzing', 'planning', 'executing'].includes(state.status);
  const isAwaitingApproval = state.status === 'awaiting_approval';

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background placeholder — particles removed for enterprise polish */}

      {/* Header (hidden in Canvas mode — canvas has its own header) */}
      <div className={cn("relative z-10 p-4 md:p-6 border-b border-white/10", visualMode && "hidden")}>
        <div className="flex items-center justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-3">
            <Workflow className="w-5 h-5 text-[var(--color-accent,#D1FF00)] flex-shrink-0" />
            <h1 className="text-base md:text-lg font-bold text-white whitespace-nowrap type-h2">Orquestrador</h1>
            {isAwaitingApproval && (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-[var(--bb-warning)]/15 text-[var(--bb-warning)] border border-[var(--bb-warning)]/30">
                Aguardando Aprovação
              </span>
            )}
          </div>

          {/* Inline metrics ticker */}
          {state.status !== 'idle' && <LiveMetrics state={state} />}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {(state.status === 'completed' || state.status === 'failed') && (
              <CockpitButton onClick={handleNewTask} className="px-3 py-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Nova Tarefa
              </CockpitButton>
            )}
            {state.status !== 'idle' && (
              <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => { setVisualMode(false); useUIStore.getState().setFocusMode(false); }}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                    !visualMode ? 'bg-white/10 text-white/90' : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label="Modo lista"
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                  Outputs
                </button>
                <button
                  onClick={() => { setVisualMode(true); useUIStore.getState().setFocusMode(true); }}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                    visualMode ? 'bg-white/10 text-white/90' : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label="Modo visual"
                >
                  <GitBranch className="w-3.5 h-3.5 inline mr-1" />
                  Canvas
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phase Progress */}
        {state.status !== 'idle' && (
          <div className="mt-3">
            <PhaseProgress currentStatus={state.status} />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Input & Squads / History (hidden in Canvas mode) */}
        {!visualMode && (
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-hidden md:max-h-none max-h-[40vh] md:max-h-full flex-shrink-0">
          {/* Tab bar */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button
              onClick={() => setLeftTab('input')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                leftTab === 'input' ? 'text-white bg-white/5 border-b-2 border-[var(--color-accent,#D1FF00)]' : 'text-white/40 hover:text-white/60',
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              Input
            </button>
            <button
              onClick={() => { setLeftTab('history'); setSelectedHistoryTask(null); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                leftTab === 'history' ? 'text-white bg-white/5 border-b-2 border-[var(--color-accent,#D1FF00)]' : 'text-white/40 hover:text-white/60',
              )}
            >
              <History className="w-3.5 h-3.5" />
              Histórico
            </button>
            {state.status !== 'idle' && (
              <button
                onClick={() => setLeftTab('events')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative',
                  leftTab === 'events' ? 'text-white bg-white/5 border-b-2 border-[var(--color-accent,#D1FF00)]' : 'text-white/40 hover:text-white/60',
                )}
              >
                <Terminal className="w-3.5 h-3.5" />
                Eventos
                {state.events.length > 0 && leftTab !== 'events' && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] bg-[var(--color-accent,#D1FF00)] text-black font-bold flex items-center justify-center">
                    {state.events.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-4 md:p-5 overflow-auto">
            {leftTab === 'history' ? (
                <TaskHistoryPanel
                  key="history"
                  visible={leftTab === 'history'}
                  onSelectTask={handleSelectHistoryTask}
                  onClose={() => setLeftTab('input')}
                />
              ) : leftTab === 'events' ? (
                <div key="events" className="h-full">
                  <EventsPanel events={state.events} isActive={isRunning} />
                </div>
              ) : (
                <div
                  key="input"
                  className="flex flex-col gap-5 flex-1"
                >
                  {/* Input */}
                  <div>
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Sua Demanda</label>
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Descreva o que você precisa..."
                      className="w-full h-24 md:h-28 bg-white/5 border border-white/10 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[var(--aiox-lime)]/50 focus:ring-2 focus:ring-[var(--aiox-lime)]/20 transition-all"
                      disabled={isRunning}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <CockpitButton
                        onClick={handleSubmit}
                        disabled={!inputValue.trim() || isRunning}
                        className="px-4 py-2"
                      >
                        {isRunning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Executar
                          </>
                        )}
                      </CockpitButton>
                    </div>
                  </div>

                  {/* Selected Squads — compact */}
                  {state.squadSelections.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-white/40" />
                        <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider">Squads</h2>
                      </div>
                      <div className="space-y-2">
                        {state.squadSelections.map((selection) => (
                          <SquadCard
                            key={selection.squadId}
                            selection={selection}
                            isActive={state.status === 'executing'}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
</div>
        </div>
        )}

        {/* Center Panel - Agent Outputs / Canvas / History Detail */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {selectedHistoryTask ? (
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <TaskDetailView
                task={selectedHistoryTask}
                onBack={() => { setSelectedHistoryTask(null); setLeftTab('history'); }}
                onCopy={(text, index) => handleCopy(text, index)}
                copiedIndex={copiedIndex}
              />
            </div>
          ) : isAwaitingApproval && state.plan ? (
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <div className="max-w-2xl mx-auto">
                <PlanApprovalCard
                  plan={state.plan}
                  demand={state.demand}
                  onApprove={handleApprovePlan}
                  onRevise={handleRevisePlan}
                  isSubmitting={approvalSubmitting}
                />
              </div>
            </div>
          ) : state.status === 'idle' ? (
            <div className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto">
              <div className="flex flex-col items-center justify-start pt-8 md:pt-12 pb-12">
                <div
                  className="text-center max-w-md px-4 mb-8"
                >
                  <div
                    className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-6 md:mb-8 rounded-none md:rounded-3xl bg-gradient-to-br from-[var(--aiox-blue)]/10 to-[var(--aiox-blue)]/10 flex items-center justify-center border border-[var(--aiox-blue)]/20"
                  >
                    <Sparkles className="w-16 h-16 text-[var(--aiox-blue)]/50" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Pronto para Orquestrar</h2>
                  <p className="text-white/50 leading-relaxed">
                    Digite sua demanda e observe o orquestrador master selecionar squads, delegar para chiefs, e
                    coordenar a execução dos agentes especialistas em tempo real.
                  </p>
                </div>

                {/* Orchestration Templates */}
                <OrchestrationTemplates onSelect={(demand) => setInputValue(demand)} />
              </div>
            </div>
          ) : visualMode && liveMission && liveExecState ? (
            /* Canvas visualization mode — full WorkflowExecutionLive */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Canvas Header */}
              <div className="h-14 px-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-none flex items-center justify-center',
                    (state.status === 'executing' || state.status === 'analyzing' || state.status === 'planning') && 'bg-[var(--color-background-hover)]',
                    state.status === 'awaiting_approval' && 'bg-[var(--bb-warning)]/10',
                    state.status === 'completed' && 'bg-[var(--color-background-hover)]',
                    state.status === 'failed' && 'bg-gradient-to-br from-[var(--bb-error)]/20 to-[var(--bb-error)]/10',
                  )}>
                    {(state.status === 'analyzing' || state.status === 'planning' || state.status === 'executing') && (
                      <SpinnerIcon size={18} />
                    )}
                    {state.status === 'awaiting_approval' && (
                      <span className="text-[var(--bb-warning)]"><ClockIcon size={18} /></span>
                    )}
                    {state.status === 'completed' && (
                      <span style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' }}><CheckIcon size={18} /></span>
                    )}
                    {state.status === 'failed' && (
                      <span className="text-[var(--bb-error)]"><XIcon /></span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {liveExecState.workflowName || 'Orquestração'}
                    </h2>
                    <p className="text-xs text-white/50">
                      {state.status === 'analyzing' && 'Analisando demanda...'}
                      {state.status === 'planning' && 'Planejando execução...'}
                      {state.status === 'awaiting_approval' && 'Plano pronto — aguardando sua aprovação'}
                      {state.status === 'executing' && `Executando ${liveExecState.steps.filter(s => s.status === 'running').length > 0 ? `· ${liveExecState.steps.filter(s => s.status === 'running').length} step(s) ativos` : ''}`}
                      {state.status === 'completed' && 'Todos os steps foram concluídos com sucesso'}
                      {state.status === 'failed' && 'A execução encontrou um erro'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Exit canvas / switch to outputs */}
                  <button
                    onClick={() => { setVisualMode(false); useUIStore.getState().setFocusMode(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Outputs
                  </button>
                  {/* Timer */}
                  {(state.status === 'executing' || state.status === 'analyzing' || state.status === 'planning') && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-white/5 border border-white/10">
                      <ClockIcon size={14} />
                      <span className="text-sm font-mono text-white/80">{formatElapsedTime(canvasElapsed)}</span>
                    </div>
                  )}
                  {/* Zoom */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => setCanvasZoom(z => Math.max(0.5, z - 0.1))}
                      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      aria-label="Diminuir zoom"
                    >
                      <ZoomOutIcon />
                    </button>
                    <span className="text-xs text-white/60 w-10 text-center">{Math.round(canvasZoom * 100)}%</span>
                    <button
                      onClick={() => setCanvasZoom(z => Math.min(1.5, z + 0.1))}
                      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      aria-label="Aumentar zoom"
                    >
                      <ZoomInIcon />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                const completedSteps = liveExecState.steps.filter(s => s.status === 'completed').length;
                const totalSteps = Math.max(liveExecState.steps.length, 1);
                const progressPct = state.status === 'completed' ? 100
                  : state.status === 'analyzing' ? 10
                  : state.status === 'planning' ? 25
                  : totalSteps > 0 ? (completedSteps / totalSteps) * 100
                  : 0;
                return (
                  <div className="h-1 bg-black/30 flex-shrink-0">
                    <div
                      className={cn('h-full', state.status === 'failed' && 'bg-gradient-to-r from-[var(--bb-error)] to-[var(--bb-error)]')}
                      style={{
                        ...(state.status !== 'failed' ? { background: 'linear-gradient(to right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))' } : {}),
                        boxShadow: state.status !== 'failed' ? '0 0 10px var(--aiox-lime-glow)' : '0 0 10px var(--color-status-error-muted)',
                      }}
                    />
                  </div>
                );
              })()}

              {/* Main Canvas Area: Left Sidebar + Canvas + Right Details */}
              <div className="flex-1 flex overflow-hidden">
                {/* LEFT SIDEBAR — Execution context */}
                <WorkflowExecutionSidebar
                  state={liveExecState}
                  selectedNodeId={selectedNodeId}
                  setSelectedNodeId={setSelectedNodeId}
                  completedSteps={liveExecState.steps.filter(s => s.status === 'completed').length}
                  runningSteps={liveExecState.steps.filter(s => s.status === 'running').length}
                  pendingSteps={liveExecState.steps.filter(s => s.status === 'pending').length}
                  totalSteps={liveExecState.steps.length}
                  progress={state.status === 'completed' ? 100 : liveExecState.steps.length > 0 ? (liveExecState.steps.filter(s => s.status === 'completed').length / liveExecState.steps.length) * 100 : 0}
                />

                {/* CENTER — Canvas */}
                <div className="flex-1 relative">
                  <WorkflowCanvas
                    nodes={liveMission.nodes}
                    edges={liveMission.edges}
                    zoom={canvasZoom}
                    onZoomChange={setCanvasZoom}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                  />
                </div>

                {/* RIGHT SIDEBAR — Node Details */}
                <WorkflowExecutionDetails
                  state={liveExecState}
                  selectedNodeId={selectedNodeId}
                  setSelectedNodeId={setSelectedNodeId}
                  selectedStep={selectedStep}
                  copiedText={copiedIndex === -999 ? '__copied__' : null}
                  handleCopy={(text) => handleCopy(text, -999)}
                />
              </div>

              {/* Footer — Result Summary */}
              {(state.status === 'completed' || state.status === 'failed') && (
                <div className={cn(
                  'border-t border-white/10 p-4 flex items-center justify-between flex-shrink-0',
                  state.status === 'completed' && 'bg-[var(--color-background-hover)]',
                  state.status === 'failed' && 'bg-gradient-to-r from-[var(--bb-error)]/10 to-transparent',
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-none flex items-center justify-center',
                      state.status === 'completed' ? 'bg-[var(--color-background-active)]' : 'bg-gradient-to-br from-[var(--bb-error)]/30 to-[var(--bb-error)]/20'
                    )}>
                      {state.status === 'completed' ? (
                        <span style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' }}><CheckIcon size={18} /></span>
                      ) : (
                        <span className="text-[var(--bb-error)]"><XIcon /></span>
                      )}
                    </div>
                    <div>
                      <p
                        className={cn('font-semibold', state.status !== 'completed' && 'text-[var(--bb-error)]')}
                        style={state.status === 'completed' ? { color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' } : undefined}
                      >
                        {state.status === 'completed' ? 'Execução Concluída!' : 'Execução Falhou'}
                      </p>
                      <p className="text-xs text-white/50">
                        {state.agentOutputs.length} step(s) · {canvasElapsed > 0 ? formatElapsedTime(canvasElapsed) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CockpitButton variant="ghost" size="sm" onClick={() => { setSelectedNodeId(null); setVisualMode(false); useUIStore.getState().setFocusMode(false); }}>
                      Ver Outputs
                    </CockpitButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <div className="space-y-4">
                {/* Completed outputs first (oldest → newest) */}
                {state.agentOutputs.map((output, index) => (
                  <AgentOutputCard
                    key={output.stepId}
                    output={output}
                    index={index}
                    isReviewer={state.status === 'completed' && output === finalResult}
                    onCopy={(text) => handleCopy(text, index)}
                    copied={copiedIndex === index}
                    onSaveToVault={(artifact, stepName) => {
                      setVaultDialogArtifact(artifact);
                      setVaultDialogStep(stepName);
                    }}
                  />
                ))}

                {/* Currently streaming outputs at bottom (live progress) */}
                {Array.from(state.streamingOutputs.values()).map((streaming, index) => (
                  <AgentOutputCard
                    key={streaming.stepId}
                    streaming={streaming}
                    index={state.agentOutputs.length + index}
                    isReviewer={false}
                    onCopy={(text) => handleCopy(text, -100 - index)}
                    copied={copiedIndex === -100 - index}
                  />
                ))}
{/* Completion message + Export */}
                {state.status === 'completed' && (
                  <>
                    <div
                      className="p-6 rounded-none bg-gradient-to-r from-[var(--color-status-success)]/10 to-[var(--color-status-success)]/10 border border-[var(--color-status-success)]/30 text-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-[var(--color-status-success)] mx-auto mb-3" />
                      <h2 className="text-xl font-bold text-white mb-2">Tarefa Concluída!</h2>
                      <p className="text-white/60">
                        {state.agentOutputs.length} agentes executados com sucesso
                      </p>
                    </div>
                    {/* Export panel */}
                    {state.taskId && (
                      <ExportPanel
                        task={{
                          id: state.taskId,
                          demand: state.demand,
                          status: state.status,
                          squads: state.squadSelections.map(s => ({
                            squadId: s.squadId,
                            chief: s.chief,
                            agentCount: s.agentCount,
                            agents: s.agents,
                          })),
                          workflow: state.workflowId ? { id: state.workflowId, name: 'Workflow', stepCount: state.workflowSteps.length } : null,
                          outputs: state.agentOutputs.map(o => ({
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
                          createdAt: state.startTime ? new Date(state.startTime).toISOString() : new Date().toISOString(),
                          totalDuration: state.startTime ? Date.now() - state.startTime : undefined,
                          error: state.error ?? undefined,
                        }}
                      />
                    )}
                  </>
                )}

                {/* Error message */}
                {state.status === 'failed' && (
                  <div
                    className="p-6 rounded-none bg-gradient-to-r from-[var(--bb-error)]/10 to-[var(--bb-error)]/10 border border-[var(--bb-error)]/30 text-center"
                  >
                    <AlertCircle className="w-12 h-12 text-[var(--bb-error)] mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white mb-2">Erro na Execução</h2>
                    <p className="text-white/60">{state.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Events panel removed — now integrated as tab in left panel */}
      </div>

      {/* Vault Import Dialog */}
      <VaultImportDialog
        visible={!!vaultDialogArtifact}
        artifact={vaultDialogArtifact}
        taskDemand={state.demand}
        stepName={vaultDialogStep}
        onClose={() => setVaultDialogArtifact(null)}
        onSaved={() => {
          setVaultDialogArtifact(null);
          useToastStore.getState().addToast({ type: 'success', title: 'Artefato salvo no Vault' });
        }}
      />
    </div>
  );
}
