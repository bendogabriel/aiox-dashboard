/**
 * SellerResponse — Seller can respond to a review
 * Story 5.2
 */
import { useState } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';

interface SellerResponseProps {
  reviewId: string;
  existingResponse?: string | null;
  onSubmit: (reviewId: string, response: string) => void;
  isSubmitting?: boolean;
}

export function SellerResponse({
  reviewId,
  existingResponse,
  onSubmit,
  isSubmitting = false,
}: SellerResponseProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [response, setResponse] = useState(existingResponse ?? '');

  if (existingResponse && !isEditing) {
    return (
      <div className="ml-8 mt-2 p-3 bg-[var(--color-bg-elevated,#1a1a1a)] border-l-2 border-[var(--aiox-lime,#D1FF00)]/30">
        <div className="flex items-center gap-1.5 mb-1">
          <MessageSquare size={10} className="text-[var(--aiox-lime,#D1FF00)]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--aiox-lime,#D1FF00)]">
            Resposta do Seller
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary,#999)]">
          {existingResponse}
        </p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="
          ml-8 mt-1 text-[10px] font-mono uppercase tracking-wider
          text-[var(--color-text-muted,#666)] hover:text-[var(--aiox-lime,#D1FF00)]
          transition-colors
        "
      >
        + Responder
      </button>
    );
  }

  return (
    <div className="ml-8 mt-2 space-y-2">
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Responda ao review..."
        className="
          w-full px-3 py-2 text-xs font-mono resize-none
          bg-[var(--color-bg-elevated,#1a1a1a)]
          border border-[var(--color-border-default,#333)]
          text-[var(--color-text-primary,#fff)]
          placeholder:text-[var(--color-text-muted,#666)]
          focus:outline-none focus:border-[var(--aiox-lime,#D1FF00)]/50
        "
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => { onSubmit(reviewId, response.trim()); setIsEditing(false); }}
          disabled={!response.trim() || isSubmitting}
          className="
            px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold
            bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
            hover:bg-[var(--aiox-lime,#D1FF00)]/90
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors flex items-center gap-1
          "
        >
          <Send size={10} />
          Enviar
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="
            px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider
            text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)]
            transition-colors flex items-center gap-1
          "
        >
          <X size={10} />
          Cancelar
        </button>
      </div>
    </div>
  );
}
