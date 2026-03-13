import { lazy, Suspense, ComponentType, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout';
import { ChatContainer } from './components/chat';
import { PageLoader, ErrorBoundary, CompactErrorFallback, FocusModeIndicator } from './components/ui';
import { useUIStore } from './stores/uiStore';
import { useUrlSync } from './hooks/useUrlSync';

const CommandPalette = lazy(() =>
  import('./components/command-palette/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);

// Register demo seed helpers on window for console access
// Usage: __seedDemoChat() then reload page
import './mocks/chat-demo-seed';

// Lazy load heavy components
// Dashboard workspace (unified default + cockpit)
const DashboardWorkspace = lazy(() =>
  import('./components/dashboard/DashboardWorkspace')
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

// Stories workspace (unified kanban + list)
const StoryWorkspace = lazy(() =>
  import('./components/stories/StoryWorkspace')
);

const AgentsMonitor = lazy(() =>
  import('./components/agents-monitor/AgentsMonitor')
);

const TerminalsView = lazy(() =>
  import('./components/terminals/TerminalsView')
);

const MonitorWorkspace = lazy(() =>
  import('./components/monitor/MonitorWorkspace')
);

// InsightsView removed — consolidated into DashboardWorkspace

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

// StoriesView removed — consolidated into StoryWorkspace

const KnowledgeView = lazy(() =>
  import('./components/knowledge/KnowledgeView')
);

const SharedTaskView = lazy(() =>
  import('./components/share/SharedTaskView')
);

const EngineWorkspace = lazy(() =>
  import('./components/engine/EngineWorkspace')
);

const AgentDirectory = lazy(() =>
  import('./components/registry/AgentDirectory')
);

const TaskCatalog = lazy(() =>
  import('./components/registry/TaskCatalog')
);

const WorkflowCatalog = lazy(() =>
  import('./components/registry/WorkflowCatalog')
);

const AuthorityMatrix = lazy(() =>
  import('./components/registry/AuthorityMatrix')
);

const HandoffVisualization = lazy(() =>
  import('./components/registry/HandoffVisualization')
);

const SalesRoomPanel = lazy(() =>
  import('./components/sales-room/SalesRoomPanel')
);

const BrainstormRoom = lazy(() =>
  import('./components/brainstorm/BrainstormRoom')
);

const VaultView = lazy(() =>
  import('./components/vault/VaultView')
);

const RunningTasksIndicator = lazy(() =>
  import('./components/orchestration/RunningTasksIndicator').then((m) => ({ default: m.RunningTasksIndicator }))
);

const OvernightView = lazy(() =>
  import('./components/overnight/OvernightView')
);

const IntegrationHub = lazy(() =>
  import('./components/integrations/IntegrationHub')
);

const GoogleOAuthCallback = lazy(() =>
  import('./components/integrations/GoogleOAuthCallback')
);

// Marketplace views
const MarketplaceBrowse = lazy(() =>
  import('./components/marketplace/browse/MarketplaceBrowse')
);
const MarketplaceListingDetail = lazy(() =>
  import('./components/marketplace/listing/ListingDetail')
);
const MarketplacePurchases = lazy(() =>
  import('./components/marketplace/orders/MyPurchases')
);
const MarketplaceSellerDashboard = lazy(() =>
  import('./components/marketplace/seller/SellerDashboard')
);
const MarketplaceSubmitWizard = lazy(() =>
  import('./components/marketplace/submit/SubmitWizard')
);
const MarketplaceReviewQueue = lazy(() =>
  import('./components/marketplace/review-queue/ReviewQueue')
);
const MarketplaceAdminAnalytics = lazy(() =>
  import('./components/marketplace/admin/AdminAnalytics')
);

const DSPreview = lazy(() =>
  import('./components/ds-preview/DSPreview')
);

// CockpitDashboard removed — consolidated into DashboardWorkspace

// View map — maps ViewType to lazy component
const viewMap: Record<string, ComponentType> = {
  dashboard: DashboardWorkspace,
  kanban: StoryWorkspace, // backward compat — redirects to stories
  agents: AgentsMonitor,
  bob: TaskOrchestrator,
  terminals: TerminalsView,
  monitor: MonitorWorkspace,
  insights: DashboardWorkspace, // backward compat — redirects to dashboard
  context: ContextView,
  roadmap: RoadmapView,
  squads: SquadsView,
  github: GitHubView,
  settings: SettingsPage,
  qa: QAMetrics,
  orchestrator: TaskOrchestrator,
  world: GatherWorld,
  stories: StoryWorkspace,
  knowledge: KnowledgeView,
  cockpit: DashboardWorkspace, // backward compat — redirects to dashboard
  timeline: MonitorWorkspace, // backward compat — redirects to monitor
  share: SharedTaskView,
  engine: EngineWorkspace,
  'agent-directory': AgentDirectory,
  'task-catalog': TaskCatalog,
  'workflow-catalog': WorkflowCatalog,
  'authority-matrix': AuthorityMatrix,
  'handoff-flows': HandoffVisualization,
  'sales-room': SalesRoomPanel,
  brainstorm: BrainstormRoom,
  vault: VaultView,
  overnight: OvernightView,
  integrations: IntegrationHub,
  'google-oauth-callback': GoogleOAuthCallback,
  // Marketplace
  marketplace: MarketplaceBrowse,
  'marketplace-listing': MarketplaceListingDetail,
  'marketplace-purchases': MarketplacePurchases,
  'marketplace-seller': MarketplaceSellerDashboard,
  'marketplace-submit': MarketplaceSubmitWizard,
  'marketplace-review': MarketplaceReviewQueue,
  'marketplace-admin': MarketplaceAdminAnalytics,
  'ds-preview': DSPreview,
};

// Loading messages per view
const viewLoaderMessages: Record<string, string> = {
  dashboard: 'Carregando dashboard...',
  settings: 'Carregando configurações...',
  orchestrator: 'Carregando orquestrador...',
  workflow: 'Carregando workflow...',
  world: 'Carregando mundo...',
  kanban: 'Carregando stories...', // backward compat
  agents: 'Carregando agents...',
  bob: 'Carregando Bob...',
  terminals: 'Carregando terminais...',
  monitor: 'Carregando monitor...',
  insights: 'Carregando dashboard...', // backward compat
  context: 'Carregando contexto...',
  roadmap: 'Carregando roadmap...',
  squads: 'Carregando squads...',
  github: 'Carregando GitHub...',
  qa: 'Carregando QA...',
  stories: 'Carregando stories...',
  knowledge: 'Carregando base de conhecimento...',
  share: 'Carregando task compartilhada...',
  engine: 'Carregando engine...',
  'agent-directory': 'Carregando diretório de agentes...',
  'task-catalog': 'Carregando catálogo de tasks...',
  'workflow-catalog': 'Carregando catálogo de workflows...',
  'authority-matrix': 'Carregando matriz de autoridade...',
  'handoff-flows': 'Carregando fluxos de handoff...',
  'sales-room': 'Carregando sala de observacao...',
  vault: 'Carregando vault...',
  overnight: 'Carregando overnight programs...',
  brainstorm: 'Carregando brainstorm...',
  integrations: 'Carregando integrações...',
  cockpit: 'Carregando dashboard...', // backward compat
  timeline: 'Carregando monitor...', // backward compat
  // Marketplace
  marketplace: 'Carregando marketplace...',
  'marketplace-listing': 'Carregando agente...',
  'marketplace-purchases': 'Carregando compras...',
  'marketplace-seller': 'Carregando seller dashboard...',
  'marketplace-submit': 'Carregando submissão...',
  'marketplace-review': 'Carregando review queue...',
  'marketplace-admin': 'Carregando analytics...',
  'ds-preview': 'Carregando design system preview...',
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

// Per-view error fallback — isolates crashes so one broken view doesn't kill the app
function ViewErrorFallback({ viewKey }: { viewKey: string }) {
  const { setCurrentView } = useUIStore();
  return (
    <div className="h-full flex items-center justify-center p-8">
      <CompactErrorFallback
        message={`Erro ao carregar ${viewKey}`}
        onRetry={() => setCurrentView('chat')}
      />
    </div>
  );
}

// Wrapped view with motion animation + Suspense + ErrorBoundary
function ViewWrapper({ viewKey, children }: { viewKey: string; children: React.ReactNode }) {
  return (
    <div
      key={viewKey}
      className="h-full"
    >
      <ErrorBoundary fallback={<ViewErrorFallback viewKey={viewKey} />}>
        <Suspense fallback={<ViewLoader view={viewKey} />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function AppContent() {
  const { workflowViewOpen, setWorkflowViewOpen, currentView } = useUIStore();

  // Bidirectional URL <-> store sync (deep links, browser history)
  useUrlSync();

  // Resolve view component — default to ChatContainer
  const ViewComponent = viewMap[currentView];

  return (
    <>
      <AppLayout>
        {ViewComponent ? (
            <ViewWrapper viewKey={currentView}>
              <ViewComponent />
            </ViewWrapper>
          ) : (
            <ViewWrapper viewKey="chat">
              <ChatContainer />
            </ViewWrapper>
          )}
</AppLayout>

      {/* Workflow View Modal - Lazy loaded */}
      {workflowViewOpen && (
          <Suspense fallback={<ViewLoader view="workflow" />}>
            <WorkflowView onClose={() => setWorkflowViewOpen(false)} />
          </Suspense>
        )}
</>
  );
}

/** Global ⌘K listener — lightweight, always mounted */
function useCommandPaletteShortcut() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCommandPalette]);
}

function App() {
  useCommandPaletteShortcut();
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppContent />
        <FocusModeIndicator />
        <Suspense fallback={null}>
          <RunningTasksIndicator />
        </Suspense>
        {commandPaletteOpen && (
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
        )}
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
