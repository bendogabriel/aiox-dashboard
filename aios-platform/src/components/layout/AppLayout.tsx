import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ActivityPanel } from './ActivityPanel';
import { MobileNav } from './MobileNav';
import { AgentExplorer } from '../agents/AgentExplorer';
import { GlobalSearch, useGlobalSearch } from '../search';
import { ToastContainer, KeyboardShortcuts, PWAUpdatePrompt, SkipLinks } from '../ui';
import { OnboardingTour } from '../onboarding';
import { StatusBar } from '../status-bar/StatusBar';
import { ProjectTabs } from '../project-tabs/ProjectTabs';
import { useUIStore } from '../../stores/uiStore';
import { useGlobalKeyboardShortcuts } from '../../hooks/useGlobalKeyboardShortcuts';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, activityPanelOpen, agentExplorerOpen, setAgentExplorerOpen, currentView } = useUIStore();
  const globalSearch = useGlobalSearch();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global keyboard shortcuts - all handled in one place
  useGlobalKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true),
  });

  // Hide activity panel on settings view
  const showActivityPanel = activityPanelOpen && currentView !== 'settings';

  return (
    <div className="min-h-screen relative" role="application" aria-label="AIOS Core">
      {/* Skip Links for Accessibility */}
      <SkipLinks />

      {/* Gradient Background */}
      <div className="app-background" aria-hidden="true" />

      {/* Main Grid - No sidebar in mobile (handled by drawer) */}
      <div
        className={cn(
          'grid h-screen transition-all duration-300 ease-out',
          // Mobile: single column (sidebar is a drawer)
          'grid-cols-1',
          // Desktop: sidebar + content
          sidebarCollapsed
            ? 'md:grid-cols-[72px_1fr]'
            : 'md:grid-cols-[220px_1fr]',
          // Desktop with activity panel (not on settings)
          showActivityPanel && !sidebarCollapsed && 'lg:grid-cols-[220px_1fr_320px]',
          showActivityPanel && sidebarCollapsed && 'lg:grid-cols-[72px_1fr_320px]'
        )}
      >
        {/* Sidebar (Desktop: grid item, Mobile: drawer handled inside component) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <Header />

          {/* Project Tabs */}
          <ProjectTabs />

          {/* Main Content */}
          <main id="main-content" className="flex-1 overflow-hidden p-4 pb-20 md:p-6 md:pb-6" role="main" aria-label="Conteúdo principal">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* Activity Panel - Hidden on settings view */}
        <AnimatePresence>
          {showActivityPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block"
            >
              <ActivityPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agent Explorer Modal */}
      <AgentExplorer
        isOpen={agentExplorerOpen}
        onClose={() => setAgentExplorerOpen(false)}
      />

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearch
        isOpen={globalSearch.isOpen}
        onClose={globalSearch.close}
      />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* PWA Update Prompt */}
      <PWAUpdatePrompt />

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
