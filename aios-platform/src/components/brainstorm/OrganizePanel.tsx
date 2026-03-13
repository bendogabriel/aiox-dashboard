import { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileText,
  Layers,
  ClipboardList,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CockpitButton, CockpitCard, ProgressBar, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { OutputType, BrainstormIdea } from '../../stores/brainstormStore';

const outputOptions: { type: OutputType; label: string; description: string; icon: typeof BookOpen }[] = [
  { type: 'action-plan', label: 'Plano de Acao', description: 'Tarefas priorizadas com dependencias', icon: Zap },
  { type: 'story', label: 'Story AIOS', description: 'Story com AC, scope e criterios', icon: BookOpen },
  { type: 'prd', label: 'PRD', description: 'Documento de requisitos do produto', icon: FileText },
  { type: 'epic', label: 'Epic', description: 'Epic com stories e plano de execucao', icon: Layers },
  { type: 'requirements', label: 'Requirements', description: 'FRs, NFRs e constraints', icon: ClipboardList },
];

interface OrganizePanelProps {
  ideas: BrainstormIdea[];
  isOrganizing: boolean;
  progress: number;
  onOrganize: (selectedTypes: OutputType[]) => void;
  disabled?: boolean;
}

export function OrganizePanel({
  ideas,
  isOrganizing,
  progress,
  onOrganize,
  disabled,
}: OrganizePanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<OutputType[]>(['action-plan']);
  const [expanded, setExpanded] = useState(false);

  const toggleType = (type: OutputType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleOrganize = () => {
    if (selectedTypes.length > 0) {
      onOrganize(selectedTypes);
    }
  };

  const ideaCount = ideas.length;
  const taggedCount = ideas.filter((i) => i.tags.length > 0).length;

  if (isOrganizing) {
    return (
      <CockpitCard padding="md" className="border border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Organizando ideias...</span>
          </div>
          <ProgressBar value={progress} />
          <p className="text-xs text-tertiary">
            Analisando {ideaCount} ideias e gerando estrutura AIOS
          </p>
        </div>
      </CockpitCard>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="subtle" className="text-xs">
          {ideaCount} ideias
        </Badge>
        {taggedCount > 0 && (
          <Badge variant="subtle" className="text-xs">
            {taggedCount} com tags
          </Badge>
        )}
        {ideas.some((i) => i.type === 'voice') && (
          <Badge variant="subtle" className="text-xs">
            {ideas.filter((i) => i.type === 'voice').length} voz
          </Badge>
        )}
      </div>

      {/* Output type selector */}
      <div>
        <button
          className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors mb-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Tipo de output ({selectedTypes.length} selecionados)
        </button>

        {expanded && (
            <div
              className="overflow-hidden space-y-1"
            >
              {outputOptions.map((opt) => {
                const Icon = opt.icon;
                const selected = selectedTypes.includes(opt.type);
                return (
                  <button
                    key={opt.type}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all border',
                      selected
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-transparent hover:bg-white/5 text-secondary'
                    )}
                    onClick={() => toggleType(opt.type)}
                  >
                    <Icon size={16} className={selected ? 'text-primary' : 'text-tertiary'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className="text-[10px] text-tertiary truncate">{opt.description}</p>
                    </div>
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
</div>

      {/* Organize CTA */}
      <CockpitButton
        variant="secondary"
        className="w-full gap-2 font-medium"
        onClick={handleOrganize}
        disabled={disabled || ideaCount === 0 || selectedTypes.length === 0}
      >
        <Sparkles size={16} />
        Organizar com IA
      </CockpitButton>

      {ideaCount === 0 && (
        <p className="text-[10px] text-tertiary text-center">
          Adicione pelo menos 1 ideia para organizar
        </p>
      )}
    </div>
  );
}
