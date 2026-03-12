import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { GlassCard, GlassButton, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { BrainstormOutput, OutputType } from '../../stores/brainstormStore';

const typeConfig: Record<OutputType, { label: string; icon: typeof BookOpen; color: string }> = {
  'action-plan': { label: 'Plano de Acao', icon: Zap, color: '#D1FF00' },
  story: { label: 'Story AIOS', icon: BookOpen, color: '#0099FF' },
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard
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
            <GlassButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              aria-label="Copiar"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDownload}
              aria-label="Download"
            >
              <Download size={12} />
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefine}
              aria-label="Refinar"
            >
              <RefreshCw size={12} />
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRemove}
              aria-label="Remover"
            >
              <Trash2 size={12} className="text-red-400" />
            </GlassButton>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-glass-border">
                <pre className="text-xs text-secondary whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto glass-scrollbar">
                  {output.content}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-glass-border">
                <GlassButton
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
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={onRefine}
                >
                  <RefreshCw size={12} /> Refinar
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

export function OutputPreview({ outputs, onRefine, onRemove, onExport }: OutputPreviewProps) {
  if (outputs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-tertiary font-mono px-1">
        Outputs Gerados ({outputs.length})
      </h3>
      <AnimatePresence>
        {outputs.map((output) => (
          <OutputCard
            key={output.id}
            output={output}
            onRefine={() => onRefine(output.id)}
            onRemove={() => onRemove(output.id)}
            onExport={() => onExport(output)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
