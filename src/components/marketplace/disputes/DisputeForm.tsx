/**
 * DisputeForm — Open a dispute for a marketplace order
 * Story 3.5
 */
import { useState, memo } from 'react';
import {
  AlertTriangle, Send, X, Upload, Trash2,
} from 'lucide-react';
import type { MarketplaceOrder, DisputeReason } from '../../../types/marketplace';

interface DisputeFormProps {
  order: MarketplaceOrder;
  onSubmit: (dispute: DisputeFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface DisputeFormData {
  order_id: string;
  reason: DisputeReason;
  description: string;
  evidence: Array<{ url: string; type: string; description?: string }>;
}

const DISPUTE_REASONS: { value: DisputeReason; label: string; description: string }[] = [
  { value: 'non_delivery', label: 'Nao Entrega', description: 'O agente nao executou a tarefa solicitada' },
  { value: 'poor_quality', label: 'Qualidade Baixa', description: 'O resultado ficou muito abaixo do esperado' },
  { value: 'not_as_described', label: 'Diferente do Anunciado', description: 'O agente nao corresponde a descricao do listing' },
  { value: 'billing_error', label: 'Erro de Cobranca', description: 'Fui cobrado incorretamente' },
  { value: 'other', label: 'Outro', description: 'Outro motivo nao listado' },
];

export const DisputeForm = memo(function DisputeForm({
  order,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DisputeFormProps) {
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<Array<{ url: string; type: string; description?: string }>>([]);
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const canSubmit = reason !== null && description.trim().length >= 20 && !isSubmitting;

  const handleAddEvidence = () => {
    if (!evidenceUrl.trim()) return;
    setEvidence((prev) => [...prev, { url: evidenceUrl.trim(), type: 'url' }]);
    setEvidenceUrl('');
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!canSubmit || !reason) return;
    onSubmit({
      order_id: order.id,
      reason,
      description: description.trim(),
      evidence,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--bb-error,#EF4444)]/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[var(--bb-error,#EF4444)]" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--bb-error,#EF4444)]">
            Abrir Disputa
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Order reference */}
      <div className="p-2 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
        <p className="text-xs font-mono text-[var(--color-text-secondary,#999)]">
          Order: {order.listing?.name ?? 'Agente'} — {new Date(order.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Reason selection */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-2">
          Motivo da Disputa *
        </label>
        <div className="space-y-1.5">
          {DISPUTE_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`
                w-full text-left p-2.5 border transition-colors
                ${reason === r.value
                  ? 'bg-[var(--bb-error,#EF4444)]/5 border-[var(--bb-error,#EF4444)]/30'
                  : 'bg-[var(--color-bg-elevated,#1a1a1a)] border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)]'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className={`
                  w-3.5 h-3.5 border shrink-0 flex items-center justify-center
                  ${reason === r.value
                    ? 'bg-[var(--bb-error,#EF4444)] border-[var(--bb-error,#EF4444)]'
                    : 'border-[var(--color-border-default,#333)]'
                  }
                `}>
                  {reason === r.value && (
                    <div className="w-1.5 h-1.5 bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)]">
                    {r.label}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary,#999)]">
                    {r.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
          Descricao Detalhada * (minimo 20 caracteres)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Descreva o problema em detalhes. Inclua o que esperava, o que aconteceu, e quaisquer tentativas de resolver..."
          className="
            w-full px-3 py-2 text-sm font-mono resize-none
            bg-[var(--color-bg-elevated,#1a1a1a)]
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-primary,#fff)]
            placeholder:text-[var(--color-text-muted,#666)]
            focus:outline-none focus:border-[var(--bb-error,#EF4444)]/50
          "
        />
        <p className="text-[9px] font-mono text-[var(--color-text-muted,#666)] mt-0.5 text-right">
          {description.length}/2000
        </p>
      </div>

      {/* Evidence */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
          Evidencias (opcional)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="URL de screenshot ou evidencia..."
            className="
              flex-1 px-3 py-2 text-xs font-mono
              bg-[var(--color-bg-elevated,#1a1a1a)]
              border border-[var(--color-border-default,#333)]
              text-[var(--color-text-primary,#fff)]
              placeholder:text-[var(--color-text-muted,#666)]
              focus:outline-none focus:border-[var(--bb-error,#EF4444)]/50
            "
          />
          <button
            type="button"
            onClick={handleAddEvidence}
            disabled={!evidenceUrl.trim()}
            className="
              px-3 py-2 font-mono text-[10px] uppercase
              border border-[var(--color-border-default,#333)]
              text-[var(--color-text-secondary,#999)]
              hover:text-[var(--color-text-primary,#fff)]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors flex items-center gap-1
            "
          >
            <Upload size={10} />
            Adicionar
          </button>
        </div>
        {evidence.length > 0 && (
          <div className="mt-2 space-y-1">
            {evidence.map((e, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
                <span className="text-[10px] font-mono text-[var(--color-text-secondary,#999)] truncate flex-1">
                  {e.url}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveEvidence(i)}
                  className="p-0.5 text-[var(--color-text-muted,#666)] hover:text-[var(--bb-error,#EF4444)] transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="p-2.5 border border-[var(--bb-warning,#f59e0b)]/20 bg-[var(--bb-warning,#f59e0b)]/5">
        <p className="text-[10px] text-[var(--bb-warning,#f59e0b)]">
          Abrir uma disputa congela o escrow ate a resolucao. O seller tem 3 dias para responder.
          Se nao responder, a disputa e resolvida automaticamente em seu favor.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="
            flex-1 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold
            bg-[var(--bb-error,#EF4444)] text-white
            hover:bg-[var(--bb-error,#EF4444)]/90
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-1.5
          "
        >
          <Send size={12} />
          {isSubmitting ? 'Enviando...' : 'Abrir Disputa'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-2.5 font-mono text-xs uppercase tracking-wider
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-secondary,#999)]
            hover:text-[var(--color-text-primary,#fff)]
            hover:border-[var(--color-text-muted,#666)]
            transition-colors
          "
        >
          Cancelar
        </button>
      </div>
    </div>
  );
});

export default DisputeForm;
