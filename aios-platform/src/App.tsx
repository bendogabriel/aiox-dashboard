import { lazy, Suspense, ComponentType } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from './components/layout';
import { ChatContainer } from './components/chat';
import { PageLoader, ErrorBoundary } from './components/ui';
import { useUIStore } from './stores/uiStore';

// Lazy load heavy components
const DashboardOverview = lazy(() =>
  import('./components/dashboard').then((m) => ({ default: m.DashboardOverview }))
);

const SettingsPage = lazy(() =>
  import('./components/settings').then((m) => ({ default: m.SettingsPage }))
);

const WorkflowView = lazy(() =>
  import('./components/workflow').then((m) => ({ default: m.WorkflowView }))
);

const TaskOrchestrator = lazy(() =>
  import('./components/orchestration/TaskOrchestrator')
);

const GatherWorld = lazy(() =>
  import('./components/world').then((m) => ({ default: m.GatherWorld }))
);

// New views — lazy loaded
const KanbanBoard = lazy(() =>
  import('./components/kanban/KanbanBoard')
);

const AgentsMonitor = lazy(() =>
  import('./components/agents-monitor/AgentsMonitor')
);

const BobOrchestration = lazy(() =>
  import('./components/bob/BobOrchestration')
);

const TerminalsView = lazy(() =>
  import('./components/terminals/TerminalsView')
);

const LiveMonitor = lazy(() =>
  import('./components/monitor/LiveMonitor')
);

const InsightsView = lazy(() =>
  import('./components/insights/InsightsView')
);

const ContextView = lazy(() =>
  import('./components/context/ContextView')
);

const RoadmapView = lazy(() =>
  import('./components/roadmap/RoadmapView')
);

const SquadsView = lazy(() =>
  import('./components/squads-view/SquadsView')
);

const GitHubView = lazy(() =>
  import('./components/github/GitHubView')
);

const QAMetrics = lazy(() =>
  import('./components/qa/QAMetrics')
);

// View map — maps ViewType to lazy component
const viewMap: Record<string, ComponentType> = {
  dashboard: DashboardOverview,
  kanban: KanbanBoard,
  agents: AgentsMonitor,
  bob: BobOrchestration,
  terminals: TerminalsView,
  monitor: LiveMonitor,
  insights: InsightsView,
  context: ContextView,
  roadmap: RoadmapView,
  squads: SquadsView,
  github: GitHubView,
  settings: SettingsPage,
  qa: QAMetrics,
  orchestrator: TaskOrchestrator,
  world: GatherWorld,
};

// Loading messages per view
const viewLoaderMessages: Record<string, string> = {
  dashboard: 'Carregando dashboard...',
  settings: 'Carregando configurações...',
  orchestrator: 'Carregando orquestrador...',
  workflow: 'Carregando workflow...',
  world: 'Carregando mundo...',
  kanban: 'Carregando kanban...',
  agents: 'Carregando agents...',
  bob: 'Carregando Bob...',
  terminals: 'Carregando terminais...',
  monitor: 'Carregando monitor...',
  insights: 'Carregando insights...',
  context: 'Carregando contexto...',
  roadmap: 'Carregando roadmap...',
  squads: 'Carregando squads...',
  github: 'Carregando GitHub...',
  qa: 'Carregando QA...',
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - reduce API calls
      retry: 1, // Reduce retries to avoid rate limiting
      refetchOnWindowFocus: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

// Loading fallback with context-aware message
function ViewLoader({ view }: { view: string }) {
  return <PageLoader message={viewLoaderMessages[view] || 'Carregando...'} />;
}

// Wrapped view with motion animation + Suspense
function ViewWrapper({ viewKey, children }: { viewKey: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Suspense fallback={<ViewLoader view={viewKey} />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

function AppContent() {
  const { workflowViewOpen, setWorkflowViewOpen, currentView } = useUIStore();

  // Resolve view component — default to ChatContainer
  const ViewComponent = viewMap[currentView];

  return (
    <>
      <AppLayout>
        <AnimatePresence mode="wait">
          {ViewComponent ? (
            <ViewWrapper viewKey={currentView}>
              <ViewComponent />
            </ViewWrapper>
          ) : (
            <ViewWrapper viewKey="chat">
              <ChatContainer />
            </ViewWrapper>
          )}
        </AnimatePresence>
      </AppLayout>

      {/* Workflow View Modal - Lazy loaded */}
      <AnimatePresence>
        {workflowViewOpen && (
          <Suspense fallback={<ViewLoader view="workflow" />}>
            <WorkflowView onClose={() => setWorkflowViewOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
