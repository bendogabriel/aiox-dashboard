/**
 * DisputeTimeline — Shows dispute status progression
 * Story 3.5
 */
import {
  AlertTriangle, MessageSquare, Scale, CheckCircle,
  Clock, ArrowRight,
} from 'lucide-react';
import type { MarketplaceDispute, DisputeStatus } from '../../../types/marketplace';

interface DisputeTimelineProps {
  dispute: MarketplaceDispute;
}

const STEPS: { status: DisputeStatus; label: string; icon: typeof AlertTriangle }[] = [
  { status: 'open', label: 'Aberta', icon: AlertTriangle },
  { status: 'seller_response', label: 'Resposta Seller', icon: MessageSquare },
  { status: 'mediation', label: 'Mediacao', icon: Scale },
  { status: 'resolved', label: 'Resolvida', icon: CheckCircle },
];

const STATUS_ORDER: Record<DisputeStatus, number> = {
  open: 0,
  seller_response: 1,
  mediation: 2,
  resolved: 3,
  escalated: 3,
};

export function DisputeTimeline({ dispute }: DisputeTimelineProps) {
  const currentStep = STATUS_ORDER[dispute.status] ?? 0;

  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--bb-error,#EF4444)]/20">
      <div className="flex items-center gap-1.5 mb-3">
        <AlertTriangle size={12} className="text-[var(--bb-error,#EF4444)]" />
        <h3 className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--bb-error,#EF4444)]">
          Disputa #{dispute.id.slice(0, 8)}
        </h3>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-1 mb-4">
        {STEPS.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex items-center gap-1">
              <div className={`
                flex items-center gap-1 px-2 py-1
                ${isComplete
                  ? 'bg-[var(--status-success,#4ADE80)]/10 text-[var(--status-success,#4ADE80)]'
                  : isCurrent
                    ? 'bg-[var(--bb-error,#EF4444)]/10 text-[var(--bb-error,#EF4444)] border border-[var(--bb-error,#EF4444)]/30'
                    : 'text-[var(--color-text-muted,#666)]'
                }
              `}>
                <Icon size={10} />
                <span className="text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight size={10} className="text-[var(--color-text-muted,#666)] shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Details */}
      <div className="space-y-2">
        {/* Reason */}
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)] w-16 shrink-0 uppercase">
            Motivo:
          </span>
          <span className="text-xs text-[var(--color-text-secondary,#999)]">
            {REASON_LABELS[dispute.reason] ?? dispute.reason}
          </span>
        </div>

        {/* Description */}
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)] w-16 shrink-0 uppercase">
            Detalhes:
          </span>
          <p className="text-xs text-[var(--color-text-secondary,#999)]">
            {dispute.description}
          </p>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 pt-1">
          <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
            Aberta: {new Date(dispute.created_at).toLocaleDateString('pt-BR')}
          </span>
          {dispute.seller_responded_at && (
            <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
              Resp. Seller: {new Date(dispute.seller_responded_at).toLocaleDateString('pt-BR')}
            </span>
          )}
          {dispute.resolved_at && (
            <span className="text-[9px] font-mono text-[var(--status-success,#4ADE80)]">
              Resolvida: {new Date(dispute.resolved_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        {/* Resolution */}
        {dispute.resolution && (
          <div className="p-2 mt-1 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--status-success,#4ADE80)]/20">
            <span className="text-[10px] font-mono text-[var(--status-success,#4ADE80)] uppercase tracking-wider">
              Resolucao:
            </span>
            <p className="text-xs text-[var(--color-text-secondary,#999)] mt-0.5">
              {dispute.resolution}
            </p>
            {dispute.resolved_amount != null && (
              <p className="text-xs font-mono font-semibold text-[var(--status-success,#4ADE80)] mt-1">
                Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dispute.resolved_amount / 100)}
              </p>
            )}
          </div>
        )}

        {/* Seller response deadline warning */}
        {dispute.status === 'open' && !dispute.seller_responded_at && (
          <div className="flex items-center gap-1.5 pt-1">
            <Clock size={10} className="text-[var(--bb-warning,#f59e0b)]" />
            <span className="text-[10px] font-mono text-[var(--bb-warning,#f59e0b)]">
              Seller tem {daysRemaining(dispute.created_at, 3)} dias para responder
            </span>
          </div>
        )}

        {/* Evidence */}
        {dispute.evidence?.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)] uppercase tracking-wider">
              Evidencias ({dispute.evidence.length}):
            </span>
            <div className="mt-1 space-y-1">
              {dispute.evidence.map((e, i) => (
                <a
                  key={i}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[10px] font-mono text-[var(--bb-blue,#0099FF)] hover:underline truncate"
                >
                  {e.description || e.url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  non_delivery: 'Nao Entrega',
  poor_quality: 'Qualidade Baixa',
  not_as_described: 'Diferente do Anunciado',
  billing_error: 'Erro de Cobranca',
  other: 'Outro',
};

function daysRemaining(createdAt: string, deadline: number): number {
  const created = new Date(createdAt).getTime();
  const deadlineMs = created + deadline * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)));
  return remaining;
}
