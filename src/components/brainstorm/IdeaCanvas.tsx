import { useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Lightbulb, Type, Mic, Link2, Image } from 'lucide-react';
import { CockpitButton } from '../ui';
import { cn } from '../../lib/utils';
import { IdeaCard } from './IdeaCard';
import type { BrainstormIdea } from '../../stores/brainstormStore';

interface IdeaCanvasProps {
  ideas: BrainstormIdea[];
  onUpdateIdea: (ideaId: string, updates: Partial<BrainstormIdea>) => void;
  onRemoveIdea: (ideaId: string) => void;
  onTagIdea: (ideaId: string, tags: string[]) => void;
  onMoveIdea: (ideaId: string, position: { x: number; y: number }) => void;
}

export function IdeaCanvas({
  ideas,
  onUpdateIdea,
  onRemoveIdea,
  onTagIdea,
  onMoveIdea,
}: IdeaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ideaX: 0, ideaY: 0 });

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.max(0.4, Math.min(2, z - e.deltaY * 0.002)));
    }
  }, []);

  // Pan via middle-click or right-click drag on empty space
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only start pan if clicking on the canvas itself (not a card)
    if (e.target !== containerRef.current && e.target !== containerRef.current?.firstChild) return;
    if (e.button === 1 || e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
      return;
    }

    if (draggingId) {
      const dx = (e.clientX - dragStart.current.x) / zoom;
      const dy = (e.clientY - dragStart.current.y) / zoom;
      onMoveIdea(draggingId, {
        x: Math.max(0, dragStart.current.ideaX + dx),
        y: Math.max(0, dragStart.current.ideaY + dy),
      });
    }
  }, [isPanning, draggingId, zoom, onMoveIdea]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingId(null);
  }, []);

  const handleDragStart = (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    setDraggingId(ideaId);
    // Will be set properly on next mousedown via the grip handle
  };

  // Track actual mouse position for card drag
  const handleCardMouseDown = (ideaId: string, e: React.MouseEvent) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    e.stopPropagation();
    setDraggingId(ideaId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ideaX: idea.position.x,
      ideaY: idea.position.y,
    };
  };

  // Calculate canvas bounds based on idea positions
  const maxX = ideas.reduce((max, i) => Math.max(max, i.position.x + 300), 1200);
  const maxY = ideas.reduce((max, i) => Math.max(max, i.position.y + 250), 800);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Zoom controls + counter */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {ideas.length > 0 && (
          <span className="text-[10px] text-tertiary font-mono uppercase tracking-wider glass-panel border border-glass-border rounded-lg px-2 py-1.5">
            {ideas.length} {ideas.length === 1 ? 'ideia' : 'ideias'}
          </span>
        )}
        <div className="flex items-center gap-1 glass-panel border border-glass-border rounded-lg p-1">
          <CockpitButton variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} aria-label="Zoom out">
            <ZoomOut size={14} />
          </CockpitButton>
          <span className="text-[10px] text-tertiary font-mono w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <CockpitButton variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} aria-label="Zoom in">
            <ZoomIn size={14} />
          </CockpitButton>
          <CockpitButton variant="ghost" size="icon" className="h-7 w-7" onClick={resetView} aria-label="Reset zoom">
            <Maximize2 size={14} />
          </CockpitButton>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className={cn(
          'w-full h-full overflow-auto',
          isPanning ? 'cursor-grabbing' : 'cursor-default',
          'bg-[radial-gradient(circle_at_1px_1px,_var(--color-border)_1px,_transparent_0)] bg-[size:32px_32px]'
        )}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: maxX,
            height: maxY,
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          {ideas.map((idea) => (
              <div
                key={idea.id}
                className="absolute"
                style={{
                  left: idea.position.x,
                  top: idea.position.y,
                  zIndex: draggingId === idea.id ? 50 : 1,
                }}
                onMouseDown={(e) => handleCardMouseDown(idea.id, e)}
              >
                <IdeaCard
                  idea={idea}
                  onUpdate={(id, updates) => onUpdateIdea(id, updates)}
                  onRemove={onRemoveIdea}
                  onTagIdea={onTagIdea}
                />
              </div>
            ))}
{/* Empty state */}
          {ideas.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center gap-3 text-tertiary/40">
                  <Type size={24} />
                  <Mic size={28} />
                  <Lightbulb size={36} className="text-primary/30" />
                  <Link2 size={28} />
                  <Image size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-secondary font-medium">Despeje suas ideias aqui</p>
                  <p className="text-sm text-tertiary">Texto, voz, links ou arquivos — tudo vira um card organizavel</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] text-tertiary/60 font-mono uppercase tracking-wider">
                  <span>Enter = enviar</span>
                  <span>Mic = gravar voz</span>
                  <span>URL = auto-link</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
