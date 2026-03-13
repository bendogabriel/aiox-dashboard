import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safePersistStorage } from '../lib/safeStorage';
import { playSound } from '../hooks/useSound';
import { supabaseSettingsService } from '../services/supabase/settings';
import type { UIState } from '../types';

type ThemeType = 'light' | 'dark' | 'system' | 'matrix' | 'glass' | 'aiox' | 'aiox-gold';

type ViewType =
  | 'chat' | 'dashboard' | 'cockpit' | 'settings' | 'orchestrator' | 'world'
  | 'kanban' | 'agents' | 'bob' | 'terminals' | 'monitor' | 'timeline'
  | 'insights' | 'context' | 'knowledge' | 'roadmap' | 'squads' | 'github' | 'qa' | 'stories'
  | 'share' | 'engine' | 'agent-directory' | 'task-catalog' | 'workflow-catalog' | 'authority-matrix' | 'handoff-flows'
  | 'sales-room' | 'sales-dashboard' | 'traffic-dashboard' | 'creative-gallery'
  | 'integrations' | 'google-oauth-callback'
  | 'brainstorm'
  | 'vault'
  | 'marketplace' | 'marketplace-listing' | 'marketplace-purchases' | 'marketplace-seller' | 'marketplace-submit' | 'marketplace-review' | 'marketplace-admin'
  | 'marketing-hub';
export type SettingsSection = 'dashboard' | 'categories' | 'memory' | 'workflows' | 'profile' | 'api' | 'appearance' | 'notifications' | 'privacy' | 'about';

interface UIActions {
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setActivityPanelOpen: (open: boolean) => void;
  toggleActivityPanel: () => void;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  setSelectedSquadId: (squadId: string | null) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  setWorkflowViewOpen: (open: boolean) => void;
  toggleWorkflowView: () => void;
  setAgentExplorerOpen: (open: boolean) => void;
  toggleAgentExplorer: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setCurrentView: (view: ViewType) => void;
  setSettingsSection: (section: SettingsSection) => void;
  setSelectedRoomId: (roomId: string | null) => void;
  setWorldZoom: (zoom: 'map' | 'room') => void;
  enterRoom: (roomId: string) => void;
  exitRoom: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  /** Navigate to a registry view with a pre-selected entity */
  navigateToRegistryAgent: (agentId: string) => void;
  navigateToRegistryWorkflow: (workflowId: string) => void;
  registryTargetAgentId: string | null;
  registryTargetWorkflowId: string | null;
  clearRegistryTarget: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: ThemeType) => {
  const html = document.documentElement;

  // Enable smooth transition between themes
  html.classList.add('theme-transitioning');

  // Clean up all theme states
  html.classList.remove('dark');
  html.removeAttribute('data-theme');

  if (theme === 'matrix') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'matrix');
  } else if (theme === 'glass') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'glass');
  } else if (theme === 'aiox') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'aiox');
  } else if (theme === 'aiox-gold') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'aiox-gold');
  } else {
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    if (effectiveTheme === 'dark') {
      html.classList.add('dark');
    }
  }

  // Remove transition class after animation completes
  setTimeout(() => {
    html.classList.remove('theme-transitioning');
  }, 450);
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      // State
      sidebarCollapsed: false,
      activityPanelOpen: true,
      workflowViewOpen: false,
      agentExplorerOpen: false,
      mobileMenuOpen: false,
      commandPaletteOpen: false,
      registryTargetAgentId: null,
      registryTargetWorkflowId: null,
      theme: 'aiox' as ThemeType,
      selectedSquadId: null,
      selectedAgentId: null,
      currentView: 'cockpit' as ViewType,
      settingsSection: 'dashboard' as SettingsSection,
      selectedRoomId: null,
      worldZoom: 'map' as const,
      focusMode: false,

      // Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setActivityPanelOpen: (open) => set({ activityPanelOpen: open }),

      toggleActivityPanel: () => set((state) => ({ activityPanelOpen: !state.activityPanelOpen })),

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        // Cycle: light -> dark -> glass -> matrix -> aiox -> aiox-gold -> light
        // (system resolves to its effective theme first)
        let newTheme: ThemeType;
        if (currentTheme === 'aiox-gold') {
          newTheme = 'light';
        } else if (currentTheme === 'aiox') {
          newTheme = 'aiox-gold';
        } else if (currentTheme === 'matrix') {
          newTheme = 'aiox';
        } else if (currentTheme === 'glass') {
          newTheme = 'matrix';
        } else {
          const effectiveTheme = currentTheme === 'system' ? getSystemTheme() : currentTheme;
          newTheme = effectiveTheme === 'dark' ? 'glass' : 'dark';
        }
        applyTheme(newTheme);
        set({ theme: newTheme });
      },

      setSelectedSquadId: (squadId) => set({ selectedSquadId: squadId, selectedAgentId: null }),

      setSelectedAgentId: (agentId) => set({ selectedAgentId: agentId }),

      setWorkflowViewOpen: (open) => set({ workflowViewOpen: open }),

      toggleWorkflowView: () => set((state) => ({ workflowViewOpen: !state.workflowViewOpen })),

      setAgentExplorerOpen: (open) => {
        playSound(open ? 'open' : 'close');
        set({ agentExplorerOpen: open });
      },

      toggleAgentExplorer: () => {
        const wasOpen = get().agentExplorerOpen;
        playSound(wasOpen ? 'close' : 'open');
        set({ agentExplorerOpen: !wasOpen });
      },

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      setCurrentView: (view) => {
        const prev = get().currentView;
        if (prev !== view) playSound('navigate');
        set({ currentView: view });
      },

      setSettingsSection: (section) => set({ settingsSection: section }),

      setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),

      setWorldZoom: (zoom) => set({ worldZoom: zoom }),

      enterRoom: (roomId) => set({ selectedRoomId: roomId, worldZoom: 'room', selectedSquadId: roomId }),

      exitRoom: () => set({ selectedRoomId: null, worldZoom: 'map', selectedAgentId: null }),

      setFocusMode: (enabled) => {
        if (enabled) {
          playSound('open');
          set({ focusMode: true, sidebarCollapsed: true, activityPanelOpen: false });
        } else {
          playSound('close');
          set({ focusMode: false });
        }
      },

      toggleFocusMode: () => {
        const wasFocus = get().focusMode;
        if (!wasFocus) {
          playSound('open');
          set({ focusMode: true, sidebarCollapsed: true, activityPanelOpen: false });
        } else {
          playSound('close');
          set({ focusMode: false });
        }
      },

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      navigateToRegistryAgent: (agentId) => {
        playSound('navigate');
        set({ currentView: 'agent-directory' as ViewType, registryTargetAgentId: agentId, registryTargetWorkflowId: null });
      },

      navigateToRegistryWorkflow: (workflowId) => {
        playSound('navigate');
        set({ currentView: 'workflow-catalog' as ViewType, registryTargetWorkflowId: workflowId, registryTargetAgentId: null });
      },

      clearRegistryTarget: () => set({ registryTargetAgentId: null, registryTargetWorkflowId: null }),
    }),
    {
      name: 'aios-ui-store',
      storage: safePersistStorage,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activityPanelOpen: state.activityPanelOpen,
        theme: state.theme,
        currentView: state.currentView,
        settingsSection: state.settingsSection,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useUIStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}

// ── Supabase Sync for UI Preferences ──────────────────────
// Fire-and-forget sync of theme and layout preferences

let _uiSyncTimer: ReturnType<typeof setTimeout> | null = null;
const UI_SYNC_DEBOUNCE_MS = 2000;
let _uiSyncInitialized = false;

function syncUIToSupabase() {
  if (!supabaseSettingsService.isAvailable()) return;
  if (_uiSyncTimer) clearTimeout(_uiSyncTimer);

  _uiSyncTimer = setTimeout(() => {
    const state = useUIStore.getState();
    supabaseSettingsService.upsertSetting('ui-preferences', {
      theme: state.theme,
      sidebarCollapsed: state.sidebarCollapsed,
      activityPanelOpen: state.activityPanelOpen,
    }).catch(() => { /* silent */ });
  }, UI_SYNC_DEBOUNCE_MS);
}

// Subscribe to theme changes for Supabase sync
if (typeof window !== 'undefined') {
  // Watch for theme, sidebar, and activity panel changes
  useUIStore.subscribe((state, prevState) => {
    if (!_uiSyncInitialized) return;
    if (
      state.theme !== prevState.theme ||
      state.sidebarCollapsed !== prevState.sidebarCollapsed ||
      state.activityPanelOpen !== prevState.activityPanelOpen
    ) {
      syncUIToSupabase();
    }
  });

  // Load UI preferences from Supabase on startup
  setTimeout(async () => {
    if (!supabaseSettingsService.isAvailable()) {
      _uiSyncInitialized = true;
      return;
    }
    try {
      const remote = await supabaseSettingsService.getSetting<{
        theme?: string;
        sidebarCollapsed?: boolean;
        activityPanelOpen?: boolean;
      }>('ui-preferences');
      if (remote?.theme) {
        const currentState = useUIStore.getState();
        // Only apply remote theme if local hasn't been changed since page load
        if ((currentState.theme === 'aiox' || currentState.theme === 'aiox-gold') && remote.theme !== currentState.theme) {
          applyTheme(remote.theme as ThemeType);
          useUIStore.setState({ theme: remote.theme as ThemeType });
        }
        if (remote.sidebarCollapsed !== undefined) {
          useUIStore.setState({ sidebarCollapsed: remote.sidebarCollapsed });
        }
        if (remote.activityPanelOpen !== undefined) {
          useUIStore.setState({ activityPanelOpen: remote.activityPanelOpen });
        }
      }
    } catch {
      // Silent — local-first
    }
    _uiSyncInitialized = true;
  }, 800);
}
