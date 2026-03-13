import { useState } from 'react';
import {
  Clock,
  Hash,
  User,
  Network,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Dialog, CockpitButton, CockpitCard, useToast } from '../ui';
import { cn } from '../../lib/utils';
import { useGetJob, useCancelJob } from '../../hooks/useEngine';
import JobLogsViewer from './JobLogsViewer';
import type { EngineJob } from '../../services/api/engine';

interface JobDetailModalProps {
  jobId: string | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  done: 'text-[var(--color-status-success)]',
  running: 'text-[var(--aiox-blue)]',
  pending: 'text-[var(--bb-warning)]',
  failed: 'text-[var(--bb-error)]',
  rejected: 'text-[var(--bb-flare)]',
  cancelled: 'text-tertiary',
  timeout: 'text-[var(--bb-error)]',
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  done: CheckCircle2,
  running: Loader2,
  pending: Circle,
  failed: XCircle,
  rejected: AlertTriangle,
  cancelled: XCircle,
  timeout: AlertTriangle,
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

function formatDuration(start?: string, end?: string): string {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: typeof Clock;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-tertiary flex-shrink-0" />
      <span className="text-xs text-tertiary w-24 flex-shrink-0">{label}</span>
      <span className={cn('text-sm text-primary truncate', mono && 'font-mono text-xs')}>
        {value}
      </span>
    </div>
  );
}

export default function JobDetailModal({ jobId, onClose }: JobDetailModalProps) {
  const { data, isLoading, isError, error } = useGetJob(jobId);
  const cancelJob = useCancelJob();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const job: EngineJob | undefined = data?.job;
  const StatusIcon = job ? (statusIcons[job.status] || Circle) : Circle;
  const canCancel = job?.status === 'running' || job?.status === 'pending';

  function handleCopyId() {
    if (!job) return;
    navigator.clipboard.writeText(job.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleCancel() {
    if (!job) return;
    cancelJob.mutate(job.id, {
      onSuccess: () => {
        toast.success('Job cancelado', job.id.slice(0, 12));
        setShowCancelConfirm(false);
        onClose();
      },
    });
  }

  const footer = job ? (
    <div className="flex items-center gap-2 w-full justify-between">
      <div className="flex items-center gap-2">
        <StatusIcon
          className={cn(
            'h-4 w-4',
            statusColors[job.status],
            job.status === 'running' && 'animate-spin',
          )}
        />
        <span className={cn('text-sm font-medium', statusColors[job.status])}>
          {job.status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {canCancel && !showCancelConfirm && (
          <CockpitButton
            size="sm"
            variant="destructive"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancelar Job
          </CockpitButton>
        )}
        {showCancelConfirm && (
          <>
            <span className="text-xs text-[var(--bb-error)]">Confirmar cancelamento?</span>
            <CockpitButton
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              loading={cancelJob.isPending}
            >
              Sim, cancelar
            </CockpitButton>
            <CockpitButton
              size="sm"
              variant="ghost"
              onClick={() => setShowCancelConfirm(false)}
            >
              Não
            </CockpitButton>
          </>
        )}
      </div>
    </div>
  ) : undefined;

  return (
    <Dialog
      isOpen={!!jobId}
      onClose={onClose}
      title="Job Detail"
      size="lg"
      footer={footer}
    >
      {isError ? (
        <div className="text-sm p-6 text-center space-y-2">
          <XCircle className="h-8 w-8 text-[var(--bb-error)] mx-auto" />
          <p className="text-[var(--bb-error)]">Erro ao carregar job</p>
          <p className="text-xs text-tertiary">{(error as Error)?.message || 'Job não encontrado'}</p>
          <p className="text-[10px] text-tertiary font-mono">{jobId}</p>
        </div>
      ) : !job && isLoading ? (
        <div className="text-secondary text-sm p-6 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--aiox-blue)]" />
          <p>Carregando detalhes do job...</p>
          <p className="text-[10px] text-tertiary font-mono">{jobId}</p>
        </div>
      ) : !job ? (
        <div className="text-sm p-6 text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-[var(--bb-warning)] mx-auto" />
          <p className="text-tertiary">Job não encontrado</p>
          <p className="text-[10px] text-tertiary font-mono">{jobId}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ID + Copy */}
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-tertiary flex-1 truncate">
              {job.id}
            </code>
            <CockpitButton size="sm" variant="ghost" onClick={handleCopyId} aria-label="Copiar ID">
              {copied ? <Check className="h-3 w-3 text-[var(--color-status-success)]" /> : <Copy className="h-3 w-3" />}
            </CockpitButton>
          </div>

          {/* Info grid */}
          <CockpitCard padding="sm" variant="subtle">
            <InfoRow icon={User} label="Agent" value={job.agent_id} />
            <InfoRow icon={Network} label="Squad" value={job.squad_id} />
            <InfoRow icon={Zap} label="Trigger" value={job.trigger_type} />
            <InfoRow icon={Hash} label="Priority" value={`P${job.priority}`} />
            <InfoRow icon={Hash} label="Attempt" value={`${job.attempt}${job.max_attempts ? ` / ${job.max_attempts}` : ''}`} />
            {job.pid && <InfoRow icon={Hash} label="PID" value={String(job.pid)} mono />}
          </CockpitCard>

          {/* Timestamps */}
          <CockpitCard padding="sm" variant="subtle">
            <InfoRow icon={Clock} label="Criado" value={formatDateTime(job.created_at)} />
            <InfoRow icon={Clock} label="Iniciado" value={formatDateTime(job.started_at)} />
            <InfoRow icon={Clock} label="Concluído" value={formatDateTime(job.completed_at)} />
            <InfoRow icon={Clock} label="Duração" value={formatDuration(job.started_at, job.completed_at)} />
          </CockpitCard>

          {/* Error */}
          {job.error_message && (
            <CockpitCard padding="sm" variant="subtle" className="border border-[var(--bb-error)]/20">
              <div className="text-xs text-tertiary mb-1">Erro</div>
              <div className="text-sm text-[var(--bb-error)] font-mono whitespace-pre-wrap break-all">
                {job.error_message}
              </div>
            </CockpitCard>
          )}

          {/* Logs */}
          <JobLogsViewer jobId={job.id} jobStatus={job.status} />

          {/* Output preview */}
          {job.output_result && (
            <CockpitCard padding="sm" variant="subtle">
              <div className="text-xs text-tertiary mb-1">Output</div>
              <pre className="text-xs text-secondary font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">
                {job.output_result.slice(0, 2000)}
                {job.output_result.length > 2000 && '\n... (truncated)'}
              </pre>
            </CockpitCard>
          )}
        </div>
      )}
    </Dialog>
  );
}
