'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { KanbanBoard } from '@/components/kanban';
import { StoryDetailModal } from '@/components/stories';
import { FAB, HelpFAB } from '@/components/ui/fab';
import { useStories } from '@/hooks/use-stories';
import type { Story, SidebarView } from '@/types';

// Lazy-load view panels -- only the active view is loaded
const AgentMonitor = lazy(() => import('@/components/agents/AgentMonitor').then(m => ({ default: m.AgentMonitor })));
const SettingsPanel = lazy(() => import('@/components/settings/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const TerminalGrid = lazy(() => import('@/components/terminals/TerminalGrid').then(m => ({ default: m.TerminalGrid })));
const GitHubPanel = lazy(() => import('@/components/github/GitHubPanel').then(m => ({ default: m.GitHubPanel })));
const RoadmapView = lazy(() => import('@/components/roadmap/RoadmapView').then(m => ({ default: m.RoadmapView })));
const InsightsPanel = lazy(() => import('@/components/insights/InsightsPanel').then(m => ({ default: m.InsightsPanel })));
const ContextPanel = lazy(() => import('@/components/context/ContextPanel').then(m => ({ default: m.ContextPanel })));
const MonitorPanel = lazy(() => import('@/components/monitor/MonitorPanel').then(m => ({ default: m.MonitorPanel })));
const BobOrchestrationView = lazy(() => import('@/components/bob/BobOrchestrationView').then(m => ({ default: m.BobOrchestrationView })));
const SquadsPanel = lazy(() => import('@/components/squads/SquadsPanel').then(m => ({ default: m.SquadsPanel })));
const SalesRoomPanel = lazy(() => import('@/components/sales-room/SalesRoomPanel').then(m => ({ default: m.SalesRoomPanel })));

export default function Home() {
  const { activeView } = useUIStore();
  const { isLoading, refresh } = useStories();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleStoryClick = useCallback((story: Story) => {
    setSelectedStory(story);
    setModalOpen(true);
  }, []);

  const handleNewStory = useCallback(() => {
    // TODO: Open new story modal
  }, []);

  // Show FAB on views that support creation
  const showFAB = activeView === 'kanban' || activeView === 'roadmap';

  return (
    <div className="h-full relative">
      <Suspense fallback={<ViewLoading />}>
        <ViewContent
          view={activeView}
          onStoryClick={handleStoryClick}
          onRefresh={refresh}
          isLoading={isLoading}
        />
      </Suspense>

      <StoryDetailModal
        story={selectedStory}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Floating Action Buttons */}
      {showFAB && (
        <FAB
          icon="plus"
          label={activeView === 'roadmap' ? 'New Feature' : 'New Story'}
          onClick={handleNewStory}
          position="bottom-left"
        />
      )}
      <HelpFAB />
    </div>
  );
}

interface ViewContentProps {
  view: SidebarView;
  onStoryClick: (story: Story) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

function ViewContent({ view, onStoryClick, onRefresh, isLoading }: ViewContentProps) {
  switch (view) {
    case 'kanban':
      return (
        <KanbanBoard
          onStoryClick={onStoryClick}
          onRefresh={onRefresh}
          isLoading={isLoading}
          className="h-full"
        />
      );

    case 'agents':
      return <AgentMonitor />;

    case 'settings':
      return <SettingsPanel />;

    case 'bob':
      return <BobOrchestrationView />;

    case 'terminals':
      return <TerminalGrid />;

    case 'roadmap':
      return <RoadmapView />;

    case 'github':
      return <GitHubPanel />;

    case 'insights':
      return <InsightsPanel />;

    case 'context':
      return <ContextPanel />;

    case 'monitor':
      return <MonitorPanel className="h-full" />;

    case 'squads':
      return <SquadsPanel />;

    case 'sales-room':
      return <SalesRoomPanel className="h-full" />;

    default:
      return <PlaceholderView title={view} description="Coming soon" />;
  }
}

function ViewLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
    </div>
  );
}

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium text-foreground capitalize">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
