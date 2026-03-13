import { useState, useCallback, useEffect } from 'react';
import {
  Lightbulb,
  LayoutGrid,
  List,
  PanelRightOpen,
  PanelRightClose,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { CockpitButton, Badge, useToast } from '../ui';
import { cn } from '../../lib/utils';
import { useBrainstormStore } from '../../stores/brainstormStore';
import { useBrainstormSync } from '../../hooks/useBrainstormSync';
import { useBrainstormOrganize } from '../../hooks/useBrainstormOrganize';
import { useStoryStore, type Story } from '../../stores/storyStore';
import { BrainstormRoomList } from './BrainstormRoomList';
import { IdeaCanvas } from './IdeaCanvas';
import { IdeaCard } from './IdeaCard';
import { IdeaInputBar } from './IdeaInputBar';
import { OrganizePanel } from './OrganizePanel';
import { OutputPreview } from './OutputPreview';
import type { OutputType, BrainstormOutput, IdeaType } from '../../stores/brainstormStore';

type ViewMode = 'canvas' | 'list';

const phaseLabels: Record<string, { label: string; color: string }> = {
  collecting: { label: 'COLETANDO', color: 'var(--aiox-lime)' },
  organizing: { label: 'ORGANIZANDO', color: 'var(--aiox-blue)' },
  reviewing: { label: 'REVISANDO', color: '#4ADE80' },
  exporting: { label: 'EXPORTANDO', color: '#f59e0b' },
};

// ── Main Component ─────────────────────────────────────────────────

export default function BrainstormRoomView() {
  // Sync brainstorm rooms with Supabase (graceful fallback to localStorage)
  useBrainstormSync();

  const {
    rooms,
    activeRoomId,
    isOrganizing,
    organizingProgress,
    createRoom,
    deleteRoom,
    setActiveRoom,
    addIdea,
    updateIdea,
    removeIdea,
    moveIdea,
    tagIdea,
    setOrganizing,
    setRoomPhase,
    addOutput,
    removeOutput,
    clearOutputs,
    getActiveRoom,
  } = useBrainstormStore();

  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { organize, cancel: cancelOrganize } = useBrainstormOrganize();

  const activeRoom = getActiveRoom();

  // Reset stale "organizing" phase on mount (e.g. after page reload mid-organize)
  useEffect(() => {
    if (activeRoom && activeRoom.phase === 'organizing' && !isOrganizing) {
      setRoomPhase(activeRoom.id, activeRoom.outputs.length > 0 ? 'reviewing' : 'collecting');
    }
  }, [activeRoom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────

  const handleAddIdea = useCallback(
    (type: IdeaType, content: string, rawContent?: string) => {
      if (!activeRoomId) return;
      addIdea(activeRoomId, { type, content, rawContent, tags: [], color: undefined });
    },
    [activeRoomId, addIdea]
  );

  const handleOrganize = useCallback(
    async (selectedTypes: OutputType[]) => {
      if (!activeRoom) return;

      setOrganizing(true, 0);
      setRoomPhase(activeRoom.id, 'organizing');

      try {
        const ideaData = activeRoom.ideas.map((i) => ({
          type: i.type,
          content: i.content,
          tags: i.tags,
        }));

        const results = await organize(ideaData, selectedTypes, {
          onProgress: (p) => setOrganizing(true, p),
        });

        clearOutputs(activeRoom.id);
        for (const result of results) {
          addOutput(activeRoom.id, {
            type: result.type,
            title: result.title,
            content: result.content,
            structuredData: {},
          });
        }

        setRoomPhase(activeRoom.id, 'reviewing');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log('[BrainstormRoom] Organize cancelled');
          setRoomPhase(activeRoom.id, 'collecting');
        } else {
          console.error('Error organizing:', err);
        }
      } finally {
        setOrganizing(false, 0);
      }
    },
    [activeRoom, organize, setOrganizing, setRoomPhase, clearOutputs, addOutput]
  );

  const handleRefineOutput = useCallback((outputId: string) => {
    // TODO: Send output back to AI for refinement
    console.log('Refine output:', outputId);
  }, []);

  const addStory = useStoryStore((s) => s.addStory);
  const toast = useToast();

  const handleExportOutput = useCallback((output: BrainstormOutput) => {
    const generateId = () =>
      `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const now = new Date().toISOString();

    switch (output.type) {
      case 'story': {
        const story: Story = {
          id: generateId(),
          title: output.title,
          description: output.content.slice(0, 500),
          status: 'backlog',
          priority: 'medium',
          complexity: 'standard',
          category: 'feature',
          progress: 0,
          createdAt: now,
          updatedAt: now,
        };
        addStory(story);
        toast.success(
          'Story adicionada ao Kanban',
          `"${output.title}" foi criada no backlog.`
        );
        break;
      }

      case 'action-plan': {
        // Parse tasks from the action plan content — each "### N." heading is a task
        const taskBlocks = output.content.split(/^### \d+\./m).filter((b) => b.trim());
        const storiesCreated: string[] = [];

        for (const block of taskBlocks) {
          const firstLine = block.trim().split('\n')[0]?.trim() || 'Tarefa do Plano';
          const title = firstLine.slice(0, 120);

          // Extract priority from block content
          const priorityMatch = block.match(/\*\*Prioridade:\*\*\s*(P0|P1|P2)/i);
          const priority: Story['priority'] =
            priorityMatch?.[1] === 'P0'
              ? 'critical'
              : priorityMatch?.[1] === 'P1'
                ? 'high'
                : 'medium';

          // Extract complexity from block content
          const complexityMatch = block.match(/\*\*Complexidade:\*\*\s*(simple|standard|complex)/i);
          const complexity: Story['complexity'] =
            (complexityMatch?.[1] as Story['complexity']) || 'standard';

          const story: Story = {
            id: generateId(),
            title,
            description: block.trim().slice(0, 500),
            status: 'backlog',
            priority,
            complexity,
            category: 'feature',
            progress: 0,
            createdAt: now,
            updatedAt: now,
          };
          addStory(story);
          storiesCreated.push(title);
        }

        toast.success(
          `${storiesCreated.length} stories adicionadas ao Kanban`,
          'Plano de acao convertido em stories no backlog.'
        );
        break;
      }

      case 'prd':
      case 'requirements': {
        const blob = new Blob([output.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${output.title.replace(/\s+/g, '-').toLowerCase()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.info('Download iniciado', `${output.title}.md`);
        break;
      }

      case 'epic': {
        const blob = new Blob([output.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${output.title.replace(/\s+/g, '-').toLowerCase()}.yaml`;
        a.click();
        URL.revokeObjectURL(url);
        toast.info('Download iniciado', `${output.title}.yaml`);
        break;
      }
    }
  }, [addStory, toast]);

  // ── No active room → show room list ──────────────────────────────

  if (!activeRoom) {
    return (
      <div className="h-full max-w-2xl mx-auto">
        <BrainstormRoomList
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelect={setActiveRoom}
          onCreate={createRoom}
          onDelete={deleteRoom}
        />
      </div>
    );
  }

  // ── Active room workspace ────────────────────────────────────────

  const phase = phaseLabels[activeRoom.phase] || { label: activeRoom.phase, color: '#999' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
        <CockpitButton
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setActiveRoom(null)}
          aria-label="Voltar para lista"
        >
          <ArrowLeft size={16} />
        </CockpitButton>

        <Lightbulb size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-primary truncate flex-1">
          {activeRoom.name}
        </h2>

        {/* Phase badge */}
        <Badge
          variant="subtle"
          className="text-[10px] font-mono uppercase tracking-wider"
          style={{ borderColor: phase.color, color: phase.color }}
        >
          {phase.label}
        </Badge>

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 glass-panel border border-glass-border rounded-lg p-0.5">
          <CockpitButton
            variant={viewMode === 'canvas' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('canvas')}
            aria-label="Vista canvas"
          >
            <LayoutGrid size={14} />
          </CockpitButton>
          <CockpitButton
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
            aria-label="Vista lista"
          >
            <List size={14} />
          </CockpitButton>
        </div>

        {/* Sidebar toggle */}
        <CockpitButton
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </CockpitButton>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === 'canvas' ? (
            <IdeaCanvas
              ideas={activeRoom.ideas}
              onUpdateIdea={(ideaId, updates) => updateIdea(activeRoom.id, ideaId, updates)}
              onRemoveIdea={(ideaId) => removeIdea(activeRoom.id, ideaId)}
              onTagIdea={(ideaId, tags) => tagIdea(activeRoom.id, ideaId, tags)}
              onMoveIdea={(ideaId, pos) => moveIdea(activeRoom.id, ideaId, pos)}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 glass-scrollbar">
              {activeRoom.ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    compact
                    onUpdate={(id, updates) => updateIdea(activeRoom.id, id, updates)}
                    onRemove={(id) => removeIdea(activeRoom.id, id)}
                    onTagIdea={(id, tags) => tagIdea(activeRoom.id, id, tags)}
                  />
                ))}
{activeRoom.ideas.length === 0 && (
                <div className="flex items-center justify-center py-16 text-tertiary text-sm">
                  Nenhuma ideia ainda. Use o campo abaixo para comecar.
                </div>
              )}
            </div>
          )}

          {/* Input bar */}
          <IdeaInputBar
            onAddIdea={handleAddIdea}
            disabled={isOrganizing}
          />
        </div>

        {/* Right sidebar — organize + outputs */}
        {sidebarOpen && (
            <aside
              className="border-l border-glass-border overflow-y-auto glass-scrollbar"
            >
              <div className="p-4 space-y-6">
                {/* Organize section */}
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-tertiary font-mono mb-3">
                    <Sparkles size={12} /> Organizar
                  </h3>
                  <OrganizePanel
                    ideas={activeRoom.ideas}
                    isOrganizing={isOrganizing}
                    progress={organizingProgress}
                    onOrganize={handleOrganize}
                  />
                </div>

                {/* Outputs section */}
                {activeRoom.outputs.length > 0 && (
                  <OutputPreview
                    outputs={activeRoom.outputs}
                    onRefine={handleRefineOutput}
                    onRemove={(outputId) => removeOutput(activeRoom.id, outputId)}
                    onExport={handleExportOutput}
                  />
                )}
              </div>
            </aside>
          )}
</div>
    </div>
  );
}
