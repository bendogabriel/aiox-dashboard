/**
 * VaultImportDialog — Modal to save an artifact or entire task output to the Vault.
 */
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Vault,
  Check,
  Loader2,
  FolderOpen,
  Tag,
} from 'lucide-react';
import type { TaskArtifact } from '../../services/api/tasks';
import type { VaultWorkspace, VaultDocument } from '../../types/vault';
import { supabaseVaultService } from '../../services/supabase/vault';
import { getArtifactLabel } from '../../lib/artifact-parser';

const DOC_TYPES: Array<{ value: VaultDocument['type']; label: string }> = [
  { value: 'strategy', label: 'Estratégia' },
  { value: 'diagnostic', label: 'Diagnóstico' },
  { value: 'template', label: 'Template' },
  { value: 'proof', label: 'Prova/Case' },
  { value: 'brand', label: 'Marca' },
  { value: 'narrative', label: 'Narrativa' },
  { value: 'generic', label: 'Genérico' },
];

const CATEGORIES = [
  { value: 'tech', label: 'Tecnologia' },
  { value: 'products', label: 'Produtos' },
  { value: 'company', label: 'Empresa' },
  { value: 'operations', label: 'Operações' },
  { value: 'brand', label: 'Marca' },
  { value: 'campaigns', label: 'Campanhas' },
];

export const VaultImportDialog = memo(function VaultImportDialog({
  visible,
  artifact,
  taskDemand,
  stepName,
  onClose,
  onSaved,
}: {
  visible: boolean;
  artifact: TaskArtifact | null;
  taskDemand: string;
  stepName?: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [workspaces, setWorkspaces] = useState<VaultWorkspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [docType, setDocType] = useState<VaultDocument['type']>('generic');
  const [category, setCategory] = useState('tech');
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      // Load workspaces
      supabaseVaultService.listWorkspaces().then(ws => {
        if (ws) setWorkspaces(ws);
      });
      // Auto-fill name from artifact/step
      if (artifact) {
        const autoName = artifact.title || artifact.filename || `${stepName || 'output'} - ${getArtifactLabel(artifact.type)}`;
        setName(autoName);
      }
      setSaved(false);
    }
  }, [visible, artifact, stepName]);

  const handleSave = async () => {
    if (!artifact || !name.trim()) return;

    setSaving(true);
    try {
      const doc: VaultDocument = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type: docType,
        content: artifact.content,
        status: 'draft',
        tokenCount: Math.ceil(artifact.content.length / 4),
        source: `orchestration:${taskDemand.slice(0, 100)}`,
        taxonomy: tags.split(',').map(t => t.trim()).filter(Boolean).join(', '),
        consumers: [],
        lastUpdated: new Date().toISOString(),
        categoryId: category,
        workspaceId: selectedWorkspace || 'default',
      };

      await supabaseVaultService.upsertDocument(doc);
      setSaved(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save to vault:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Vault className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Salvar no Vault</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/40">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Artifact preview */}
              {artifact && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      {getArtifactLabel(artifact.type)}
                    </span>
                    {artifact.language && (
                      <span className="font-mono">{artifact.language}</span>
                    )}
                    <span>{artifact.content.length} chars</span>
                  </div>
                  <p className="text-xs text-white/30 truncate font-mono">
                    {artifact.content.slice(0, 100)}...
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                  placeholder="Nome do documento..."
                />
              </div>

              {/* Workspace */}
              {workspaces.length > 0 && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" /> Workspace
                  </label>
                  <select
                    value={selectedWorkspace}
                    onChange={e => setSelectedWorkspace(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">Selecione...</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Tipo</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value as VaultDocument['type'])}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {DOC_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-white/50 mb-1 block flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                  placeholder="api, auth, backend..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white/60 hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved || !name.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  saved
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : saved ? (
                  <><Check className="w-4 h-4" /> Salvo!</>
                ) : (
                  <><Vault className="w-4 h-4" /> Salvar</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
