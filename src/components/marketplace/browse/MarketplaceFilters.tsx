/**
 * MarketplaceFilters — Sidebar filter panel with collapsible sections
 * Story 2.2
 */
import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useMarketplaceStore } from '../../../stores/marketplaceStore';
import type { PricingModel, SellerVerification } from '../../../types/marketplace';

// --- Collapsible Section ---
function FilterSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border-default,#333)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center justify-between px-3 py-2.5
          text-[10px] font-mono uppercase tracking-wider
          text-[var(--color-text-secondary,#999)]
          hover:text-[var(--color-text-primary,#fff)]
          transition-colors
        "
      >
        <span>{label}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// --- Checkbox Group ---
function CheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {options.map(({ value, label }) => (
        <label
          key={value}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className={`
            w-3.5 h-3.5 border flex items-center justify-center transition-colors
            ${selected.includes(value)
              ? 'bg-[var(--aiox-lime,#D1FF00)] border-[var(--aiox-lime,#D1FF00)]'
              : 'border-[var(--color-border-default,#333)] group-hover:border-[var(--color-text-muted,#666)]'
            }
          `}>
            {selected.includes(value) && (
              <svg width="8" height="8" viewBox="0 0 8 8">
                <path d="M1 4l2 2 4-4" stroke="var(--aiox-dark,#050505)" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </div>
          <span className="text-xs font-mono text-[var(--color-text-secondary,#999)] group-hover:text-[var(--color-text-primary,#fff)] transition-colors">
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}

// --- Rating Buttons ---
function RatingFilter({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const options = [
    { value: 4, label: '4+ ★' },
    { value: 3, label: '3+ ★' },
    { value: undefined, label: 'Qualquer' },
  ] as const;

  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 px-2 py-1.5 font-mono text-xs border transition-colors
            ${value === opt.value
              ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--aiox-lime,#D1FF00)] border-[var(--aiox-lime,#D1FF00)]/30 font-semibold'
              : 'text-[var(--color-text-secondary,#999)] border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)]'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// --- Pricing Options ---
const PRICING_OPTIONS: { value: PricingModel; label: string }[] = [
  { value: 'free', label: 'Gratis' },
  { value: 'per_task', label: 'Por Task' },
  { value: 'hourly', label: 'Por Hora' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'credits', label: 'Creditos' },
];

// --- Seller Level Options ---
const SELLER_OPTIONS: { value: SellerVerification; label: string }[] = [
  { value: 'verified', label: 'Verificado' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

// --- Main Filter Component ---
interface MarketplaceFiltersProps {
  className?: string;
}

export const MarketplaceFilters = memo(function MarketplaceFilters({ className }: MarketplaceFiltersProps) {
  const {
    filters,
    setPricingFilter,
    setMinRating,
    setSellerVerification,
    setFeaturedOnly,
    resetFilters,
  } = useMarketplaceStore();

  const hasActiveFilters =
    (filters.pricing_model?.length ?? 0) > 0 ||
    filters.min_rating !== undefined ||
    (filters.seller_verification?.length ?? 0) > 0 ||
    filters.featured_only;

  return (
    <div className={`
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
      ${className ?? ''}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border-default,#333)]">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={12} className="text-[var(--color-text-muted,#666)]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-primary,#fff)] font-semibold">
            Filtros
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="
              flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider
              text-[var(--color-text-muted,#666)] hover:text-[var(--aiox-lime,#D1FF00)]
              transition-colors
            "
          >
            <RotateCcw size={10} />
            Limpar
          </button>
        )}
      </div>

      {/* Pricing Model */}
      <FilterSection label="Modelo de Preco">
        <CheckboxGroup<PricingModel>
          options={PRICING_OPTIONS}
          selected={filters.pricing_model ?? []}
          onChange={setPricingFilter}
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection label="Avaliacao Minima">
        <RatingFilter value={filters.min_rating} onChange={setMinRating} />
      </FilterSection>

      {/* Seller Level */}
      <FilterSection label="Nivel do Seller">
        <CheckboxGroup<SellerVerification>
          options={SELLER_OPTIONS}
          selected={filters.seller_verification ?? []}
          onChange={setSellerVerification}
        />
      </FilterSection>

      {/* Featured Only */}
      <FilterSection label="Outros" defaultOpen={false}>
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className={`
            w-3.5 h-3.5 border flex items-center justify-center transition-colors
            ${filters.featured_only
              ? 'bg-[var(--aiox-lime,#D1FF00)] border-[var(--aiox-lime,#D1FF00)]'
              : 'border-[var(--color-border-default,#333)] group-hover:border-[var(--color-text-muted,#666)]'
            }
          `}>
            {filters.featured_only && (
              <svg width="8" height="8" viewBox="0 0 8 8">
                <path d="M1 4l2 2 4-4" stroke="var(--aiox-dark,#050505)" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </div>
          <span className="text-xs font-mono text-[var(--color-text-secondary,#999)] group-hover:text-[var(--color-text-primary,#fff)] transition-colors">
            Apenas Destaques
          </span>
        </label>
      </FilterSection>
    </div>
  );
});

// --- Mobile Drawer Wrapper ---
export function MarketplaceFilterDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="
        fixed inset-y-0 left-0 z-50 w-72
        bg-[var(--color-bg-base,#050505)]
        border-r border-[var(--color-border-default,#333)]
        overflow-y-auto
      ">
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--color-border-default,#333)]">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-primary,#fff)] font-semibold">
            Filtros
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <MarketplaceFilters />
      </div>
    </>
  );
}
