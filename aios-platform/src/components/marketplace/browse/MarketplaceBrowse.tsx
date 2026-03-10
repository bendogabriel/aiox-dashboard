/**
 * MarketplaceBrowse — Main marketplace catalog page
 * Stories 2.1, 2.2, 2.3, 2.4
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │  Search bar                     [Sort] [≡]  │
 * │  CategoryNav (horizontal pills)             │
 * ├────────────┬────────────────────────────────┤
 * │  Filters   │  Featured Agents (if any)      │
 * │  (sidebar) │  ───────────────────────────── │
 * │            │  Grid of AgentCards            │
 * │            │  [Load More]                   │
 * └────────────┴────────────────────────────────┘
 */
import { useState, useCallback } from 'react';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { useMarketplaceStore } from '../../../stores/marketplaceStore';
import { useUIStore } from '../../../stores/uiStore';
import { useMarketplaceListings } from '../../../hooks/useMarketplace';
import { MarketplaceSearch } from './MarketplaceSearch';
import { CategoryNav } from './CategoryNav';
import { FeaturedAgents } from './FeaturedAgents';
import { MarketplaceGrid } from './MarketplaceGrid';
import { MarketplaceFilters, MarketplaceFilterDrawer } from './MarketplaceFilters';
import { WelcomeBanner, HowItWorks } from './OnboardingBanner';
import type { MarketplaceListing, MarketplaceSortBy } from '../../../types/marketplace';

const SORT_OPTIONS: { value: MarketplaceSortBy; label: string }[] = [
  { value: 'popular', label: 'Mais Populares' },
  { value: 'top_rated', label: 'Melhor Avaliados' },
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'price_low', label: 'Menor Preco' },
  { value: 'price_high', label: 'Maior Preco' },
];

export default function MarketplaceBrowse() {
  const { filters, setSortBy, setPage, resetFilters, selectListing } = useMarketplaceStore();
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Data fetching
  const { data, isLoading, isFetching } = useMarketplaceListings();

  const hasFilters =
    !!filters.query ||
    !!filters.category ||
    (filters.pricing_model?.length ?? 0) > 0 ||
    filters.min_rating !== undefined ||
    (filters.seller_verification?.length ?? 0) > 0 ||
    filters.featured_only === true;

  // Navigate to listing detail
  const handleSelectListing = useCallback(
    (listing: MarketplaceListing) => {
      selectListing(listing.id, listing.slug);
      setCurrentView('marketplace-listing' as never);
    },
    [selectListing, setCurrentView],
  );

  // Load more
  const handleLoadMore = useCallback(() => {
    const currentCount = data?.data?.length ?? 0;
    setPage(currentCount);
  }, [data, setPage]);

  // Sort handler
  const handleSort = (sort: MarketplaceSortBy) => {
    setSortBy(sort);
    setSortOpen(false);
  };

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort_by)?.label ?? 'Ordenar';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar: Search + Sort + Mobile filter toggle */}
      <div className="shrink-0 p-4 border-b border-[var(--color-border-default,#333)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <MarketplaceSearch />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="
                flex items-center gap-1.5 px-3 h-10
                bg-[var(--color-bg-surface,#0a0a0a)]
                border border-[var(--color-border-default,#333)]
                text-xs font-mono text-[var(--color-text-secondary,#999)]
                hover:border-[var(--color-text-muted,#666)]
                transition-colors whitespace-nowrap
              "
            >
              <ArrowUpDown size={12} />
              <span className="hidden sm:inline">{currentSortLabel}</span>
            </button>

            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="
                  absolute right-0 top-full mt-1 z-50 w-44
                  bg-[var(--color-bg-surface,#0a0a0a)]
                  border border-[var(--color-border-default,#333)]
                ">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSort(opt.value)}
                      className={`
                        w-full text-left px-3 py-2 text-xs font-mono transition-colors
                        ${filters.sort_by === opt.value
                          ? 'text-[var(--aiox-lime,#D1FF00)] bg-[var(--aiox-lime,#D1FF00)]/5'
                          : 'text-[var(--color-text-secondary,#999)] hover:bg-[var(--color-bg-elevated,#1a1a1a)] hover:text-[var(--color-text-primary,#fff)]'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="
              lg:hidden flex items-center gap-1.5 px-3 h-10
              bg-[var(--color-bg-surface,#0a0a0a)]
              border border-[var(--color-border-default,#333)]
              text-xs font-mono text-[var(--color-text-secondary,#999)]
              hover:border-[var(--color-text-muted,#666)]
              transition-colors
            "
          >
            <SlidersHorizontal size={12} />
          </button>
        </div>

        {/* Category navigation */}
        <CategoryNav />
      </div>

      {/* Content: Sidebar + Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block w-56 shrink-0 border-r border-[var(--color-border-default,#333)] overflow-y-auto">
          <MarketplaceFilters />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Onboarding banner (first visit) */}
          {!hasFilters && <WelcomeBanner />}

          {/* How it works (first visit) */}
          {!hasFilters && <HowItWorks />}

          {/* Featured section (hidden when searching/filtering) */}
          {!hasFilters && (
            <FeaturedAgents onSelect={handleSelectListing} />
          )}

          {/* Grid */}
          <MarketplaceGrid
            data={data}
            isLoading={isLoading}
            isFetchingNextPage={isFetching && !isLoading}
            hasFilters={hasFilters}
            onSelect={handleSelectListing}
            onLoadMore={handleLoadMore}
            onClearFilters={resetFilters}
          />
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MarketplaceFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      />
    </div>
  );
}
