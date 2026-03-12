import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Type,
  Mic,
  Link2,
  Image,
  File,
  X,
  Tag,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { BrainstormIdea, IdeaType } from '../../stores/brainstormStore';

const typeIcons: Record<IdeaType, typeof Type> = {
  text: Type,
  voice: Mic,
  link: Link2,
  image: Image,
  file: File,
};

const typeLabels: Record<IdeaType, string> = {
  text: 'Texto',
  voice: 'Voz',
  link: 'Link',
  image: 'Imagem',
  file: 'Arquivo',
};

interface IdeaCardProps {
  idea: BrainstormIdea;
  onUpdate: (ideaId: string, updates: Partial<BrainstormIdea>) => void;
  onRemove: (ideaId: string) => void;
  onTagIdea: (ideaId: string, tags: string[]) => void;
  onDragStart?: (ideaId: string) => void;
  compact?: boolean;
}

export function IdeaCard({
  idea,
  onUpdate,
  onRemove,
  onTagIdea,
  onDragStart,
  compact = false,
}: IdeaCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(idea.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const TypeIcon = typeIcons[idea.type];

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(idea.id, { content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...new Set([...idea.tags, tagInput.trim().toLowerCase()])];
      onTagIdea(idea.id, newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagIdea(idea.id, idea.tags.filter((t) => t !== tag));
  };

  const accentColor = idea.color || 'var(--color-primary)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <GlassCard
        variant="default"
        padding={compact ? 'sm' : 'md'}
        className={cn(
          'relative transition-all border-l-2 hover:shadow-lg',
          compact ? 'w-full' : 'w-[260px]'
        )}
        style={{ borderLeftColor: accentColor }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {!compact && (
            <button
              className="cursor-grab opacity-0 group-hover:opacity-60 transition-opacity"
              onMouseDown={() => onDragStart?.(idea.id)}
              aria-label="Arrastar ideia"
            >
              <GripVertical size={14} className="text-tertiary" />
            </button>
          )}

          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}
          >
            <TypeIcon size={10} />
            {typeLabels[idea.type]}
          </span>

          <div className="flex-1" />

          <div className="relative" ref={menuRef}>
            <GlassButton
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu da ideia"
            >
              <MoreVertical size={12} />
            </GlassButton>

            {showMenu && (
              <div className="absolute right-0 top-7 z-50 glass-panel border border-glass-border rounded-lg shadow-lg py-1 min-w-[140px]">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 text-secondary"
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 text-secondary"
                  onClick={() => { setShowTagInput(true); setShowMenu(false); }}
                >
                  <Tag size={12} /> Tags
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 text-red-400"
                  onClick={() => { onRemove(idea.id); setShowMenu(false); }}
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="w-full bg-transparent border border-glass-border rounded p-2 text-sm text-primary resize-none focus:outline-none focus:border-primary/50"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="flex gap-1 justify-end">
              <GlassButton variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X size={12} />
              </GlassButton>
              <GlassButton variant="default" size="sm" onClick={handleSaveEdit}>
                <Check size={12} />
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="text-sm text-secondary leading-relaxed">
            {idea.type === 'link' ? (
              <a
                href={idea.rawContent || idea.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {idea.content}
              </a>
            ) : idea.type === 'voice' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Mic size={10} className="text-primary" />
                  <span>Transcricao de voz</span>
                </div>
                <p className="italic">{idea.content}</p>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{idea.content}</p>
            )}
          </div>
        )}

        {/* Tags */}
        {(idea.tags.length > 0 || showTagInput) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {idea.tags.map((tag) => (
              <Badge
                key={tag}
                variant="subtle"
                className="text-[10px] px-1.5 py-0 cursor-pointer hover:line-through"
                onClick={() => handleRemoveTag(tag)}
              >
                #{tag}
              </Badge>
            ))}
            {showTagInput && (
              <div className="flex items-center gap-1">
                <GlassInput
                  className="h-5 text-[10px] w-20 px-1"
                  placeholder="tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setShowTagInput(false);
                  }}
                  autoFocus
                />
                <GlassButton variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowTagInput(false)}>
                  <X size={10} />
                </GlassButton>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
