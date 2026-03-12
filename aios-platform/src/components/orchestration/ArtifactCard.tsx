/**
 * ArtifactCard — Renders a single parsed artifact with syntax highlighting,
 * copy, download, and vault import actions.
 */
import { useState, memo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Download,
  ChevronDown,
  Code2,
  FileText,
  Database,
  Table2,
  GitBranch,
  Vault,
} from 'lucide-react';
import type { TaskArtifact } from '../../services/api/tasks';
import { getArtifactFilename, getArtifactLabel } from '../../lib/artifact-parser';

const MarkdownRenderer = lazy(() => import('../chat/MarkdownRenderer'));

const TYPE_ICONS = {
  code: Code2,
  diagram: GitBranch,
  data: Database,
  table: Table2,
  markdown: FileText,
} as const;

const TYPE_COLORS = {
  code: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  diagram: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  data: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  table: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  markdown: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' },
} as const;

export const ArtifactCard = memo(function ArtifactCard({
  artifact,
  stepName,
  onCopy,
  onDownload,
  onSaveToVault,
  index,
}: {
  artifact: TaskArtifact;
  stepName?: string;
  onCopy: (text: string) => void;
  onDownload: (artifact: TaskArtifact, filename: string) => void;
  onSaveToVault?: (artifact: TaskArtifact) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const Icon = TYPE_ICONS[artifact.type] || FileText;
  const colors = TYPE_COLORS[artifact.type] || TYPE_COLORS.markdown;
  const filename = getArtifactFilename(artifact, stepName);
  const label = getArtifactLabel(artifact.type);
  const isProseOnly = artifact.type === 'markdown' && !artifact.title;

  const handleCopy = () => {
    onCopy(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // For standalone prose sections without titles, render inline (not as a card)
  if (isProseOnly && artifact.content.length < 200) {
    return (
      <div className="text-sm text-white/80 leading-relaxed">
        <Suspense fallback={<div className="animate-pulse text-white/30">...</div>}>
          <MarkdownRenderer content={artifact.content} className="text-sm text-white/90" />
        </Suspense>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
          <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
          {artifact.title && (
            <span className="text-xs text-white/50 truncate">{artifact.title}</span>
          )}
          {artifact.language && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/40 font-mono">
              {artifact.language}
            </span>
          )}
          {artifact.filename && (
            <span className="text-[10px] text-white/30 font-mono truncate">{artifact.filename}</span>
          )}
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            aria-label="Copiar"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download */}
          {artifact.type !== 'markdown' && (
            <button
              onClick={() => onDownload(artifact, filename)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              aria-label="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Vault */}
          {onSaveToVault && artifact.type !== 'markdown' && (
            <button
              onClick={() => onSaveToVault(artifact)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-cyan-400 transition-colors"
              aria-label="Salvar no Vault"
            >
              <Vault className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand/Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 transition-colors"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="block">
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-black/30 border border-white/5 overflow-auto max-h-96">
            {artifact.type === 'markdown' || artifact.type === 'table' ? (
              <div className="p-3">
                <Suspense fallback={<div className="animate-pulse text-white/30 p-2">...</div>}>
                  <MarkdownRenderer content={artifact.content} className="text-sm text-white/90" />
                </Suspense>
              </div>
            ) : artifact.type === 'diagram' && artifact.language === 'mermaid' ? (
              <div className="p-3">
                <Suspense fallback={<div className="animate-pulse text-white/30 p-2">...</div>}>
                  <MarkdownRenderer content={`\`\`\`mermaid\n${artifact.content}\n\`\`\``} className="text-sm" />
                </Suspense>
              </div>
            ) : (
              <pre className="p-3 text-xs text-white/80 font-mono overflow-x-auto whitespace-pre">
                <code>{artifact.content}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});
