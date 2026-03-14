/**
 * KnowledgeSearchPanel — TF-IDF knowledge search across .aios-core squads.
 *
 * Debounced search input with results showing chunk text, squad, file, and relevance score.
 */
import { useState, useEffect, useCallback } from 'react'
import { Search, FileText, X } from 'lucide-react'
import { CockpitBadge, CockpitSpinner } from '../ui/cockpit'
import { useKnowledgeSearch } from '../../hooks/usePlatformIntelligence'

export function KnowledgeSearchPanel() {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), 400)
    return () => clearTimeout(timer)
  }, [inputValue])

  const { data, isLoading, isFetching } = useKnowledgeSearch(debouncedQuery)
  const results = data?.results || []

  const clearSearch = useCallback(() => {
    setInputValue('')
    setDebouncedQuery('')
  }, [])

  return (
    <div style={{
      padding: '1rem',
      background: 'var(--aiox-surface)',
      border: '1px solid rgba(156,156,156,0.15)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <Search size={14} style={{ color: 'var(--aiox-blue, #0099FF)' }} />
        <span style={{
          fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--aiox-cream)',
        }}>
          Knowledge Search
        </span>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search knowledge base..."
          aria-label="Search knowledge base"
          style={{
            width: '100%',
            padding: '0.5rem 2rem 0.5rem 0.75rem',
            background: 'rgba(156,156,156,0.04)',
            border: '1px solid rgba(156,156,156,0.15)',
            color: 'var(--aiox-cream)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.6rem',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--aiox-lime, #D1FF00)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(156,156,156,0.15)'
          }}
        />
        {inputValue && (
          <button
            onClick={clearSearch}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: '0.5rem', top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.15rem',
              color: 'var(--aiox-gray-muted)',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Loading state */}
      {(isLoading || isFetching) && debouncedQuery.length >= 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
          <CockpitSpinner size="sm" />
          <span style={{
            fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem',
            color: 'var(--aiox-gray-muted)', textTransform: 'uppercase',
          }}>
            Searching...
          </span>
        </div>
      )}

      {/* Results */}
      {!isLoading && debouncedQuery.length >= 2 && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--aiox-gray-muted)',
          }}>
            {results.length} results
          </span>
          {results.slice(0, 10).map((result, i) => (
            <div
              key={i}
              style={{
                padding: '0.5rem 0.625rem',
                background: 'rgba(156,156,156,0.03)',
                border: '1px solid rgba(156,156,156,0.08)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(209,255,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(156,156,156,0.03)'
              }}
            >
              {/* Result header: squad + score */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '0.35rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CockpitBadge variant="surface">{result.squad}</CockpitBadge>
                  <span style={{
                    fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem',
                    color: 'var(--aiox-gray-dim)',
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                  }}>
                    <FileText size={8} />
                    {result.file}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem',
                  color: result.score > 0.5 ? 'var(--aiox-lime)' : 'var(--aiox-gray-muted)',
                }}>
                  {(result.score * 100).toFixed(0)}%
                </span>
              </div>

              {/* Chunk preview */}
              <p style={{
                fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem',
                color: 'var(--aiox-gray-muted)',
                lineHeight: 1.5,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                margin: 0,
              }}>
                {result.chunk}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && !isFetching && debouncedQuery.length >= 2 && results.length === 0 && (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem',
          color: 'var(--aiox-gray-dim)',
        }}>
          No results for &ldquo;{debouncedQuery}&rdquo;
        </div>
      )}

      {/* Hint when empty */}
      {!debouncedQuery && (
        <div style={{
          padding: '0.5rem 0',
          fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem',
          color: 'var(--aiox-gray-dim)',
        }}>
          Search across 9,471 knowledge chunks from 38 squads
        </div>
      )}
    </div>
  )
}
