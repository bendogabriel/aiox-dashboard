/**
 * ReviewForm — Interactive star-rating form for completed orders
 * Story 5.2
 */
import { useState, memo } from 'react';
import { Star, Send, X } from 'lucide-react';
import type { MarketplaceOrder } from '../../../types/marketplace';

interface ReviewFormProps {
  order: MarketplaceOrder;
  onSubmit: (review: ReviewFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface ReviewFormData {
  order_id: string;
  listing_id: string;
  rating_overall: number;
  rating_quality: number | null;
  rating_speed: number | null;
  rating_value: number | null;
  rating_accuracy: number | null;
  title: string;
  body: string;
}

// --- Interactive Star Rating ---
function StarRating({
  value,
  onChange,
  size = 20,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            size={size}
            className={
              (hover || value) >= star
                ? 'fill-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-lime,#D1FF00)]'
                : 'text-[var(--color-border-default,#333)]'
            }
          />
        </button>
      ))}
    </div>
  );
}

// --- Dimension Rating ---
function DimensionRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <StarRating value={value ?? 0} onChange={(v) => onChange(v)} size={14} />
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-0.5 text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)]"
          >
            <X size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main Form ---
export const ReviewForm = memo(function ReviewForm({
  order,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReviewFormProps) {
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingQuality, setRatingQuality] = useState<number | null>(null);
  const [ratingSpeed, setRatingSpeed] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [ratingAccuracy, setRatingAccuracy] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showDimensions, setShowDimensions] = useState(false);

  const canSubmit = ratingOverall > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      order_id: order.id,
      listing_id: order.listing_id,
      rating_overall: ratingOverall,
      rating_quality: ratingQuality,
      rating_speed: ratingSpeed,
      rating_value: ratingValue,
      rating_accuracy: ratingAccuracy,
      title: title.trim(),
      body: body.trim(),
    });
  };

  return (
    <div className="space-y-4 p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--color-text-primary,#fff)]">
          Avaliar {order.listing?.name ?? 'Agente'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Overall Rating */}
      <div className="text-center py-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-2">
          Avaliacao Geral
        </p>
        <StarRating value={ratingOverall} onChange={setRatingOverall} size={28} />
        {ratingOverall > 0 && (
          <p className="text-xs font-mono text-[var(--aiox-lime,#D1FF00)] mt-1">
            {ratingOverall}/5
          </p>
        )}
      </div>

      {/* Optional Dimensions */}
      <div>
        <button
          type="button"
          onClick={() => setShowDimensions(!showDimensions)}
          className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-secondary,#999)] transition-colors"
        >
          {showDimensions ? '- Ocultar dimensoes' : '+ Avaliar dimensoes (opcional)'}
        </button>
        {showDimensions && (
          <div className="space-y-2 mt-2 pl-2 border-l border-[var(--color-border-default,#333)]">
            <DimensionRating label="Qualidade" value={ratingQuality} onChange={setRatingQuality} />
            <DimensionRating label="Velocidade" value={ratingSpeed} onChange={setRatingSpeed} />
            <DimensionRating label="Custo-Beneficio" value={ratingValue} onChange={setRatingValue} />
            <DimensionRating label="Precisao" value={ratingAccuracy} onChange={setRatingAccuracy} />
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
          Titulo (opcional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Resumo da sua experiencia"
          className="
            w-full px-3 py-2 text-sm font-mono
            bg-[var(--color-bg-elevated,#1a1a1a)]
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-primary,#fff)]
            placeholder:text-[var(--color-text-muted,#666)]
            focus:outline-none focus:border-[var(--aiox-lime,#D1FF00)]/50
          "
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
          Comentario (opcional)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Descreva sua experiencia com este agente..."
          className="
            w-full px-3 py-2 text-sm font-mono resize-none
            bg-[var(--color-bg-elevated,#1a1a1a)]
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-primary,#fff)]
            placeholder:text-[var(--color-text-muted,#666)]
            focus:outline-none focus:border-[var(--aiox-lime,#D1FF00)]/50
          "
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="
            flex-1 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold
            bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
            hover:bg-[var(--aiox-lime,#D1FF00)]/90
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-1.5
          "
        >
          <Send size={12} />
          {isSubmitting ? 'Enviando...' : 'Enviar Avaliacao'}
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

      {/* Verified badge notice */}
      <p className="text-[10px] font-mono text-[var(--color-text-muted,#666)] text-center">
        Sua avaliacao recebera o selo "Compra Verificada"
      </p>
    </div>
  );
});

export default ReviewForm;
