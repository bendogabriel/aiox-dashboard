import { Store, Search, Upload } from 'lucide-react';

interface EmptyMarketplaceProps {
  variant?: 'browse' | 'purchases' | 'listings' | 'search';
  onAction?: () => void;
}

const configs = {
  browse: {
    icon: Store,
    title: 'Marketplace vazio',
    description: 'Ainda nao ha agentes publicados no marketplace.',
    action: 'Seja o primeiro a publicar',
  },
  purchases: {
    icon: Store,
    title: 'Nenhuma compra ainda',
    description: 'Voce ainda nao contratou nenhum agente. Explore o marketplace!',
    action: 'Explorar Marketplace',
  },
  listings: {
    icon: Upload,
    title: 'Nenhum listing',
    description: 'Voce ainda nao submeteu nenhum agente para venda.',
    action: 'Criar Primeiro Agente',
  },
  search: {
    icon: Search,
    title: 'Nenhum resultado',
    description: 'Nenhum agente encontrado com esses filtros. Tente ajustar sua busca.',
    action: 'Limpar Filtros',
  },
};

export function EmptyMarketplace({ variant = 'browse', onAction }: EmptyMarketplaceProps) {
  const { icon: Icon, title, description, action } = configs[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="
        w-16 h-16 flex items-center justify-center mb-4
        bg-[var(--color-bg-elevated,#1a1a1a)]
        border border-[var(--color-border-default,#333)]
        text-[var(--color-text-muted,#666)]
      ">
        <Icon size={28} />
      </div>
      <h3 className="font-mono text-sm font-semibold text-[var(--color-text-primary,#fff)] uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-text-muted,#666)] mt-2 max-w-xs">
        {description}
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="
            mt-4 px-4 py-2 font-mono text-xs uppercase tracking-wider
            bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
            hover:bg-[var(--aiox-lime,#D1FF00)]/90
            transition-colors font-semibold
          "
        >
          {action}
        </button>
      )}
    </div>
  );
}
