import { X } from 'lucide-react';
import { useMarketingStore } from '../../../stores/marketingStore';

export function FilterBar() {
  const activeFilter = useMarketingStore((s) => s.activeFilter);
  const setActiveFilter = useMarketingStore((s) => s.setActiveFilter);

  if (!activeFilter) return null;

  return (
    <div
      className="flex items-center gap-2 mb-4"
      style={{
        padding: '0.5rem 0.75rem',
        background: 'rgba(209, 255, 0, 0.06)',
        border: '1px solid rgba(209, 255, 0, 0.15)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--aiox-gray-muted)',
        }}
      >
        Filtro ativo:
      </span>
      <span
        className="flex items-center gap-1.5"
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.6rem',
          padding: '0.2rem 0.5rem',
          background: 'rgba(209, 255, 0, 0.12)',
          color: 'var(--aiox-lime)',
        }}
      >
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {activeFilter.dimension}:
        </span>
        <span style={{ fontWeight: 600 }}>{activeFilter.value}</span>
        <button
          onClick={() => setActiveFilter(null)}
          className="ml-1 hover:opacity-80 transition-opacity"
          aria-label="Remover filtro"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <X size={10} />
        </button>
      </span>
    </div>
  );
}
