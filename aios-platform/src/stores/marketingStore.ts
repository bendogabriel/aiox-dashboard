import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';

export type MarketingModule = 'overview' | 'traffic' | 'content' | 'funnels' | 'design-system' | 'analytics' | 'creatives';
export type DatePreset = 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'custom';
export type Platform = 'meta' | 'google' | 'ga4' | 'youtube' | 'instagram' | 'hotmart';

interface DateRange {
  start: string; // ISO date
  end: string;
}

interface MarketingState {
  activeModule: MarketingModule;
  datePreset: DatePreset;
  customDateRange: DateRange | null;
  selectedPlatforms: Platform[];
  compactMode: boolean;
  refreshInterval: number; // ms, 0 = disabled
  lastRefresh: number; // timestamp
}

interface MarketingActions {
  setActiveModule: (module: MarketingModule) => void;
  setDatePreset: (preset: DatePreset) => void;
  setCustomDateRange: (range: DateRange) => void;
  togglePlatform: (platform: Platform) => void;
  setCompactMode: (compact: boolean) => void;
  setRefreshInterval: (ms: number) => void;
  markRefreshed: () => void;
}

export const useMarketingStore = create<MarketingState & MarketingActions>()(
  persist(
    (set) => ({
      // State
      activeModule: 'overview',
      datePreset: 'last_14d',
      customDateRange: null,
      selectedPlatforms: ['meta', 'google', 'ga4'],
      compactMode: false,
      refreshInterval: 300_000, // 5 minutes
      lastRefresh: 0,

      // Actions
      setActiveModule: (module) => set({ activeModule: module }),
      setDatePreset: (preset) => set({ datePreset: preset, customDateRange: preset === 'custom' ? null : null }),
      setCustomDateRange: (range) => set({ customDateRange: range, datePreset: 'custom' }),
      togglePlatform: (platform) =>
        set((state) => {
          const platforms = state.selectedPlatforms.includes(platform)
            ? state.selectedPlatforms.filter((p) => p !== platform)
            : [...state.selectedPlatforms, platform];
          return { selectedPlatforms: platforms.length > 0 ? platforms : state.selectedPlatforms };
        }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      setRefreshInterval: (ms) => set({ refreshInterval: ms }),
      markRefreshed: () => set({ lastRefresh: Date.now() }),
    }),
    {
      name: 'aios-marketing',
      storage: safePersistStorage,
      partialize: (state) => ({
        activeModule: state.activeModule,
        datePreset: state.datePreset,
        selectedPlatforms: state.selectedPlatforms,
        compactMode: state.compactMode,
        refreshInterval: state.refreshInterval,
      }),
    }
  )
);
