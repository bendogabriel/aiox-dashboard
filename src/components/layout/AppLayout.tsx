'use client';

import { ReactNode, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ActivityPanel } from './ActivityPanel';
import { MobileNav } from './MobileNav';
import { useGlobalSearch } from '@/components/search';
import { ToastContainer } from '@/components/ui/Toast';

// Lazy-load modal/overlay components -- only loaded when opened
const AgentExplorer = lazy(() =>
  import('@/components/agents/AgentExplorer').then((m) => ({ default: m.AgentExplorer }))
);
const GlobalSearch = lazy(() =>
  import('@/components/search').then((m) => ({ default: m.GlobalSearch }))
);
const KeyboardShortcuts = lazy(() =>
  import('@/components/ui/KeyboardShortcuts').then((m) => ({ default: m.KeyboardShortcuts }))
);
import { SkipLinks } from '@/components/ui/SkipLinks';
import { StatusBar } from './StatusBar';
import { ProjectTabs } from './ProjectTabs';
import { useUIStore } from '@/stores/uiStore';
import { useProjectsStore } from '@/stores/projects-store';
import { useGlobalKeyboardShortcuts } from '@/hooks/use-global-keyboard-shortcuts';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

// Lazy-load matrix effects -- only loaded when matrix theme is active
const MatrixEffects = lazy(() =>
  import('@/components/ui/MatrixEffects').then((m) => ({ default: m.MatrixEffects }))
);

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const activityPanelOpen = useUIStore(s => s.activityPanelOpen);
  const agentExplorerOpen = useUIStore(s => s.agentExplorerOpen);
  const setAgentExplorerOpen = useUIStore(s => s.setAgentExplorerOpen);
  const currentView = useUIStore(s => s.currentView);
  const theme = useUIStore(s => s.theme);
  const projects = useProjectsStore(s => s.projects);
  const activeProjectId = useProjectsStore(s => s.activeProjectId);
  const setActiveProject = useProjectsStore(s => s.setActiveProject);
  const removeProject = useProjectsStore(s => s.removeProject);
  const addProject = useProjectsStore(s => s.addProject);
  const reorderProjects = useProjectsStore(s => s.reorderProjects);
  const closeOtherProjects = useProjectsStore(s => s.closeOtherProjects);
  const closeAllProjects = useProjectsStore(s => s.closeAllProjects);
  const globalSearch = useGlobalSearch();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleProjectAdd = () => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: `New Project`,
      path: '',
    };
    addProject(newProject);
  };

  const handleReorder = (reordered: Project[]) => {
    // Find the moved item and call reorderProjects with indices
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].id !== projects[i]?.id) {
        const oldIndex = projects.findIndex((p) => p.id === reordered[i].id);
        reorderProjects(oldIndex, i);
        break;
      }
    }
  };
  const isMatrix = theme === 'matrix';

  // Global keyboard shortcuts - all handled in one place
  useGlobalKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true),
  });

  // Hide activity panel on settings view
  const showActivityPanel = activityPanelOpen && currentView !== 'settings';

  return (
    <div className="min-h-screen relative isolate" role="application" aria-label="AIOS Core">
      {/* Skip Links for Accessibility */}
      <SkipLinks />

      {/* Gradient Background */}
      <div className="app-background" aria-hidden="true" />

      {/* Matrix Effects -- only rendered when matrix theme is active */}
      {isMatrix && (
        <Suspense fallback={null}>
          <MatrixEffects />
        </Suspense>
      )}

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
          <ProjectTabs
            projects={projects}
            activeProjectId={activeProjectId}
            onProjectSelect={setActiveProject}
            onProjectClose={removeProject}
            onProjectAdd={handleProjectAdd}
            onReorder={handleReorder}
            onCloseOthers={closeOtherProjects}
            onCloseAll={closeAllProjects}
          />

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

      {/* Agent Explorer Modal (lazy-loaded) */}
      {agentExplorerOpen && (
        <Suspense fallback={null}>
          <AgentExplorer
            isOpen={agentExplorerOpen}
            onClose={() => setAgentExplorerOpen(false)}
          />
        </Suspense>
      )}

      {/* Global Search Modal (lazy-loaded, Cmd+K) */}
      {globalSearch.isOpen && (
        <Suspense fallback={null}>
          <GlobalSearch
            isOpen={globalSearch.isOpen}
            onClose={globalSearch.close}
          />
        </Suspense>
      )}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Keyboard Shortcuts Modal (lazy-loaded) */}
      {showShortcuts && (
        <Suspense fallback={null}>
          <KeyboardShortcuts
            isOpen={showShortcuts}
            onClose={() => setShowShortcuts(false)}
          />
        </Suspense>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
