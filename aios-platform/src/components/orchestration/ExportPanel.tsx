/**
 * ExportPanel — Action bar for exporting task results.
 * Supports: JSON, Markdown, ZIP bundle, share link.
 */
import { useState, memo } from 'react';
import {
  Download,
  FileJson,
  FileText,
  Package,
  Share2,
  Check,
  ChevronDown,
  Vault,
} from 'lucide-react';
import type { Task } from '../../services/api/tasks';
import {
  exportTaskAsJSON,
  exportTaskAsMarkdown,
  exportTaskAsZip,
  copyTaskShareLink,
} from '../../lib/taskExport';

export const ExportPanel = memo(function ExportPanel({
  task,
  onSaveAllToVault,
}: {
  task: Task;
  onSaveAllToVault?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [shared, setShared] = useState(false);

  if (task.status !== 'completed' && task.status !== 'failed') return null;

  const handleShare = async () => {
    const ok = await copyTaskShareLink(task.id);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="rounded-none border border-white/10 bg-white/5 overflow-hidden">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-[var(--aiox-blue)]" />
          <span className="text-sm font-medium text-white/80">Exportar Resultados</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--aiox-blue)]/10 text-[var(--aiox-blue)]">
            {task.outputs.length} outputs
          </span>
        </div>
        <span className="text-white/30">
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      {expanded && (
          <div
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {/* ZIP Bundle */}
              <button
                onClick={() => exportTaskAsZip(task)}
                className="flex items-center gap-3 p-3 rounded-none bg-[var(--aiox-blue)]/10 border border-[var(--aiox-blue)]/20 hover:bg-[var(--aiox-blue)]/20 transition-colors text-left group"
              >
                <Package className="w-5 h-5 text-[var(--aiox-blue)] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white/90 group-hover:text-white">ZIP Bundle</p>
                  <p className="text-[10px] text-white/40">Todos os artefatos organizados</p>
                </div>
              </button>

              {/* JSON */}
              <button
                onClick={() => exportTaskAsJSON(task)}
                className="flex items-center gap-3 p-3 rounded-none bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
              >
                <FileJson className="w-5 h-5 text-[var(--color-status-success)] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white/90 group-hover:text-white">JSON</p>
                  <p className="text-[10px] text-white/40">Dados estruturados</p>
                </div>
              </button>

              {/* Markdown */}
              <button
                onClick={() => exportTaskAsMarkdown(task)}
                className="flex items-center gap-3 p-3 rounded-none bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
              >
                <FileText className="w-5 h-5 text-[var(--aiox-gray-muted)] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white/90 group-hover:text-white">Markdown</p>
                  <p className="text-[10px] text-white/40">Report completo</p>
                </div>
              </button>

              {/* Share Link */}
              <button
                onClick={handleShare}
                className="flex items-center gap-3 p-3 rounded-none bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
              >
                {shared ? (
                  <Check className="w-5 h-5 text-[var(--color-status-success)] flex-shrink-0" />
                ) : (
                  <Share2 className="w-5 h-5 text-[var(--bb-flare)] flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-white/90 group-hover:text-white">
                    {shared ? 'Link copiado!' : 'Share Link'}
                  </p>
                  <p className="text-[10px] text-white/40">Copiar link compartilhável</p>
                </div>
              </button>

              {/* Save All to Vault */}
              {onSaveAllToVault && (
                <button
                  onClick={onSaveAllToVault}
                  className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-none bg-gradient-to-r from-[var(--aiox-blue)]/10 to-[var(--aiox-gray-muted)]/10 border border-[var(--aiox-blue)]/20 hover:from-[var(--aiox-blue)]/20 hover:to-[var(--aiox-gray-muted)]/20 transition-colors group"
                >
                  <Vault className="w-5 h-5 text-[var(--aiox-blue)]" />
                  <span className="text-sm font-medium text-white/90 group-hover:text-white">
                    Salvar tudo no Vault
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
</div>
  );
});
