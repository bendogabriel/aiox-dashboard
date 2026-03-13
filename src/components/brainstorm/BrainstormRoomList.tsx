import { useState } from 'react';
import {
  Plus,
  Lightbulb,
  Trash2,
  Clock,
  MessageSquare,
  Type,
  Mic,
  Link2,
  Sparkles,
} from 'lucide-react';
import { CockpitCard, CockpitButton, CockpitInput } from '../ui';
import { cn } from '../../lib/utils';
import type { BrainstormRoom } from '../../stores/brainstormStore';

interface BrainstormRoomListProps {
  rooms: BrainstormRoom[];
  activeRoomId: string | null;
  onSelect: (roomId: string) => void;
  onCreate: (name: string, description?: string) => void;
  onDelete: (roomId: string) => void;
}

export function BrainstormRoomList({
  rooms,
  activeRoomId,
  onSelect,
  onCreate,
  onDelete,
}: BrainstormRoomListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim(), newDesc.trim() || undefined);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const phaseLabels: Record<string, string> = {
    collecting: 'Coletando',
    organizing: 'Organizando',
    reviewing: 'Revisando',
    exporting: 'Exportando',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Lightbulb size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-primary">Brainstorm</h2>
        </div>
        <CockpitButton
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={14} /> Nova Sala
        </CockpitButton>
      </div>

      {/* Create form */}
      {showCreate && (
          <div
            className="overflow-hidden border-b border-glass-border"
          >
            <div className="p-4 space-y-3">
              <CockpitInput
                placeholder="Nome da sala..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <CockpitInput
                placeholder="Descricao (opcional)..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-2 justify-end">
                <CockpitButton variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                  Cancelar
                </CockpitButton>
                <CockpitButton variant="secondary" size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                  Criar
                </CockpitButton>
              </div>
            </div>
          </div>
        )}
{/* Room list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 glass-scrollbar">
        {rooms.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-16 w-16 rounded-none bg-primary/10 flex items-center justify-center">
              <Lightbulb size={32} className="text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Nenhuma sala de brainstorm</p>
              <p className="text-xs text-tertiary max-w-[240px]">
                Crie uma sala para despejar suas ideias e deixar a IA organizar em planos de acao AIOS
              </p>
            </div>
            <CockpitButton variant="secondary" size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Criar primeira sala
            </CockpitButton>
          </div>
        )}

        {rooms.map((room) => (
            <div
              key={room.id}
            >
              <CockpitCard
                variant="default"
                padding="md"
                className={cn(
                  'cursor-pointer group transition-all',
                  activeRoomId === room.id && 'border-primary/30 bg-primary/5'
                )}
                onClick={() => onSelect(room.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-primary truncate">{room.name}</h3>
                    {room.description && (
                      <p className="text-xs text-tertiary truncate mt-0.5">{room.description}</p>
                    )}
                  </div>
                  <CockpitButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(room.id);
                    }}
                    aria-label="Deletar sala"
                  >
                    <Trash2 size={12} className="text-[var(--bb-error)]" />
                  </CockpitButton>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-tertiary">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={10} />
                    {room.ideas.length} ideias
                  </span>
                  {/* Idea type indicators */}
                  <span className="flex items-center gap-1">
                    {room.ideas.some((i) => i.type === 'text') && <Type size={9} aria-label="Texto" />}
                    {room.ideas.some((i) => i.type === 'voice') && <Mic size={9} aria-label="Voz" />}
                    {room.ideas.some((i) => i.type === 'link') && <Link2 size={9} aria-label="Links" />}
                  </span>
                  {room.outputs.length > 0 && (
                    <span className="flex items-center gap-1 text-primary">
                      <Sparkles size={9} />
                      {room.outputs.length}
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock size={10} />
                    {formatDate(room.updatedAt)}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono"
                    style={{
                      backgroundColor: 'var(--color-primary-alpha, rgba(209,255,0,0.1))',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {phaseLabels[room.phase] || room.phase}
                  </span>
                </div>
              </CockpitCard>
            </div>
          ))}
</div>
    </div>
  );
}
