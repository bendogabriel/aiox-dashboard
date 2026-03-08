import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassButton, Badge, Avatar } from '../ui';
import { WorkflowCanvas } from './WorkflowCanvas';
import type { LiveExecutionState, LiveExecutionStep } from '../../hooks/useWorkflows';
import type { WorkflowNode, WorkflowEdge } from './types';
import type { SquadType } from '../../types';
import { cn } from '../../lib/utils';

// Shape of step.output from the SSE execution stream
interface StepOutput {
  agent?: {
    name?: string;
    squad?: string;
  };
  role?: string;
  response?: string;
  llmMetadata?: {
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

// ============================================
// ICONS
// ============================================

const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpinnerIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const ClockIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RocketIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const TargetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const MessageIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CpuIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

// ============================================
// CONSTANTS
// ============================================

const STEP_TYPE_LABELS: Record<string, string> = {
  task: 'Tarefa',
  condition: 'Condição',
  parallel: 'Paralelo',
  loop: 'Loop',
  wait: 'Aguardar',
  subworkflow: 'Sub-workflow',
  webhook: 'Webhook',
  transform: 'Transformação',
};

const SQUAD_STYLES: Record<string, { gradient: string; border: string; bg: string; text: string; glow: string }> = {
  copywriting: {
    gradient: 'from-[var(--color-accent,#D1FF00)] to-[color-mix(in_srgb,var(--color-accent,#D1FF00)_70%,#000)]',
    border: 'border-l-[var(--color-accent,#D1FF00)]',
    bg: 'from-[rgba(209,255,0,0.12)] to-[rgba(209,255,0,0.06)]',
    text: 'text-[var(--color-accent,#D1FF00)]',
    glow: 'rgba(209, 255, 0, 0.25)'
  },
  design: {
    gradient: 'from-[color-mix(in_srgb,var(--color-accent,#D1FF00)_80%,#000)] to-[color-mix(in_srgb,var(--color-accent,#D1FF00)_50%,#000)]',
    border: 'border-l-[color-mix(in_srgb,var(--color-accent,#D1FF00)_80%,#858585)]',
    bg: 'from-[rgba(209,255,0,0.10)] to-[rgba(209,255,0,0.04)]',
    text: 'text-[color-mix(in_srgb,var(--color-accent,#D1FF00)_80%,#858585)]',
    glow: 'rgba(209, 255, 0, 0.2)'
  },
  creator: {
    gradient: 'from-[color-mix(in_srgb,var(--color-accent,#D1FF00)_85%,#000)] to-[color-mix(in_srgb,var(--color-accent,#D1FF00)_55%,#000)]',
    border: 'border-l-[var(--color-accent,#D1FF00)]',
    bg: 'from-[rgba(209,255,0,0.12)] to-[rgba(209,255,0,0.06)]',
    text: 'text-[var(--color-accent,#D1FF00)]',
    glow: 'rgba(209, 255, 0, 0.25)'
  },
  orchestrator: {
    gradient: 'from-[var(--color-accent,#D1FF00)] to-[color-mix(in_srgb,var(--color-accent,#D1FF00)_65%,#000)]',
    border: 'border-l-[var(--color-accent,#D1FF00)]',
    bg: 'from-[rgba(209,255,0,0.14)] to-[rgba(209,255,0,0.08)]',
    text: 'text-[var(--color-accent,#D1FF00)]',
    glow: 'rgba(209, 255, 0, 0.3)'
  },
  default: {
    gradient: 'from-[var(--color-text-secondary,#858585)] to-[var(--color-text-tertiary,#6D6D6D)]',
    border: 'border-l-[var(--color-text-secondary,#858585)]',
    bg: 'from-[rgba(156,156,156,0.12)] to-[rgba(156,156,156,0.06)]',
    text: 'text-[var(--color-text-secondary,#858585)]',
    glow: 'rgba(156, 156, 156, 0.15)'
  },
};

const getSquadStyle = (squad?: string) => SQUAD_STYLES[squad || 'default'] || SQUAD_STYLES.default;

const STEP_TYPE_TO_SQUAD: Record<string, string> = {
  task: 'orchestrator',
  condition: 'design',
  parallel: 'creator',
  loop: 'copywriting',
  wait: 'orchestrator',
  subworkflow: 'design',
  webhook: 'creator',
  transform: 'copywriting',
};

// ============================================
// HELPERS
// ============================================

const formatDuration = (startedAt?: string, completedAt?: string): string => {
  if (!startedAt) return '';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatElapsedTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const stepStatusToNodeStatus = (status: LiveExecutionStep['status']): WorkflowNode['status'] => {
  switch (status) {
    case 'completed': return 'completed';
    case 'running': return 'active';
    case 'failed': return 'error';
    default: return 'idle';
  }
};

const stepStatusToEdgeStatus = (status: LiveExecutionStep['status']): WorkflowEdge['status'] => {
  switch (status) {
    case 'completed': return 'completed';
    case 'running': return 'active';
    default: return 'idle';
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

interface OrchestrationPlan {
  analysis: string | null;
  expectedOutputs: string[];
  planSteps: Array<{
    id: string;
    name: string;
    squadId: string;
    agentId: string;
    role: string;
    description: string;
  }>;
  phase: string;
}

interface WorkflowExecutionLiveProps {
  state: LiveExecutionState;
  onClose: () => void;
  orchestrationPlan?: OrchestrationPlan;
}

export function WorkflowExecutionLive({ state, onClose, orchestrationPlan }: WorkflowExecutionLiveProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const completedSteps = state.steps.filter((s) => s.status === 'completed').length;
  const runningSteps = state.steps.filter((s) => s.status === 'running').length;
  const pendingSteps = state.steps.filter((s) => s.status === 'pending').length;
  const totalSteps = state.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Elapsed time timer
  useEffect(() => {
    if (state.status === 'running' && state.startedAt) {
      const startTime = new Date(state.startedAt).getTime();
      // Set initial elapsed time via microtask to avoid synchronous setState in effect
      queueMicrotask(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)));
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.status, state.startedAt]);

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get selected step data
  const selectedStep = selectedNodeId ? state.steps.find(s => s.id === selectedNodeId) : null;
  const isStartNode = selectedNodeId === 'start';
  const isEndNode = selectedNodeId === 'end';

  // Convert execution steps to canvas nodes and edges
  const { nodes, edges } = useMemo(() => {
    const canvasNodes: WorkflowNode[] = [];
    const canvasEdges: WorkflowEdge[] = [];

    const startX = 100;
    const startY = 200;
    const stepWidth = 220;
    const stepSpacing = 60;

    canvasNodes.push({
      id: 'start',
      type: 'start',
      label: 'Início',
      status: state.status === 'connecting' ? 'idle' : 'completed',
      position: { x: startX, y: startY },
    });

    state.steps.forEach((step, index) => {
      const x = startX + (index + 1) * (stepWidth + stepSpacing);
      const y = startY + (index % 2 === 0 ? 0 : 50);

      const output = step.output as StepOutput | undefined;
      const agent = output?.agent;
      const config = step.config;

      // Use agent from output if available (after completion), otherwise use config (before completion)
      const agentName = agent?.name || config?.agentId || step.name || `Step ${index + 1}`;
      const squadType = agent?.squad || config?.squadId || STEP_TYPE_TO_SQUAD[step.type] || 'orchestrator';
      const role = output?.role || config?.role || step.type;

      canvasNodes.push({
        id: step.id,
        type: 'agent',
        label: agentName,
        agentName: agentName,
        squadType: squadType as SquadType,
        status: stepStatusToNodeStatus(step.status),
        position: { x, y },
        progress: step.status === 'running' ? 50 : step.status === 'completed' ? 100 : 0,
        currentAction: step.status === 'running' ? 'Processando...' : undefined,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        output: output?.response,
        request: role,
      });
    });

    if (state.steps.length > 0) {
      const lastStepX = startX + state.steps.length * (stepWidth + stepSpacing);
      canvasNodes.push({
        id: 'end',
        type: 'end',
        label: state.status === 'completed' ? 'Concluído' : 'Fim',
        status: state.status === 'completed' ? 'completed' : state.status === 'failed' ? 'error' : 'idle',
        position: { x: lastStepX + stepWidth + stepSpacing, y: startY },
      });
    }

    if (state.steps.length > 0) {
      canvasEdges.push({
        id: 'edge-start-step1',
        source: 'start',
        target: state.steps[0].id,
        status: state.steps[0].status === 'pending' ? 'idle' : 'completed',
        animated: state.steps[0].status === 'running',
      });
    }

    state.steps.forEach((step, index) => {
      if (index < state.steps.length - 1) {
        const nextStep = state.steps[index + 1];
        canvasEdges.push({
          id: `edge-${step.id}-${nextStep.id}`,
          source: step.id,
          target: nextStep.id,
          status: stepStatusToEdgeStatus(step.status),
          animated: nextStep.status === 'running',
        });
      }
    });

    if (state.steps.length > 0) {
      const lastStep = state.steps[state.steps.length - 1];
      canvasEdges.push({
        id: 'edge-last-end',
        source: lastStep.id,
        target: 'end',
        status: stepStatusToEdgeStatus(lastStep.status),
        animated: state.status === 'running' && lastStep.status === 'running',
      });
    }

    return { nodes: canvasNodes, edges: canvasEdges };
  }, [state.steps, state.status]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 m-4 flex-1 flex flex-col backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 0% 100%, rgba(209, 255, 0, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 100% 0%, rgba(209, 255, 0, 0.05) 0%, transparent 50%),
            rgba(0, 0, 0, 0.75)
          `
        }}
      >
        {/* Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              state.status === 'running' && 'bg-[rgba(209,255,0,0.08)]',
              state.status === 'completed' && 'bg-[rgba(209,255,0,0.06)]',
              state.status === 'failed' && 'bg-gradient-to-br from-red-500/20 to-rose-500/20',
              (state.status === 'connecting' || state.status === 'created') && 'bg-[rgba(209,255,0,0.10)]'
            )}>
              {(state.status === 'connecting' || state.status === 'created' || state.status === 'running') && (
                <SpinnerIcon size={18} />
              )}
              {state.status === 'completed' && (
                <span style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' }}><CheckIcon size={18} /></span>
              )}
              {state.status === 'failed' && (
                <span className="text-red-400"><XIcon /></span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {state.workflowName || 'Executando Workflow'}
              </h2>
              <p className="text-xs text-white/50">
                {state.status === 'connecting' && 'Conectando ao servidor...'}
                {state.status === 'created' && 'Execução iniciada'}
                {state.status === 'running' && `Executando ${runningSteps > 0 ? `· ${runningSteps} step(s) ativos` : ''}`}
                {state.status === 'completed' && 'Todos os steps foram concluídos com sucesso'}
                {state.status === 'failed' && 'A execução encontrou um erro'}
              </p>
            </div>
          </div>

          {/* Metrics & Controls */}
          <div className="flex items-center gap-3">
            {/* Timer */}
            {state.status === 'running' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <ClockIcon size={14} />
                <span className="text-sm font-mono text-white/80">{formatElapsedTime(elapsedTime)}</span>
              </div>
            )}

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Diminuir zoom"
              >
                <ZoomOutIcon />
              </button>
              <span className="text-xs text-white/60 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Aumentar zoom"
              >
                <ZoomInIcon />
              </button>
            </div>

            <GlassButton variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Fechar workflow">
              <CloseIcon />
            </GlassButton>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-black/30 flex-shrink-0">
          <motion.div
            className={cn(
              'h-full',
              state.status === 'failed' && 'bg-gradient-to-r from-red-500 to-rose-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{
              ...( state.status !== 'failed' ? { background: 'linear-gradient(to right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))' } : {}),
              boxShadow: state.status !== 'failed' ? '0 0 10px rgba(209, 255, 0, 0.3)' : '0 0 10px rgba(239, 68, 68, 0.5)'
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">

          {/* ==========================================
              LEFT SIDEBAR - Operations
          ========================================== */}
          <div
            className="w-80 border-r border-white/10 flex flex-col overflow-hidden backdrop-blur-xl"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 0% 100%, rgba(209, 255, 0, 0.06) 0%, transparent 50%),
                radial-gradient(ellipse 60% 80% at 100% 0%, rgba(209, 255, 0, 0.04) 0%, transparent 50%),
                var(--glass-background-panel, rgba(15,15,17,0.92))
              `
            }}
          >
            {/* Execution Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))' }}>
                  <RocketIcon />
                </div>
                <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Execução Ativa
                </h2>
                <Badge variant="count" size="sm" className="ml-auto">
                  #{state.executionId?.slice(-6) || '...'}
                </Badge>
              </div>

              {/* Orchestration Plan (if available) */}
              {orchestrationPlan && (orchestrationPlan.phase === 'analyzing' || orchestrationPlan.phase === 'planning') && (
                <div
                  className="relative rounded-xl p-3 mb-3 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.08) 0%, rgba(209, 255, 0, 0.04) 100%)',
                    border: '1px solid rgba(209, 255, 0, 0.15)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <SpinnerIcon size={14} />
                    <span className="text-xs font-semibold" style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 65%, transparent)' }}>
                      {orchestrationPlan.phase === 'analyzing' ? 'Analisando demanda...' : 'Criando plano de execução...'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50">
                    O orquestrador está selecionando os melhores squads e agentes para sua demanda.
                  </p>
                </div>
              )}

              {/* Orchestration Analysis */}
              {orchestrationPlan?.analysis && (
                <div
                  className="relative rounded-xl p-3 mb-3 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.06) 0%, transparent 100%)',
                    border: '1px solid rgba(209, 255, 0, 0.12)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 65%, transparent)' }}>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 65%, transparent)' }}>Análise do Orquestrador</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{orchestrationPlan.analysis}</p>
                  {orchestrationPlan.expectedOutputs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-[10px] text-white/60 mb-1">Outputs esperados:</p>
                      <div className="flex flex-wrap gap-1">
                        {orchestrationPlan.expectedOutputs.map((output, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(209,255,0,0.08)]" style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 65%, transparent)' }}>
                            {output}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Card */}
              <div
                className="relative rounded-xl p-3 transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.06) 0%, rgba(209, 255, 0, 0.04) 100%)',
                  border: '1px solid rgba(209, 255, 0, 0.12)'
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Progresso geral</span>
                    <span className="text-white font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ background: 'linear-gradient(to right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))', boxShadow: '0 0 10px rgba(209, 255, 0, 0.3)' }}
                    />
                  </div>
                  <p className="text-[10px] text-white/60">
                    {completedSteps} de {totalSteps} steps concluídos
                    {state.startedAt && ` · ${formatDuration(state.startedAt, state.completedAt || undefined)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Steps Log */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 80%, #000))' }}>
                  <ActivityIcon />
                </div>
                <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Log de Steps
                </h2>
                <Badge variant="count" size="sm" className="ml-auto">
                  {totalSteps}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto glass-scrollbar px-4 pb-4" tabIndex={0} role="region" aria-label="Passos do workflow">
                {state.steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/60 py-8">
                    <SpinnerIcon size={24} />
                    <p className="mt-3 text-sm">Aguardando steps...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.steps.map((step, index) => {
                      const output = step.output as StepOutput | undefined;
                      const agent = output?.agent;
                      const squadType = agent?.squad || STEP_TYPE_TO_SQUAD[step.type] || 'orchestrator';
                      const style = getSquadStyle(squadType);
                      const isSelected = selectedNodeId === step.id;

                      return (
                        <motion.button
                          key={step.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setSelectedNodeId(step.id)}
                          className={cn(
                            'w-full rounded-xl p-3 border-l-2 transition-all text-left hover:translate-x-1',
                            style.border,
                            `bg-gradient-to-r ${style.bg} to-transparent`,
                            isSelected && 'ring-1 ring-white/30'
                          )}
                          style={{ border: '1px solid var(--glass-border-color-subtle)', borderLeftWidth: '2px' }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={agent?.name || `Step ${index + 1}`}
                                size="sm"
                                squadType={squadType as SquadType}
                              />
                              <span className="text-white text-xs font-medium">
                                {agent?.name || `Step ${index + 1}`}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border',
                                step.status === 'running' && 'bg-[rgba(209,255,0,0.12)] border-[rgba(209,255,0,0.2)]',
                                step.status === 'completed' && 'bg-[rgba(209,255,0,0.08)] border-[rgba(209,255,0,0.15)]',
                                step.status === 'failed' && 'bg-red-500/20 text-red-400 border-red-500/30',
                                step.status === 'pending' && 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                              )}
                              style={
                                step.status === 'running' ? { color: 'var(--color-accent, #D1FF00)' } :
                                step.status === 'completed' ? { color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' } :
                                undefined
                              }
                            >
                              {step.status === 'running' && <SpinnerIcon size={10} />}
                              {step.status === 'completed' && <CheckIcon size={10} />}
                              {step.status === 'pending' && <ClockIcon size={10} />}
                              {step.status === 'failed' && <XIcon />}
                              <span>
                                {step.status === 'running' ? 'Executando' :
                                 step.status === 'completed' ? 'Concluído' :
                                 step.status === 'failed' ? 'Erro' : 'Pendente'}
                              </span>
                            </span>
                          </div>

                          <p className="text-white/60 text-xs mb-1.5 line-clamp-2">
                            {output?.role || STEP_TYPE_LABELS[step.type] || step.type}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-white/60">
                            <span>{agent?.squad || squadType}</span>
                            {step.startedAt && <span>{formatDuration(step.startedAt, step.completedAt)}</span>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatBox label="Concluídos" value={completedSteps} color="green" />
                <StatBox label="Em execução" value={runningSteps} color="orange" />
                <StatBox label="Pendentes" value={pendingSteps} color="gray" />
              </div>
            </div>
          </div>

          {/* ==========================================
              CENTER - Canvas
          ========================================== */}
          <div className="flex-1 relative">
            {state.steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/60">
                <SpinnerIcon size={40} />
                <p className="mt-4 text-lg">Preparando execução...</p>
                <p className="mt-1 text-sm">Aguardando dados do workflow</p>
              </div>
            ) : (
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                zoom={zoom}
                onZoomChange={setZoom}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            )}
          </div>

          {/* ==========================================
              RIGHT SIDEBAR - Node Details
          ========================================== */}
          <AnimatePresence>
            {(selectedStep || isStartNode || isEndNode) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-white/10 flex flex-col overflow-hidden backdrop-blur-xl"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 50% at 100% 100%, rgba(209, 255, 0, 0.04) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 80% at 0% 0%, rgba(209, 255, 0, 0.05) 0%, transparent 50%),
                    var(--glass-background-panel, rgba(15,15,17,0.92))
                  `
                }}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-6 w-6 rounded-lg flex items-center justify-center',
                        isEndNode && state.status !== 'completed' && 'bg-gradient-to-br from-gray-500 to-slate-500'
                      )}
                      style={{
                        background: isStartNode
                          ? 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))'
                          : isEndNode && state.status === 'completed'
                            ? 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 50%, #000))'
                            : !isStartNode && !isEndNode
                              ? 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))'
                              : undefined
                      }}
                    >
                      {isStartNode ? <RocketIcon /> : isEndNode ? <TargetIcon /> : <TargetIcon />}
                    </div>
                    <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      {isStartNode ? 'Início do Workflow' : isEndNode ? 'Resultado Final' : 'Detalhes do Step'}
                    </h2>
                  </div>
                  <GlassButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedNodeId(null)} aria-label="Fechar detalhes">
                    <CloseIcon />
                  </GlassButton>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto glass-scrollbar p-4 space-y-4">

                  {/* ========== START NODE ========== */}
                  {isStartNode && (
                    <>
                      {/* Workflow Info */}
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[rgba(209,255,0,0.08)]">
                          <RocketIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white/90 font-semibold">{state.workflowName || 'Workflow'}</h3>
                          <p className="text-white/60 text-sm">{totalSteps} etapas planejadas</p>
                        </div>
                        <Badge variant="status" status="success" size="sm">Iniciado</Badge>
                      </div>

                      {/* Demand/Input */}
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.06) 0%, transparent 100%)',
                          border: '1px solid rgba(209, 255, 0, 0.12)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))' }}>
                            <MessageIcon />
                          </div>
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Demanda Solicitada</span>
                        </div>
                        <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                          {(state.input?.demand as string) || (state.input?.message as string) || 'Demanda não especificada'}
                        </p>
                      </div>

                      {/* Expected Outputs */}
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 65%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 40%, #000))' }}>
                            <TargetIcon />
                          </div>
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Outputs Esperados</span>
                        </div>
                        <ul className="space-y-2 text-sm text-white/80">
                          {state.steps.map((step, idx) => {
                            const output = step.output as StepOutput | undefined;
                            const agentName = output?.agent?.name || `Step ${idx + 1}`;
                            const role = output?.role || STEP_TYPE_LABELS[step.type] || step.type;
                            return (
                              <li key={step.id} className="flex items-start gap-2">
                                <span className="text-white/60 text-xs mt-1">{idx + 1}.</span>
                                <div>
                                  <span className="text-white/90 font-medium">{agentName}</span>
                                  <span className="text-white/50"> — {role}</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Timeline Preview */}
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 50%, #000))' }}>
                            <ClockIcon size={10} />
                          </div>
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Status</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-white/5">
                            <p className="text-lg font-bold" style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' }}>{completedSteps}</p>
                            <p className="text-[10px] text-white/60">Concluídos</p>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5">
                            <p className="text-lg font-bold" style={{ color: 'var(--color-accent, #D1FF00)' }}>{runningSteps}</p>
                            <p className="text-[10px] text-white/60">Executando</p>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5">
                            <p className="text-lg font-bold text-gray-400">{pendingSteps}</p>
                            <p className="text-[10px] text-white/60">Pendentes</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ========== END NODE ========== */}
                  {isEndNode && (
                    <>
                      {/* Final Status */}
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-12 w-12 rounded-xl flex items-center justify-center',
                          state.status === 'completed' && 'bg-[rgba(209,255,0,0.10)]',
                          state.status === 'failed' && 'bg-gradient-to-br from-red-500/30 to-rose-500/30',
                          state.status === 'running' && 'bg-[rgba(209,255,0,0.12)]'
                        )}>
                          {state.status === 'completed' && <span style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' }}><CheckIcon size={20} /></span>}
                          {state.status === 'failed' && <span className="text-red-400"><XIcon /></span>}
                          {state.status === 'running' && <SpinnerIcon size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white/90 font-semibold">
                            {state.status === 'completed' ? 'Workflow Concluído' :
                             state.status === 'failed' ? 'Workflow Falhou' : 'Em Execução'}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {completedSteps}/{totalSteps} etapas · {formatDuration(state.startedAt, state.completedAt)}
                          </p>
                        </div>
                        <Badge
                          variant="status"
                          status={state.status === 'completed' ? 'success' : state.status === 'failed' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {state.status === 'completed' && 'Sucesso'}
                          {state.status === 'failed' && 'Erro'}
                          {state.status === 'running' && 'Executando'}
                        </Badge>
                      </div>

                      {/* Original Demand */}
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))' }}>
                            <MessageIcon />
                          </div>
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Demanda Original</span>
                        </div>
                        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed line-clamp-3">
                          {(state.input?.demand as string) || (state.input?.message as string) || 'Demanda não especificada'}
                        </p>
                      </div>

                      {/* All Outputs Summary */}
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 65%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 40%, #000))' }}>
                            <FileTextIcon />
                          </div>
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Produção de Cada Etapa</span>
                        </div>
                        <div className="space-y-3">
                          {state.steps.filter(s => s.status === 'completed').map((step, idx) => {
                            const output = step.output as StepOutput | undefined;
                            const agentName = output?.agent?.name || `Step ${idx + 1}`;
                            const squadType = output?.agent?.squad || 'orchestrator';
                            const response = output?.response || '';
                            const style = getSquadStyle(squadType);

                            return (
                              <div
                                key={step.id}
                                className={cn('rounded-lg p-2 border-l-2', style.border)}
                                style={{ background: 'var(--color-background-disabled)' }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar name={agentName} size="sm" squadType={squadType as SquadType} />
                                  <span className="text-xs font-medium text-white/80">{agentName}</span>
                                  <span className="text-[10px] text-white/60 ml-auto">{squadType}</span>
                                </div>
                                <p className="text-xs text-white/60 line-clamp-2">{response || 'Sem resposta'}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Final Result */}
                      {state.status === 'completed' && state.steps.length > 0 && (
                        <div
                          className="rounded-xl p-3"
                          style={{
                            background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.06) 0%, transparent 100%)',
                            border: '1px solid rgba(209, 255, 0, 0.12)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 50%, #000))' }}>
                                <CheckIcon size={10} />
                              </div>
                              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Resultado Final</span>
                            </div>
                            {(() => {
                              const lastStep = [...state.steps].reverse().find(s => s.status === 'completed');
                              const response = (lastStep?.output as StepOutput | undefined)?.response || '';
                              return response ? (
                                <button
                                  onClick={() => handleCopy(response)}
                                  className={cn(
                                    'p-1.5 rounded-lg transition-all',
                                    copiedText === response ? 'bg-[rgba(209,255,0,0.08)]' : 'hover:bg-white/10 text-white/60 hover:text-white'
                                  )}
                                  style={copiedText === response ? { color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' } : undefined}
                                  aria-label="Copiar resultado"
                                >
                                  {copiedText === response ? <CheckIcon size={12} /> : <CopyIcon />}
                                </button>
                              ) : null;
                            })()}
                          </div>
                          <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed max-h-64 overflow-auto">
                            {(() => {
                              const lastStep = [...state.steps].reverse().find(s => s.status === 'completed');
                              return (lastStep?.output as StepOutput | undefined)?.response || 'Nenhum resultado disponível';
                            })()}
                          </p>
                        </div>
                      )}

                      {/* Error if failed */}
                      {state.status === 'failed' && state.error && (
                        <div
                          className="rounded-xl p-3 border-l-2 border-red-500"
                          style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderLeftWidth: '2px'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <XIcon />
                            <span className="text-xs font-semibold text-red-400">Erro</span>
                          </div>
                          <p className="text-sm text-red-300">{state.error}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ========== SPECIALIST STEP ========== */}
                  {selectedStep && !isStartNode && !isEndNode && (() => {
                    const output = selectedStep.output as StepOutput | undefined;
                    const config = selectedStep.config;
                    const agent = output?.agent;
                    // Use config for agent info before completion, output.agent after completion
                    const agentName = agent?.name || config?.agentId || selectedStep.name || `Step ${state.steps.indexOf(selectedStep) + 1}`;
                    const squadType = agent?.squad || config?.squadId || 'orchestrator';
                    const response = output?.response || '';
                    // Use config.message for step-specific request, or fallback to workflow input
                    const inputDemand = config?.message || (state.input?.demand as string) || (state.input?.message as string) || (typeof state.input === 'string' ? state.input : '');

                    return (
                      <>
                        {/* Agent Header */}
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={agentName}
                            size="lg"
                            squadType={squadType as SquadType}
                            status={selectedStep.status === 'running' ? 'online' : selectedStep.status === 'completed' ? 'online' : 'offline'}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white/90 font-semibold">
                              {agentName}
                            </h3>
                            <p className="text-white/60 text-sm">{squadType}</p>
                          </div>
                          <Badge
                            variant="status"
                            status={
                              selectedStep.status === 'completed' ? 'success' :
                              selectedStep.status === 'running' ? 'warning' :
                              selectedStep.status === 'failed' ? 'error' : 'offline'
                            }
                            size="sm"
                          >
                            {selectedStep.status === 'completed' && 'Concluído'}
                            {selectedStep.status === 'running' && 'Executando'}
                            {selectedStep.status === 'pending' && 'Pendente'}
                            {selectedStep.status === 'failed' && 'Erro'}
                          </Badge>
                        </div>

                        {/* Progress (Running) */}
                        {selectedStep.status === 'running' && (
                          <div
                            className="rounded-xl p-3 space-y-2"
                            style={{
                              background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.08) 0%, rgba(209, 255, 0, 0.04) 100%)',
                              border: '1px solid rgba(209, 255, 0, 0.15)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <SpinnerIcon size={14} />
                              <span className="text-xs font-semibold" style={{ color: 'var(--color-accent, #D1FF00)' }}>Processando...</span>
                            </div>
                            <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                style={{ width: '50%', background: 'linear-gradient(to right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))', boxShadow: '0 0 10px rgba(209, 255, 0, 0.3)' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Timing */}
                        {selectedStep.startedAt && (
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <ClockIcon size={12} />
                            <span>Duração: {formatDuration(selectedStep.startedAt, selectedStep.completedAt)}</span>
                          </div>
                        )}

                        {/* Input/Request - O QUE FOI SOLICITADO */}
                        <div
                          className="rounded-xl p-3"
                          style={{
                            background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.06) 0%, transparent 100%)',
                            border: '1px solid rgba(209, 255, 0, 0.12)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-accent, #D1FF00), color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000))' }}>
                              <MessageIcon />
                            </div>
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Solicitação Recebida</span>
                          </div>
                          <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed max-h-32 overflow-auto">
                            {inputDemand || 'Demanda do workflow'}
                          </p>
                        </div>

                        {/* Context from previous steps */}
                        {(() => {
                          const stepIndex = state.steps.indexOf(selectedStep);
                          const previousSteps = state.steps.slice(0, stepIndex).filter(s => s.status === 'completed');
                          if (previousSteps.length === 0) return null;

                          return (
                            <div
                              className="rounded-xl p-3"
                              style={{
                                background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 65%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 40%, #000))' }}>
                                  <ActivityIcon />
                                </div>
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Contexto Recebido</span>
                              </div>
                              <div className="space-y-2">
                                {previousSteps.map((prevStep) => {
                                  const prevOutput = prevStep.output as StepOutput | undefined;
                                  const prevConfig = prevStep.config;
                                  const prevAgent = prevOutput?.agent?.name || prevConfig?.agentId || prevStep.name || 'Step anterior';
                                  const prevResponse = prevOutput?.response || '';
                                  return (
                                    <div key={prevStep.id} className="text-xs">
                                      <span className="text-white/60 font-medium">{prevAgent}:</span>
                                      <p className="text-white/50 line-clamp-2 mt-0.5">{prevResponse.substring(0, 150)}...</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Role/Function */}
                        {(output?.role || config?.role) && (
                          <div
                            className="rounded-xl p-3"
                            style={{
                              background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 80%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 55%, #000))' }}>
                                <CpuIcon />
                              </div>
                              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Papel no Workflow</span>
                            </div>
                            <p className="text-sm text-white/90 capitalize">{output?.role || config?.role}</p>
                          </div>
                        )}

                        {/* Response - OUTPUT PRODUZIDO */}
                        {response && (
                          <div
                            className="rounded-xl p-3"
                            style={{
                              background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.06) 0%, transparent 100%)',
                              border: '1px solid rgba(209, 255, 0, 0.12)'
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 70%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 50%, #000))' }}>
                                  <FileTextIcon />
                                </div>
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Output Produzido</span>
                              </div>
                              <button
                                onClick={() => handleCopy(response)}
                                className={cn(
                                  'p-1.5 rounded-lg transition-all',
                                  copiedText === response ? 'bg-[rgba(209,255,0,0.08)]' : 'hover:bg-white/10 text-white/60 hover:text-white'
                                )}
                                style={copiedText === response ? { color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' } : undefined}
                                aria-label="Copiar output"
                              >
                                {copiedText === response ? <CheckIcon size={12} /> : <CopyIcon />}
                              </button>
                            </div>
                            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-auto">
                              {response}
                            </p>
                          </div>
                        )}

                        {/* LLM Metadata */}
                        {output?.llmMetadata && (
                          <div
                            className="rounded-xl p-3"
                            style={{
                              background: 'linear-gradient(135deg, rgba(209, 255, 0, 0.04) 0%, transparent 100%)',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent, #D1FF00) 60%, #000), color-mix(in srgb, var(--color-accent, #D1FF00) 40%, #000))' }}>
                                <CpuIcon />
                              </div>
                              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Modelo LLM</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-white/50">Provider</span>
                                <span className="text-white">{output.llmMetadata.provider}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Model</span>
                                <span className="text-white font-mono text-[10px]">{output.llmMetadata.model}</span>
                              </div>
                              {output.llmMetadata.inputTokens && (
                                <div className="flex justify-between">
                                  <span className="text-white/50">Input</span>
                                  <span className="text-white">{output.llmMetadata.inputTokens} tokens</span>
                                </div>
                              )}
                              {output.llmMetadata.outputTokens && (
                                <div className="flex justify-between">
                                  <span className="text-white/50">Output</span>
                                  <span className="text-white">{output.llmMetadata.outputTokens} tokens</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Error */}
                        {selectedStep.status === 'failed' && selectedStep.error && (
                          <div
                            className="rounded-xl p-3 border-l-2 border-red-500"
                            style={{
                              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderLeftWidth: '2px'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <XIcon />
                              <span className="text-xs font-semibold text-red-400">Erro</span>
                            </div>
                            <p className="text-sm text-red-300">{selectedStep.error}</p>
                          </div>
                        )}

                        {/* Raw JSON */}
                        {output && (
                          <details className="text-xs">
                            <summary className="text-white/60 cursor-pointer hover:text-white/80 py-2 flex items-center gap-2">
                              <CodeIcon />
                              <span>Ver JSON completo</span>
                            </summary>
                            <pre className="mt-2 p-3 bg-black/30 rounded-xl overflow-x-auto text-white/60 text-[10px] leading-relaxed">
                              {JSON.stringify(output, null, 2)}
                            </pre>
                          </details>
                        )}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Result Summary */}
        {(state.status === 'completed' || state.status === 'failed') && (
          <div className={cn(
            'border-t border-white/10 p-4 flex items-center justify-between flex-shrink-0',
            state.status === 'completed' && 'bg-[rgba(209,255,0,0.06)]',
            state.status === 'failed' && 'bg-gradient-to-r from-red-500/10 to-transparent'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                state.status === 'completed' ? 'bg-[rgba(209,255,0,0.10)]' : 'bg-gradient-to-br from-red-500/30 to-rose-500/30'
              )}>
                {state.status === 'completed' ? (
                  <span style={{ color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' }}><CheckIcon size={18} /></span>
                ) : (
                  <span className="text-red-400"><XIcon /></span>
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'font-semibold',
                    state.status !== 'completed' && 'text-red-400'
                  )}
                  style={state.status === 'completed' ? { color: 'color-mix(in srgb, var(--color-accent, #D1FF00) 70%, transparent)' } : undefined}
                >
                  {state.status === 'completed' ? 'Execução Concluída!' : 'Execução Falhou'}
                </p>
                <p className="text-xs text-white/50">
                  {completedSteps}/{totalSteps} steps · {formatDuration(state.startedAt, state.completedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {state.status === 'completed' && state.steps.length > 0 && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const lastCompleted = [...state.steps].reverse().find(s => s.status === 'completed');
                    if (lastCompleted) setSelectedNodeId(lastCompleted.id);
                  }}
                >
                  Ver Resultado Final
                </GlassButton>
              )}
              <GlassButton variant="primary" onClick={onClose}>
                Fechar
              </GlassButton>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function StatBox({ label, value, color }: { label: string; value: number; color: 'green' | 'orange' | 'gray' }) {
  const colors = {
    green: {
      text: 'text-status-success-muted',
      bg: 'from-status-success-20',
      glowVar: 'var(--color-status-success)',
    },
    orange: {
      text: 'text-squad-copywriting-muted',
      bg: 'from-squad-copywriting-20',
      glowVar: 'var(--squad-copywriting-default)',
    },
    gray: {
      text: 'text-squad-default-muted',
      bg: 'from-squad-default-20',
      glowVar: 'var(--squad-default-default)',
    },
  };

  const style = colors[color];

  return (
    <div
      className={cn('rounded-xl p-2.5 bg-gradient-to-b to-transparent border border-white/5', style.bg)}
      style={{
        boxShadow: value > 0 ? `0 0 15px color-mix(in srgb, ${style.glowVar} 30%, transparent)` : 'none'
      }}
    >
      <p className={cn('text-xl font-bold', style.text)}>{value}</p>
      <p className="text-[10px] text-white/60">{label}</p>
    </div>
  );
}
