import { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Bot,
  Crown,
  Copy,
  Check,
  ChevronDown,
  Target,
  Download,
  Package,
} from 'lucide-react';
import type { AgentOutput, StreamingOutput, TaskArtifact } from './orchestration-types';
import { getSquadColor } from './orchestration-types';
import { parseArtifacts } from '../../lib/artifact-parser';
import { ArtifactCard } from './ArtifactCard';

const MarkdownRenderer = lazy(() => import('../chat/MarkdownRenderer'));

function downloadText(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const AgentOutputCard = memo(function AgentOutputCard({
  output,
  streaming,
  index,
  isReviewer,
  onCopy,
  copied,
  onSaveToVault,
}: {
  output?: AgentOutput;
  streaming?: StreamingOutput;
  index: number;
  isReviewer: boolean;
  onCopy: (text: string) => void;
  copied: boolean;
  onSaveToVault?: (artifact: TaskArtifact, stepName: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [streamElapsed, setStreamElapsed] = useState(() =>
    streaming ? (Date.now() - streaming.startedAt) / 1000 : 0
  );
  const data = output || streaming;

  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      setStreamElapsed((Date.now() - streaming.startedAt) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [streaming]);

  // Parse artifacts: use server-provided if available, otherwise parse client-side
  const artifacts: TaskArtifact[] = output?.artifacts && output.artifacts.length > 0
    ? output.artifacts
    : output?.response ? parseArtifacts(output.response) : [];

  const hasNonProseArtifacts = artifacts.some(a => a.type !== 'markdown');

  const handleDownloadArtifact = useCallback((artifact: TaskArtifact, filename: string) => {
    const mimeMap: Record<string, string> = {
      json: 'application/json', yaml: 'text/yaml', csv: 'text/csv',
      xml: 'application/xml', html: 'text/html', sql: 'text/plain',
    };
    const mime = artifact.language ? (mimeMap[artifact.language] || 'text/plain') : 'text/plain';
    downloadText(artifact.content, filename, mime);
  }, []);

  const handleVaultSave = useCallback((artifact: TaskArtifact) => {
    if (onSaveToVault && data) {
      onSaveToVault(artifact, data.stepName);
    }
  }, [onSaveToVault, data]);

  if (!data) return null;

  const isStreaming = !!streaming;
  const color = getSquadColor(data.agent.squad);
  const response = output?.response || streaming?.accumulated || '';
  const elapsedTime = streaming
    ? streamElapsed.toFixed(1)
    : output?.processingTimeMs
    ? (output.processingTimeMs / 1000).toFixed(1)
    : '0';

  return (
    <motion.div
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden ${
        isReviewer
          ? 'bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10 border-yellow-500/30'
          : isStreaming
          ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 border-cyan-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      {/* Streaming glow effect */}
      {isStreaming && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color.glow}, transparent 70%)`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between p-4">
        <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color.bg, border: `2px solid ${color.border}` }}
              animate={isStreaming ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Bot className="w-6 h-6" style={{ color: color.text }} />
            </motion.div>
            {isStreaming && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
            {data.role === 'reviewer' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-yellow-900" />
              </div>
            )}
            {data.role === 'chief' && !isReviewer && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Target className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">{data.agent.name || data.agent.id}</h2>
              {isStreaming && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400 flex items-center gap-1"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Gerando...
                </motion.span>
              )}
              {isReviewer && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                  Resultado Final
                </span>
              )}
              {!isStreaming && hasNonProseArtifacts && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400/70 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {artifacts.filter(a => a.type !== 'markdown').length} artefatos
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span style={{ color: color.text }}>{data.agent.squad}</span>
              <span>·</span>
              <span className="capitalize">{data.role}</span>
              <span>·</span>
              <span>{elapsedTime}s</span>
              {output?.llmMetadata && (
                <>
                  <span>·</span>
                  <span>{output.llmMetadata.outputTokens} tokens</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStreaming && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCopy(response)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              aria-label="Copiar tudo"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </motion.button>
          )}
          {!isStreaming && hasNonProseArtifacts && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Download all non-markdown artifacts
                artifacts.filter(a => a.type !== 'markdown').forEach((a, i) => {
                  setTimeout(() => {
                    const fn = a.filename || `${data.stepName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}${a.language ? `.${a.language}` : '.txt'}`;
                    handleDownloadArtifact(a, fn);
                  }, i * 100);
                });
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              aria-label="Download artefatos"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-all"
            aria-label={expanded ? 'Recolher' : 'Expandir'}
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="block">
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {isStreaming ? (
                /* Streaming: show raw text with cursor */
                <div
                  className={`p-4 rounded-xl ${
                    isReviewer ? 'bg-black/30' : 'bg-black/20'
                  } border border-white/5`}
                >
                  <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                    {response}
                    <motion.span
                      className="inline-block w-2 h-5 bg-cyan-400 ml-1"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  </div>
                </div>
              ) : artifacts.length > 0 ? (
                /* Completed: show structured artifacts */
                artifacts.map((artifact, artIdx) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    stepName={data.stepName}
                    onCopy={onCopy}
                    onDownload={handleDownloadArtifact}
                    onSaveToVault={onSaveToVault ? handleVaultSave : undefined}
                    index={artIdx}
                  />
                ))
              ) : (
                /* Fallback: plain markdown render */
                <div
                  className={`p-4 rounded-xl ${
                    isReviewer ? 'bg-black/30' : 'bg-black/20'
                  } border border-white/5`}
                >
                  <Suspense fallback={<div className="text-sm text-white/50 animate-pulse">...</div>}>
                    <MarkdownRenderer content={response} className="text-sm text-white/90" />
                  </Suspense>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
