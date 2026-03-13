/**
 * MarketplaceSearch — Full-text search bar with suggestions and history
 * Story 2.3
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { useMarketplaceStore } from '../../../stores/marketplaceStore';
import { useSearchSuggestions } from '../../../hooks/useMarketplace';

export function MarketplaceSearch() {
  const { filters, setQuery, searchHistory, addSearchHistory, clearSearchHistory } = useMarketplaceStore();
  const [localQuery, setLocalQuery] = useState(filters.query ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggestions from API
  const { data: suggestions } = useSearchSuggestions(localQuery);

  // Debounced search
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setQuery(value || undefined as unknown as string);
        if (value.trim()) addSearchHistory(value.trim());
      }, 500);
    },
    [setQuery, addSearchHistory],
  );

  const handleChange = (value: string) => {
    setLocalQuery(value);
    setShowDropdown(true);
    debouncedSearch(value);
  };

  const handleSubmit = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery(value);
    setQuery(value || undefined as unknown as string);
    if (value.trim()) addSearchHistory(value.trim());
    setShowDropdown(false);
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery(undefined as unknown as string);
    inputRef.current?.focus();
  };

  // Escape to clear
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (localQuery) {
        handleClear();
      } else {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    }
    if (e.key === 'Enter') {
      handleSubmit(localQuery);
    }
  };

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const suggestionNames = suggestions?.data?.map((l) => l.name) ?? [];
  const hasDropdownContent = showDropdown && (suggestionNames.length > 0 || searchHistory.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="
        flex items-center gap-2
        bg-[var(--color-bg-surface,#0a0a0a)]
        border border-[var(--color-border-default,#333)]
        focus-within:border-[var(--aiox-lime,#D1FF00)]/50
        transition-colors px-3 h-10
      ">
        <Search size={14} className="text-[var(--color-text-muted,#666)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar agentes..."
          className="
            flex-1 bg-transparent font-mono text-sm
            text-[var(--color-text-primary,#fff)]
            placeholder:text-[var(--color-text-muted,#666)]
            focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aiox-lime)]/50
          "
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown: suggestions + history */}
      {hasDropdownContent && (
        <div className="
          absolute top-full left-0 right-0 z-50 mt-1
          bg-[var(--color-bg-surface,#0a0a0a)]
          border border-[var(--color-border-default,#333)]
          max-h-64 overflow-y-auto
        ">
          {/* API suggestions */}
          {suggestionNames.length > 0 && (
            <div className="p-1">
              <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">
                Sugestoes
              </p>
              {suggestionNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSubmit(name)}
                  className="
                    w-full text-left px-2 py-1.5 flex items-center gap-2
                    text-xs font-mono text-[var(--color-text-secondary,#999)]
                    hover:bg-[var(--color-bg-elevated,#1a1a1a)]
                    hover:text-[var(--color-text-primary,#fff)]
                    transition-colors
                  "
                >
                  <ArrowRight size={10} className="shrink-0 text-[var(--color-text-muted,#666)]" />
                  <span className="truncate">{name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search history */}
          {searchHistory.length > 0 && (
            <div className="p-1 border-t border-[var(--color-border-default,#333)]">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">
                  Recentes
                </p>
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="text-[10px] font-mono text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
                >
                  Limpar
                </button>
              </div>
              {searchHistory.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSubmit(q)}
                  className="
                    w-full text-left px-2 py-1.5 flex items-center gap-2
                    text-xs font-mono text-[var(--color-text-secondary,#999)]
                    hover:bg-[var(--color-bg-elevated,#1a1a1a)]
                    hover:text-[var(--color-text-primary,#fff)]
                    transition-colors
                  "
                >
                  <Clock size={10} className="shrink-0 text-[var(--color-text-muted,#666)]" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
