import { useState } from 'react';
import { Plus, ArrowRight, Trash2, Settings, ExternalLink } from 'lucide-react';

interface FunnelStep {
  id: string;
  type: string;
  label: string;
  template: string;
  status: 'draft' | 'built' | 'deployed';
  url?: string;
}

interface Funnel {
  id: string;
  name: string;
  sigla: string;
  theme: string;
  steps: FunnelStep[];
}

const STEP_TYPES = [
  { id: 'landing', label: 'Landing Page', color: '#0099FF' },
  { id: 'vsl', label: 'VSL Page', color: '#ED4609' },
  { id: 'sales-letter', label: 'Sales Letter', color: '#ED4609' },
  { id: 'opt-in', label: 'Opt-in', color: '#0099FF' },
  { id: 'quiz', label: 'Quiz', color: '#8B5CF6' },
  { id: 'checkout', label: 'Checkout', color: '#D1FF00' },
  { id: 'upsell', label: 'Upsell (OTO)', color: '#10B981' },
  { id: 'downsell', label: 'Downsell', color: '#f59e0b' },
  { id: 'thank-you', label: 'Thank You', color: '#10B981' },
];

const DEMO_FUNNELS: Funnel[] = [
  {
    id: 'f1',
    name: 'MPG - Perpetua',
    sigla: 'MPG',
    theme: 'entrada',
    steps: [
      { id: 's1', type: 'landing', label: 'Landing Page', template: 'vsl-page', status: 'draft' },
      { id: 's2', type: 'checkout', label: 'Checkout', template: 'order-page', status: 'draft' },
      { id: 's3', type: 'upsell', label: 'Oferta Especial', template: 'upsell-page', status: 'draft' },
      { id: 's4', type: 'downsell', label: 'Alternativa', template: 'downsell-page', status: 'draft' },
      { id: 's5', type: 'thank-you', label: 'Obrigado', template: 'thank-you-page', status: 'draft' },
    ],
  },
  {
    id: 'f2',
    name: 'MAM - Lancamento',
    sigla: 'MAM',
    theme: 'agenda-magica',
    steps: [
      { id: 's6', type: 'opt-in', label: 'Captacao', template: 'opt-in-page', status: 'draft' },
      { id: 's7', type: 'vsl', label: 'VSL', template: 'vsl-page', status: 'draft' },
      { id: 's8', type: 'checkout', label: 'Checkout', template: 'order-page', status: 'draft' },
      { id: 's9', type: 'thank-you', label: 'Obrigado', template: 'thank-you-page', status: 'draft' },
    ],
  },
];

const STATUS_LABEL = { draft: 'Rascunho', built: 'Construido', deployed: 'Deployado' };
const STATUS_COLOR = { draft: 'var(--aiox-gray-dim)', built: 'var(--aiox-blue)', deployed: 'var(--aiox-lime)' };

export function FunnelBuilder() {
  const [funnels] = useState<Funnel[]>(DEMO_FUNNELS);
  const [activeFunnel, setActiveFunnel] = useState<string>(DEMO_FUNNELS[0].id);

  const current = funnels.find((f) => f.id === activeFunnel);

  return (
    <div>
      {/* Funnel selector */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          {funnels.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFunnel(f.id)}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all"
              style={{
                background: activeFunnel === f.id ? 'rgba(209,255,0,0.08)' : 'var(--aiox-surface)',
                color: activeFunnel === f.id ? 'var(--aiox-lime)' : 'var(--aiox-gray-muted)',
                border: `1px solid ${activeFunnel === f.id ? 'rgba(209,255,0,0.2)' : 'rgba(156,156,156,0.12)'}`,
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:bg-white/5"
          style={{ border: '1px dashed rgba(156,156,156,0.2)', color: 'var(--aiox-gray-dim)' }}
        >
          <Plus size={12} /> Novo Funil
        </button>
      </div>

      {current && (
        <>
          {/* Funnel info */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
                {current.name}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-lime)', background: 'rgba(209,255,0,0.08)', padding: '0.1rem 0.4rem' }}>
                  {current.sigla}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-gray-dim)' }}>
                  theme: {current.theme}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-dim)' }}>
                  {current.steps.length} etapas
                </span>
              </div>
            </div>
          </div>

          {/* Visual funnel flow */}
          <div className="flex items-stretch gap-0 overflow-x-auto pb-4">
            {current.steps.map((step, i) => {
              const stepType = STEP_TYPES.find((t) => t.id === step.type);
              const color = stepType?.color || '#999';
              return (
                <div key={step.id} className="flex items-stretch flex-shrink-0">
                  {/* Step card */}
                  <div
                    className="relative group"
                    style={{
                      width: 200,
                      padding: '1rem',
                      background: 'var(--aiox-surface)',
                      border: '1px solid rgba(156,156,156,0.12)',
                      borderTop: `3px solid ${color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {/* Step number */}
                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          fontFamily: 'var(--font-family-display)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color,
                          background: `${color}15`,
                          padding: '0.1rem 0.4rem',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-white/5" title="Configurar"><Settings size={10} style={{ color: 'var(--aiox-gray-dim)' }} /></button>
                        <button className="p-1 hover:bg-white/5" title="Remover"><Trash2 size={10} style={{ color: 'var(--color-status-error)' }} /></button>
                      </div>
                    </div>

                    {/* Label */}
                    <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--aiox-cream)' }}>
                      {step.label}
                    </span>

                    {/* Type badge */}
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-gray-dim)' }}>
                      {stepType?.label || step.type}
                    </span>

                    {/* Status */}
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: STATUS_COLOR[step.status] }}>
                      {STATUS_LABEL[step.status]}
                    </span>

                    {/* Deploy link */}
                    {step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-auto"
                        style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-blue)' }}
                      >
                        <ExternalLink size={8} /> Preview
                      </a>
                    )}
                  </div>

                  {/* Arrow connector */}
                  {i < current.steps.length - 1 && (
                    <div className="flex items-center px-2 flex-shrink-0">
                      <ArrowRight size={16} style={{ color: 'var(--aiox-gray-dim)' }} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add step */}
            <div className="flex items-center px-2 flex-shrink-0">
              <button
                className="flex items-center justify-center transition-all hover:bg-white/5"
                style={{
                  width: 40,
                  height: 40,
                  border: '1px dashed rgba(156,156,156,0.2)',
                }}
                title="Adicionar etapa"
              >
                <Plus size={16} style={{ color: 'var(--aiox-gray-dim)' }} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
