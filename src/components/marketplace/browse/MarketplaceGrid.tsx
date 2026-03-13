/**
 * MarketplaceGrid — Agent card grid with loading skeletons and load-more
 * Story 2.1
 */
import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { AgentCard, EmptyMarketplace } from '../shared';
import type { MarketplaceListing } from '../../../types/marketplace';
import type { MarketplaceListResponse } from '../../../types/marketplace';

// --- Skeleton Card ---
function SkeletonCard() {
  return (
    <div className="
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
      p-4 flex flex-col gap-3 animate-pulse
    ">
      {/* Header skeleton */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[var(--color-bg-elevated,#1a1a1a)]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-[var(--color-bg-elevated,#1a1a1a)] w-3/4" />
          <div className="h-2.5 bg-[var(--color-bg-elevated,#1a1a1a)] w-1/2" />
        </div>
      </div>
      {/* Tags skeleton */}
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-[var(--color-bg-elevated,#1a1a1a)]" />
        <div className="h-5 w-12 bg-[var(--color-bg-elevated,#1a1a1a)]" />
      </div>
      {/* Rating skeleton */}
      <div className="flex justify-between">
        <div className="h-3 w-24 bg-[var(--color-bg-elevated,#1a1a1a)]" />
        <div className="h-3 w-10 bg-[var(--color-bg-elevated,#1a1a1a)]" />
      </div>
      {/* Price skeleton */}
      <div className="pt-2 border-t border-[var(--color-border-default,#333)]">
        <div className="h-5 w-20 bg-[var(--color-bg-elevated,#1a1a1a)]" />
      </div>
    </div>
  );
}

// --- Skeleton Grid ---
export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// --- Main Grid ---
interface MarketplaceGridProps {
  data: MarketplaceListResponse<MarketplaceListing> | undefined;
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasFilters: boolean;
  onSelect: (listing: MarketplaceListing) => void;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

export const MarketplaceGrid = memo(function MarketplaceGrid({
  data,
  isLoading,
  isFetchingNextPage,
  hasFilters,
  onSelect,
  onLoadMore,
  onClearFilters,
}: MarketplaceGridProps) {
  if (isLoading) {
    return <SkeletonGrid />;
  }

  const listings = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = listings.length < total;

  if (listings.length === 0) {
    return (
      <EmptyMarketplace
        variant={hasFilters ? 'search' : 'browse'}
        onAction={hasFilters ? onClearFilters : undefined}
      />
    );
  }

  return (
    <div>
      {/* Results counter */}
      <p className="text-xs font-mono text-[var(--color-text-muted,#666)] mb-3">
        <span className="text-[var(--color-text-primary,#fff)] font-semibold">{total}</span>{' '}
        {total === 1 ? 'agente encontrado' : 'agentes encontrados'}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <AgentCard key={listing.id} listing={listing} onClick={onSelect} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="
              px-6 py-2.5 font-mono text-xs uppercase tracking-wider
              border border-[var(--color-border-default,#333)]
              text-[var(--color-text-secondary,#999)]
              hover:border-[var(--aiox-lime,#D1FF00)]/40
              hover:text-[var(--color-text-primary,#fff)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center gap-2
            "
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Carregando...
              </>
            ) : (
              `Carregar mais (${listings.length}/${total})`
            )}
          </button>
        </div>
      )}
    </div>
  );
});
