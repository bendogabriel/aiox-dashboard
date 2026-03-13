import { useState } from 'react';
import { Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CockpitCard, CockpitButton, Badge } from '../ui';
import { vaultApiService } from '../../services/api/vault';
import { useVaultStore } from '../../stores/vaultStore';

const PROVIDERS = [
  { id: 'claude', name: 'Claude', hint: 'Cole suas memories do Claude (Settings > Memory > View all)' },
  { id: 'chatgpt', name: 'ChatGPT', hint: 'Cole conversas ou memories exportadas do ChatGPT' },
  { id: 'gemini', name: 'Gemini', hint: 'Cole conversas ou Saved Info do Google Gemini' },
  { id: 'copilot', name: 'Copilot', hint: 'Cole o conteudo do Microsoft Copilot' },
  { id: 'auto', name: 'Auto-detect', hint: 'Cole qualquer conteudo — detectamos o provider' },
];

const GUIDED_PROMPT = `Export all your stored memories and context about me. Preserve my words verbatim, especially for instructions and preferences. Format each memory as a separate item.`;

interface AiMemoryImportProps {
  workspaceId: string;
  onClose: () => void;
}

export default function AiMemoryImport({ workspaceId, onClose }: AiMemoryImportProps) {
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [content, setContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; provider: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!content.trim()) return;

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await vaultApiService.importAiMemory({
        content: content.trim(),
        workspaceId,
        provider: selectedProvider === 'auto' ? undefined : selectedProvider,
      });

      setResult({ imported: response.imported, provider: response.provider });

      // Refresh store
      const store = useVaultStore.getState();
      store._initFromSupabase();
    } catch (err) {
      setError((err as Error).message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  if (result) {
    return (
      <CockpitCard variant="subtle" padding="md">
        <div className="text-center py-6 space-y-3">
          <CheckCircle size={40} className="mx-auto text-[var(--color-status-success)]" />
          <h3 className="text-sm font-medium text-primary">Import Completo</h3>
          <p className="text-xs text-secondary">
            <span className="text-[var(--aiox-lime)] font-semibold">{result.imported}</span> documentos importados
            do <Badge variant="subtle" size="sm">{result.provider}</Badge>
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <CockpitButton size="sm" variant="ghost" onClick={() => { setResult(null); setContent(''); }}>
              Importar mais
            </CockpitButton>
            <CockpitButton size="sm" variant="primary" onClick={onClose}>
              Fechar
            </CockpitButton>
          </div>
        </div>
      </CockpitCard>
    );
  }

  return (
    <CockpitCard variant="subtle" padding="md">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={18} className="text-[var(--aiox-lime)]" />
        <h3 className="text-sm font-medium text-primary">Import AI Memory</h3>
      </div>

      {/* Provider selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PROVIDERS.map((p) => (
          <CockpitButton
            key={p.id}
            size="sm"
            variant={selectedProvider === p.id ? 'primary' : 'ghost'}
            onClick={() => setSelectedProvider(p.id)}
          >
            {p.name}
          </CockpitButton>
        ))}
      </div>

      {/* Hint for selected provider */}
      <p className="text-xs text-tertiary mb-3">
        {PROVIDERS.find((p) => p.id === selectedProvider)?.hint}
      </p>

      {/* Guided extraction prompt */}
      <div className="mb-3 p-2 bg-white/[0.03] rounded border border-white/5">
        <p className="text-[10px] text-tertiary uppercase tracking-wider mb-1">Prompt para extrair memories:</p>
        <p className="text-xs text-secondary font-mono">{GUIDED_PROMPT}</p>
      </div>

      {/* Paste area */}
      <textarea
        placeholder="Cole aqui o conteudo exportado do seu AI assistant..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-primary placeholder-tertiary focus:outline-none focus:border-[var(--aiox-lime)]/50 resize-none font-mono mb-3"
      />

      {/* Stats */}
      {content.trim() && (
        <div className="flex items-center gap-3 text-xs text-tertiary mb-3">
          <span>{content.split(/\s+/).length} palavras</span>
          <span>{Math.ceil(content.split(/\s+/).length / 0.75)} tokens (est.)</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-[var(--bb-error)] mb-3">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <CockpitButton size="sm" variant="ghost" onClick={onClose}>
          Cancelar
        </CockpitButton>
        <CockpitButton
          size="sm"
          variant="primary"
          onClick={handleImport}
          disabled={!content.trim() || isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1" />
              Importando...
            </>
          ) : (
            'Importar'
          )}
        </CockpitButton>
      </div>
    </CockpitCard>
  );
}
