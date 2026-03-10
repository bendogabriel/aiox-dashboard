/**
 * ReviewQueue — Admin review queue for submitted agents
 * Story 4.6
 */
import { useState, memo } from 'react';
import {
  ArrowLeft, Check, X, AlertTriangle, Clock,
  ChevronDown, ChevronRight, User, Bot,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useSubmissionQueue } from '../../../hooks/useMarketplaceSeller';
import { SellerBadge, CategoryBadge } from '../shared';
import type { MarketplaceSubmission, ReviewChecklist } from '../../../types/marketplace';

// --- Checklist items ---
const CHECKLIST_ITEMS: { key: keyof ReviewChecklist; label: string }[] = [
  { key: 'schema_valid', label: 'Schema valido' },
  { key: 'metadata_complete', label: 'Metadata completa' },
  { key: 'persona_defined', label: 'Persona definida' },
  { key: 'commands_documented', label: 'Comandos documentados' },
  { key: 'capabilities_realistic', label: 'Capabilities realistas' },
  { key: 'pricing_coherent', label: 'Pricing coerente' },
  { key: 'sandbox_passed', label: 'Sandbox passed' },
  { key: 'security_clean', label: 'Seguranca limpa' },
  { key: 'output_quality', label: 'Qualidade de output' },
  { key: 'documentation_adequate', label: 'Documentacao adequada' },
];

// --- Submission Card ---
const SubmissionCard = memo(function SubmissionCard({
  submission,
  isSelected,
  onSelect,
}: {
  submission: MarketplaceSubmission;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left p-3 transition-colors
        ${isSelected
          ? 'bg-[var(--aiox-lime,#D1FF00)]/5 border border-[var(--aiox-lime,#D1FF00)]/30'
          : 'bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] text-[var(--aiox-lime,#D1FF00)] shrink-0">
          <Bot size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)] truncate">
            {submission.listing?.name ?? 'Agente'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {submission.seller && (
              <>
                <span className="text-[10px] text-[var(--color-text-secondary,#999)]">
                  {submission.seller.display_name}
                </span>
                <SellerBadge verification={submission.seller.verification} showLabel={false} />
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
              v{submission.version}
            </span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
              {new Date(submission.submitted_at).toLocaleDateString('pt-BR')}
            </span>
            {submission.auto_test_score != null && (
              <span className={`text-[10px] font-mono ${submission.auto_test_score >= 7 ? 'text-[var(--status-success,#4ADE80)]' : 'text-[var(--bb-warning,#f59e0b)]'}`}>
                Auto: {submission.auto_test_score}/10
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={12} className="text-[var(--color-text-muted,#666)] shrink-0 mt-1" />
      </div>
    </button>
  );
});

// --- Review Panel ---
function ReviewPanel({
  submission,
  onDecision,
}: {
  submission: MarketplaceSubmission;
  onDecision: (decision: 'approved' | 'rejected' | 'needs_changes', notes: string) => void;
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(CHECKLIST_ITEMS.map(({ key }) => [key, submission.review_checklist?.[key] ?? null])),
  );
  const [notes, setNotes] = useState(submission.review_notes ?? '');

  const passedCount = Object.values(checklist).filter((v) => v === true).length;
  const score = passedCount;

  const toggleItem = (key: string) => {
    setChecklist((prev) => {
      const current = prev[key];
      // Cycle: null → true → false → null
      const next = current === null ? true : current === true ? false : null;
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="space-y-4">
      {/* Submission header */}
      <div>
        <h2 className="font-mono text-sm font-semibold text-[var(--color-text-primary,#fff)]">
          {submission.listing?.name}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          {submission.listing && <CategoryBadge category={submission.listing.category} />}
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
            v{submission.version}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">
            Review Checklist
          </h3>
          <span className={`text-xs font-mono font-semibold ${score >= 7 ? 'text-[var(--status-success,#4ADE80)]' : score >= 5 ? 'text-[var(--bb-warning,#f59e0b)]' : 'text-[var(--bb-error,#EF4444)]'}`}>
            {score}/10
          </span>
        </div>
        <div className="space-y-1.5">
          {CHECKLIST_ITEMS.map(({ key, label }) => {
            const value = checklist[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleItem(key)}
                className="w-full flex items-center gap-2.5 p-2 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)] transition-colors text-left"
              >
                <div className={`
                  w-4 h-4 flex items-center justify-center border shrink-0
                  ${value === true
                    ? 'bg-[var(--status-success,#4ADE80)] border-[var(--status-success,#4ADE80)]'
                    : value === false
                      ? 'bg-[var(--bb-error,#EF4444)] border-[var(--bb-error,#EF4444)]'
                      : 'border-[var(--color-border-default,#333)]'
                  }
                `}>
                  {value === true && <Check size={10} className="text-[var(--aiox-dark,#050505)]" />}
                  {value === false && <X size={10} className="text-white" />}
                </div>
                <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
          Notas do Reviewer
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="
            w-full px-3 py-2 text-sm font-mono resize-none
            bg-[var(--color-bg-surface,#0a0a0a)]
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-primary,#fff)]
            placeholder:text-[var(--color-text-muted,#666)]
            focus:outline-none focus:border-[var(--aiox-lime,#D1FF00)]/50
          "
          placeholder="Observacoes, feedback, motivo da rejeicao..."
        />
      </div>

      {/* Decision buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onDecision('approved', notes)}
          disabled={score < 7}
          className="
            flex-1 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold
            bg-[var(--status-success,#4ADE80)] text-[var(--aiox-dark,#050505)]
            hover:bg-[var(--status-success,#4ADE80)]/90
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-1.5
          "
        >
          <Check size={12} />
          Aprovar
        </button>
        <button
          type="button"
          onClick={() => onDecision('needs_changes', notes)}
          className="
            flex-1 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold
            bg-[var(--bb-warning,#f59e0b)] text-[var(--aiox-dark,#050505)]
            hover:bg-[var(--bb-warning,#f59e0b)]/90
            transition-colors flex items-center justify-center gap-1.5
          "
        >
          <AlertTriangle size={12} />
          Pedir Alteracoes
        </button>
        <button
          type="button"
          onClick={() => onDecision('rejected', notes)}
          className="
            flex-1 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold
            bg-[var(--bb-error,#EF4444)] text-white
            hover:bg-[var(--bb-error,#EF4444)]/90
            transition-colors flex items-center justify-center gap-1.5
          "
        >
          <X size={12} />
          Rejeitar
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ReviewQueue() {
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const { data, isLoading } = useSubmissionQueue();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const submissions = (data?.data ?? []) as MarketplaceSubmission[];
  const selected = submissions.find((s) => s.id === selectedId);

  const handleDecision = async (
    decision: 'approved' | 'rejected' | 'needs_changes',
    notes: string,
  ) => {
    // In production: call marketplaceService.updateSubmissionReview(...)
    console.log('Decision:', decision, 'Notes:', notes, 'Submission:', selectedId);
    setSelectedId(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border-default,#333)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('marketplace' as never)}
            className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
            Review Queue
          </h1>
          {submissions.length > 0 && (
            <span className="text-xs font-mono text-[var(--color-text-muted,#666)]">
              ({submissions.length} pendentes)
            </span>
          )}
        </div>
      </div>

      {/* Content: List + Detail panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Submission list */}
        <div className="w-80 shrink-0 border-r border-[var(--color-border-default,#333)] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Clock size={24} className="text-[var(--color-text-muted,#666)] mb-2" />
              <p className="text-xs font-mono text-[var(--color-text-muted,#666)] uppercase tracking-wider text-center">
                Nenhuma submissao pendente
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {submissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  isSelected={selectedId === sub.id}
                  onSelect={() => setSelectedId(sub.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Review panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {selected ? (
            <ReviewPanel submission={selected} onDecision={handleDecision} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs font-mono text-[var(--color-text-muted,#666)] uppercase tracking-wider">
                Selecione uma submissao para revisar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
