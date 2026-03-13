import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Layers,
  ClipboardList,
  Zap,
  Copy,
  Download,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  KanbanSquare,
} from 'lucide-react';
import { CockpitCard, CockpitButton, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { BrainstormOutput, OutputType } from '../../stores/brainstormStore';

const typeConfig: Record<OutputType, { label: string; icon: typeof BookOpen; color: string }> = {
  'action-plan': { label: 'Plano de Acao', icon: Zap, color: 'var(--aiox-lime)' },
  story: { label: 'Story AIOS', icon: BookOpen, color: 'var(--aiox-blue)' },
  prd: { label: 'PRD', icon: FileText, color: '#ED4609' },
  epic: { label: 'Epic', icon: Layers, color: '#4ADE80' },
  requirements: { label: 'Requirements', icon: ClipboardList, color: '#f59e0b' },
};

interface OutputPreviewProps {
  outputs: BrainstormOutput[];
  onRefine: (outputId: string) => void;
  onRemove: (outputId: string) => void;
  onExport: (output: BrainstormOutput) => void;
}

function OutputCard({
  output,
  onRefine,
  onRemove,
  onExport,
}: {
  output: BrainstormOutput;
  onRefine: () => void;
  onRemove: () => void;
  onExport: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const config = typeConfig[output.type];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = output.type === 'epic' ? 'yaml' : 'md';
    const blob = new Blob([output.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${output.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
    >
      <CockpitCard
        padding="md"
        className="border-l-2"
        style={{ borderLeftColor: config.color }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <button
            className="flex items-center gap-2 flex-1 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Icon size={16} style={{ color: config.color }} />
            <Badge
              variant="subtle"
              className="text-[10px]"
              style={{ borderColor: config.color, color: config.color }}
            >
              {config.label}
            </Badge>
            <span className="text-sm font-medium text-primary truncate">{output.title}</span>
          </button>

          <div className="flex items-center gap-1">
            <CockpitButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              aria-label="Copiar"
            >
              {copied ? <Check size={12} className="text-[var(--color-status-success)]" /> : <Copy size={12} />}
            </CockpitButton>
            <CockpitButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDownload}
              aria-label="Download"
            >
              <Download size={12} />
            </CockpitButton>
            <CockpitButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefine}
              aria-label="Refinar"
            >
              <RefreshCw size={12} />
            </CockpitButton>
            <CockpitButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRemove}
              aria-label="Remover"
            >
              <Trash2 size={12} className="text-[var(--bb-error)]" />
            </CockpitButton>
          </div>
        </div>

        {/* Content */}
        {expanded && (
            <div
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-glass-border">
                <pre className="text-xs text-secondary whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto glass-scrollbar">
                  {output.content}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-glass-border">
                <CockpitButton
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={onExport}
                >
                  {output.type === 'story' || output.type === 'action-plan' ? (
                    <><KanbanSquare size={12} /> Adicionar ao Kanban</>
                  ) : (
                    <><Download size={12} /> Download .md</>
                  )}
                </CockpitButton>
                <CockpitButton
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={onRefine}
                >
                  <RefreshCw size={12} /> Refinar
                </CockpitButton>
              </div>
            </div>
          )}
</CockpitCard>
    </div>
  );
}

export function OutputPreview({ outputs, onRefine, onRemove, onExport }: OutputPreviewProps) {
  if (outputs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-tertiary font-mono px-1">
        Outputs Gerados ({outputs.length})
      </h3>
      {outputs.map((output) => (
          <OutputCard
            key={output.id}
            output={output}
            onRefine={() => onRefine(output.id)}
            onRemove={() => onRemove(output.id)}
            onExport={() => onExport(output)}
          />
        ))}
</div>
  );
}
