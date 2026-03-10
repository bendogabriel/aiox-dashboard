import type { PricingModel, PriceDisplay } from '../../../types/marketplace';

export function formatPrice(
  model: PricingModel,
  amount: number,
  currency = 'BRL',
  creditsPerUse?: number | null,
): PriceDisplay {
  if (model === 'free') {
    return { label: 'Gratis', suffix: '', formatted: 'Gratis' };
  }

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
  const label = `${currencySymbol} ${amount.toFixed(2).replace('.', ',')}`;

  const suffixMap: Record<PricingModel, string> = {
    free: '',
    per_task: '/task',
    hourly: '/hora',
    monthly: '/mes',
    credits: creditsPerUse ? ` (${creditsPerUse} cred.)` : '/credito',
  };

  const suffix = suffixMap[model] || '';
  return { label, suffix, formatted: `${label}${suffix}` };
}

interface PriceBadgeProps {
  model: PricingModel;
  amount: number;
  currency?: string;
  creditsPerUse?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceBadge({ model, amount, currency, creditsPerUse, size = 'md' }: PriceBadgeProps) {
  const price = formatPrice(model, amount, currency, creditsPerUse);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const isFree = model === 'free';

  return (
    <span
      className={`
        inline-flex items-center font-mono font-semibold uppercase tracking-wider
        ${sizeClasses[size]}
        ${isFree
          ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--aiox-lime,#D1FF00)] border border-[var(--aiox-lime,#D1FF00)]/30'
          : 'bg-[var(--color-bg-elevated,#1a1a1a)] text-[var(--color-text-primary,#fff)] border border-[var(--color-border-default,#333)]'
        }
      `}
    >
      {price.formatted}
    </span>
  );
}
