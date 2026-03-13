import { useState } from 'react';
import { Search, Plus, Database, Star, Info } from 'lucide-react';
import { CockpitCard, CockpitButton, CockpitInput, CockpitTextarea, Badge, Dialog } from '../ui';
import { cn } from '../../lib/utils';
import { useRecallMemory, useStoreMemory } from '../../hooks/useEngine';

export default function MemoryBrowser() {
  const [scope, setScope] = useState('global');
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, isFetching } = useRecallMemory(scope, searchQuery, 10);

  function handleSearch() {
    if (query.trim()) {
      setSearchQuery(query.trim());
      setHasSearched(true);
    }
  }

  function handleScopeChange(newScope: string) {
    setScope(newScope);
    // Re-run search with new scope if there's an active query
    if (searchQuery) {
      // Force re-fetch by updating searchQuery (React Query will detect scope change via key)
      setSearchQuery(prev => prev); // scope is part of the query key, so this triggers refetch
    }
  }

  const scopes = ['global', 'development', 'orchestrator', 'design', 'analytics', 'content'];

  return (
    <div className="space-y-4">
      {/* Scope selector */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {scopes.map((s) => (
          <button
            key={s}
            onClick={() => handleScopeChange(s)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-all',
              scope === s
                ? 'bg-primary/20 text-primary font-medium'
                : 'text-tertiary hover:text-secondary hover:bg-white/5',
            )}
          >
            {s}
          </button>
        ))}
        <CockpitButton
          size="sm"
          variant="ghost"
          leftIcon={<Plus className="h-3 w-3" />}
          onClick={() => setShowStoreForm(true)}
          className="ml-auto"
        >
          Armazenar
        </CockpitButton>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <CockpitInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por palavra-chave..."
            leftIcon={<Search className="h-4 w-4" />}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <CockpitButton
          variant="primary"
          onClick={handleSearch}
          loading={isFetching}
          disabled={!query.trim()}
        >
          Buscar
        </CockpitButton>
      </div>

      {/* Results */}
      {!hasSearched ? (
        <CockpitCard padding="md" variant="subtle">
          <div className="flex items-start gap-3 text-sm">
            <Info className="h-4 w-4 text-[var(--aiox-blue)] flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-secondary">
                A memória do engine armazena informações persistentes que os agentes usam durante execuções.
              </p>
              <p className="text-tertiary text-xs">
                <strong className="text-secondary">Como buscar:</strong> Digite uma palavra-chave e clique em "Buscar" para encontrar memórias no scope "{scope}".
                Exemplos: "arquitetura", "decisão", "configuração"
              </p>
              <p className="text-tertiary text-xs">
                <strong className="text-secondary">Scopes:</strong> Cada scope é um namespace isolado. "global" contém memórias compartilhadas, os demais são específicos por área.
              </p>
            </div>
          </div>
        </CockpitCard>
      ) : isLoading ? (
        <div className="text-secondary text-sm p-4 flex items-center gap-2 justify-center">
          <div className="h-4 w-4 border-2 border-[var(--aiox-blue)] border-t-transparent rounded-full animate-spin" />
          Buscando memórias...
        </div>
      ) : !data?.memories.length ? (
        <CockpitCard padding="md" variant="subtle">
          <div className="text-center space-y-2">
            <Database className="h-8 w-8 mx-auto text-tertiary/30" />
            <p className="text-tertiary text-sm">
              Nenhuma memória encontrada para "<span className="text-secondary">{searchQuery}</span>" no scope "<span className="text-secondary">{scope}</span>"
            </p>
            <p className="text-tertiary text-xs">
              Tente outro termo ou scope. Você também pode armazenar novas memórias clicando em "Armazenar".
            </p>
          </div>
        </CockpitCard>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-tertiary">
            {data.memories.length} resultado(s) em "{scope}"
          </div>
          {data.memories.map((mem) => (
            <CockpitCard key={mem.id} padding="md" variant="subtle">
              <div className="flex items-start gap-3">
                <Database className="h-3.5 w-3.5 mt-1 text-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-primary whitespace-pre-wrap break-words">
                    {mem.content}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-[10px] text-tertiary">{mem.id.slice(0, 12)}...</code>
                    {mem.score !== undefined && (
                      <Badge variant="default" className="text-[10px]">
                        <Star className="h-2.5 w-2.5 mr-0.5 inline" />
                        {(mem.score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CockpitCard>
          ))}
        </div>
      )}

      {/* Store memory form */}
      <StoreMemoryDialog
        isOpen={showStoreForm}
        onClose={() => setShowStoreForm(false)}
        defaultScope={scope}
      />
    </div>
  );
}

function StoreMemoryDialog({
  isOpen,
  onClose,
  defaultScope,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultScope: string;
}) {
  const storeMemory = useStoreMemory();
  const [scope, setScope] = useState(defaultScope);
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    const e: Record<string, string> = {};
    if (!scope.trim()) e.scope = 'Scope obrigatório';
    if (!content.trim()) e.content = 'Conteúdo obrigatório';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    storeMemory.mutate(
      { scope: scope.trim(), content: content.trim() },
      {
        onSuccess: () => {
          setContent('');
          onClose();
        },
      },
    );
  }

  function handleClose() {
    setErrors({});
    setContent('');
    onClose();
  }

  const footer = (
    <>
      <CockpitButton variant="ghost" onClick={handleClose}>
        Cancelar
      </CockpitButton>
      <CockpitButton
        variant="primary"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={handleSubmit}
        loading={storeMemory.isPending}
      >
        Armazenar
      </CockpitButton>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Armazenar Memória"
      description="Salvar informação na memória do engine"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <CockpitInput
          label="Scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          error={errors.scope}
          placeholder="global, development, ..."
        />
        <CockpitTextarea
          label="Conteúdo"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={errors.content}
          placeholder="Informação a ser armazenada..."
          rows={5}
        />
        {storeMemory.isError && (
          <div className="text-sm text-[var(--bb-error)] bg-[var(--bb-error)]/10 p-3 rounded-lg">
            {(storeMemory.error as Error).message || 'Erro ao armazenar memória'}
          </div>
        )}
      </div>
    </Dialog>
  );
}
