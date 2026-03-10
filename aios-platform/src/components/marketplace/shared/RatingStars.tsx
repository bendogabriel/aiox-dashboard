import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function RatingStars({
  value,
  count,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const sizeMap = { sm: 12, md: 16, lg: 20 };
  const iconSize = sizeMap[size];

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((star) => {
          const filled = value >= star;
          const half = !filled && value >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(star)}
              className={`
                ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                focus:outline-none
              `}
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            >
              <Star
                size={iconSize}
                className={`
                  ${filled ? 'fill-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-lime,#D1FF00)]' : ''}
                  ${half ? 'fill-[var(--aiox-lime,#D1FF00)]/50 text-[var(--aiox-lime,#D1FF00)]' : ''}
                  ${!filled && !half ? 'text-[var(--color-text-muted,#666)]' : ''}
                `}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-mono text-[var(--color-text-secondary,#999)] ml-1">
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-[var(--color-text-muted,#666)] ml-1">
          ({count})
        </span>
      )}
    </div>
  );
}
