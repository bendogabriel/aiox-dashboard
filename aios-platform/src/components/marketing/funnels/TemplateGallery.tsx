import { useState } from 'react';
import { FileCode, Eye, Copy, Search } from 'lucide-react';

interface FunnelTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  sections: string[];
  color: string;
}

const TEMPLATES: FunnelTemplate[] = [
  { id: 'vsl-page', name: 'VSL Page', category: 'Vendas', description: 'Video Sales Letter com CTA temporizado', sections: ['Pre-headline', 'Headline', 'Video', 'CTA', 'Trust'], color: '#ED4609' },
  { id: 'sales-letter', name: 'Sales Letter', category: 'Vendas', description: 'Carta de vendas long-form com storytelling', sections: ['Hook', 'Story', 'Offer', 'Proof', 'CTA', 'FAQ', 'Guarantee'], color: '#ED4609' },
  { id: 'opt-in-page', name: 'Opt-in Page', category: 'Captacao', description: 'Pagina de captura de leads com isca digital', sections: ['Headline', 'Benefits', 'Form', 'Social Proof'], color: '#0099FF' },
  { id: 'quiz-landing', name: 'Quiz Landing', category: 'Quiz', description: 'Entrada do quiz funnel com micro-commitment', sections: ['Headline', 'Quiz Preview', 'CTA', 'Trust'], color: '#8B5CF6' },
  { id: 'quiz-questions', name: 'Quiz Questions', category: 'Quiz', description: 'Perguntas do quiz com scoring engine', sections: ['Progress Bar', 'Question', 'Options', 'Navigation'], color: '#8B5CF6' },
  { id: 'quiz-results', name: 'Quiz Results', category: 'Quiz', description: 'Resultados segmentados por bucket', sections: ['Profile', 'Recommendation', 'CTA', 'Social Proof'], color: '#8B5CF6' },
  { id: 'quiz-offer', name: 'Quiz Offer', category: 'Quiz', description: 'Oferta personalizada pos-quiz', sections: ['Result Summary', 'Offer Stack', 'Price', 'CTA', 'Guarantee'], color: '#8B5CF6' },
  { id: 'webinar-registration', name: 'Webinar Registration', category: 'Evento', description: 'Cadastro para webinar/live com countdown', sections: ['Headline', 'Benefits', 'Speaker Bio', 'Form', 'Countdown'], color: '#f59e0b' },
  { id: 'replay-page', name: 'Replay Page', category: 'Evento', description: 'Replay do webinar com oferta limitada', sections: ['Video', 'Highlights', 'Offer', 'Scarcity', 'CTA'], color: '#f59e0b' },
  { id: 'order-page', name: 'Order Page', category: 'Checkout', description: 'Pagina de pedido com order bump', sections: ['Summary', 'Order Bump', 'Form', 'Trust Badges'], color: '#D1FF00' },
  { id: 'upsell-page', name: 'Upsell (OTO)', category: 'Pos-Compra', description: 'Oferta one-time apos compra', sections: ['Headline', 'Video', 'Benefits', 'Price Anchor', 'CTA'], color: '#10B981' },
  { id: 'downsell-page', name: 'Downsell', category: 'Pos-Compra', description: 'Oferta alternativa menor apos recusa do upsell', sections: ['Headline', 'Reduced Offer', 'Comparison', 'CTA'], color: '#10B981' },
  { id: 'thank-you-page', name: 'Thank You Page', category: 'Pos-Compra', description: 'Pagina de obrigado com proximos passos', sections: ['Confirmation', 'Next Steps', 'CTA Download', 'Upsell Light'], color: '#10B981' },
  { id: 'tripwire-page', name: 'Tripwire', category: 'Vendas', description: 'Oferta irresistivel de entrada (R$ 7-27)', sections: ['Headline', 'Value Stack', 'Price Anchor', 'Scarcity', 'CTA'], color: '#ED4609' },
  { id: 'advertorial', name: 'Advertorial', category: 'Bridge', description: 'Artigo editorial que direciona para oferta', sections: ['Article Header', 'Story', 'Discovery', 'Transition', 'CTA'], color: '#999' },
  { id: 'application-page', name: 'Application Page', category: 'High Ticket', description: 'Formulario de aplicacao para produtos premium', sections: ['Headline', 'Criteria', 'Form', 'What Happens Next'], color: '#D1FF00' },
  { id: 'confirmation-page', name: 'Confirmation', category: 'Pos-Compra', description: 'Confirmacao de compra com detalhes do pedido', sections: ['Checkmark', 'Order Summary', 'Access Info', 'Support'], color: '#10B981' },
  { id: 'plc-video', name: 'PLC Video Page', category: 'Lancamento', description: 'Pagina de video para Product Launch', sections: ['Video', 'Key Takeaways', 'Comments', 'Next Video CTA'], color: '#f59e0b' },
  { id: 'email-sequence', name: 'Email Sequence', category: 'Automacao', description: 'Template de sequencia de emails', sections: ['Subject Lines', 'Body Templates', 'CTA Patterns', 'Timing'], color: '#999' },
];

const CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export function TemplateGallery({ onSelect }: { onSelect?: (templateId: string) => void }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--aiox-gray-dim)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar template..."
            style={{
              width: '100%',
              background: 'var(--aiox-surface)',
              border: '1px solid rgba(156,156,156,0.15)',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.75rem',
              color: 'var(--aiox-cream)',
              outline: 'none',
            }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter(null)}
            className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all"
            style={{
              background: !categoryFilter ? 'var(--aiox-lime)' : 'var(--aiox-surface)',
              color: !categoryFilter ? '#050505' : 'var(--aiox-gray-muted)',
              border: `1px solid ${!categoryFilter ? 'var(--aiox-lime)' : 'rgba(156,156,156,0.12)'}`,
              fontWeight: !categoryFilter ? 700 : 400,
            }}
          >
            Todos ({TEMPLATES.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = TEMPLATES.filter((t) => t.category === cat).length;
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(isActive ? null : cat)}
                className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(209,255,0,0.1)' : 'var(--aiox-surface)',
                  color: isActive ? 'var(--aiox-lime)' : 'var(--aiox-gray-muted)',
                  border: `1px solid ${isActive ? 'rgba(209,255,0,0.2)' : 'rgba(156,156,156,0.12)'}`,
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Template grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {filtered.map((template) => (
          <div
            key={template.id}
            className="group relative transition-all hover:bg-white/[0.02]"
            style={{
              padding: '1.25rem',
              background: 'var(--aiox-surface)',
              border: '1px solid rgba(156,156,156,0.12)',
              borderLeft: `3px solid ${template.color}`,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--aiox-cream)', display: 'block' }}>
                  {template.name}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: template.color }}>
                  {template.category}
                </span>
              </div>
              <FileCode size={16} style={{ color: 'var(--aiox-gray-dim)', flexShrink: 0 }} />
            </div>

            <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-gray-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
              {template.description}
            </p>

            {/* Sections preview */}
            <div className="flex flex-wrap gap-1 mb-3">
              {template.sections.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.45rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--aiox-gray-dim)',
                    background: 'rgba(156,156,156,0.06)',
                    padding: '0.1rem 0.4rem',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onSelect?.(template.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(156,156,156,0.15)', color: 'var(--aiox-cream)' }}
              >
                <Eye size={10} /> Preview
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(209,255,0,0.2)', color: 'var(--aiox-lime)' }}
              >
                <Copy size={10} /> Usar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
