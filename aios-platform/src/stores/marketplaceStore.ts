/**
 * Marketplace Store — Browse state, filters, search, pagination
 * PRD: PRD-MARKETPLACE | Story: 1.4
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import type {
  MarketplaceCategory,
  MarketplaceFilters,
  MarketplaceSortBy,
  PricingModel,
  SellerVerification,
  MarketplaceViewState,
} from '../types/marketplace';

interface MarketplaceState {
  // Filters
  filters: MarketplaceFilters;
  // View state
  view: MarketplaceViewState;
  // Search history
  searchHistory: string[];
}

interface MarketplaceActions {
  // Filters
  setQuery: (query: string) => void;
  setCategory: (category: MarketplaceCategory | undefined) => void;
  setPricingFilter: (models: PricingModel[]) => void;
  setMinRating: (rating: number | undefined) => void;
  setTags: (tags: string[]) => void;
  setSellerVerification: (levels: SellerVerification[]) => void;
  setFeaturedOnly: (featured: boolean) => void;
  setSortBy: (sort: MarketplaceSortBy) => void;
  setPage: (offset: number) => void;
  resetFilters: () => void;
  // View state
  selectListing: (id: string | null, slug?: string | null) => void;
  selectOrder: (id: string | null) => void;
  // Search history
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
}

const defaultFilters: MarketplaceFilters = {
  query: undefined,
  category: undefined,
  pricing_model: undefined,
  min_rating: undefined,
  tags: undefined,
  seller_verification: undefined,
  featured_only: false,
  sort_by: 'popular',
  offset: 0,
  limit: 12,
};

export const useMarketplaceStore = create<MarketplaceState & MarketplaceActions>()(
  persist(
    (set) => ({
      // State
      filters: { ...defaultFilters },
      view: {
        selectedListingId: null,
        selectedListingSlug: null,
        selectedOrderId: null,
      },
      searchHistory: [],

      // Filter actions
      setQuery: (query) =>
        set((s) => ({ filters: { ...s.filters, query, offset: 0 } })),

      setCategory: (category) =>
        set((s) => ({ filters: { ...s.filters, category, offset: 0 } })),

      setPricingFilter: (models) =>
        set((s) => ({ filters: { ...s.filters, pricing_model: models.length ? models : undefined, offset: 0 } })),

      setMinRating: (rating) =>
        set((s) => ({ filters: { ...s.filters, min_rating: rating, offset: 0 } })),

      setTags: (tags) =>
        set((s) => ({ filters: { ...s.filters, tags: tags.length ? tags : undefined, offset: 0 } })),

      setSellerVerification: (levels) =>
        set((s) => ({ filters: { ...s.filters, seller_verification: levels.length ? levels : undefined, offset: 0 } })),

      setFeaturedOnly: (featured) =>
        set((s) => ({ filters: { ...s.filters, featured_only: featured, offset: 0 } })),

      setSortBy: (sort) =>
        set((s) => ({ filters: { ...s.filters, sort_by: sort, offset: 0 } })),

      setPage: (offset) =>
        set((s) => ({ filters: { ...s.filters, offset } })),

      resetFilters: () =>
        set({ filters: { ...defaultFilters } }),

      // View actions
      selectListing: (id, slug) =>
        set((s) => ({
          view: { ...s.view, selectedListingId: id, selectedListingSlug: slug ?? null },
        })),

      selectOrder: (id) =>
        set((s) => ({ view: { ...s.view, selectedOrderId: id } })),

      // Search history
      addSearchHistory: (query) =>
        set((s) => {
          const trimmed = query.trim();
          if (!trimmed) return s;
          const history = [trimmed, ...s.searchHistory.filter((q) => q !== trimmed)].slice(0, 5);
          return { searchHistory: history };
        }),

      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: 'aios-marketplace',
      storage: safePersistStorage,
      partialize: (state) => ({
        filters: {
          sort_by: state.filters.sort_by,
          limit: state.filters.limit,
        },
        searchHistory: state.searchHistory,
      }),
    },
  ),
);
