import { Palette, Component, Paintbrush, Type, Accessibility, Grid3X3 } from 'lucide-react';
import { ModuleHeader } from '../shared';

const DS_SECTIONS = [
  { label: 'Component Browser', description: '93+ componentes categorizados', icon: Component, count: '93+', status: 'Fase 4' },
  { label: 'Token Explorer', description: 'Cores, espacamento, tipografia, sombras', icon: Paintbrush, count: '200+', status: 'Fase 4' },
  { label: 'Theme Builder', description: '4 temas: Entrada, Agenda Magica, Cura Pelas Maos, MAV', icon: Grid3X3, count: '4', status: 'Fase 4' },
  { label: 'Typography Scale', description: 'Inter, Poppins, Playfair Display', icon: Type, count: '3', status: 'Fase 4' },
  { label: 'Accessibility', description: 'WCAG AA compliance, contrast matrix', icon: Accessibility, count: '—', status: 'Fase 4' },
];

const COMPONENT_CATEGORIES = [
  { name: 'Sales Pages', count: 10, examples: 'price-card, pain-card, comparison, expert-bio, guarantee' },
  { name: 'VSL / Conversion', count: 11, examples: 'vsl-container, headline-stack, timed-cta, faq-section' },
  { name: 'Storytelling', count: 8, examples: 'founder-hero, video-testimonials, ba-slider, trust-logos' },
  { name: 'Thank You Pages', count: 6, examples: 'obrigado-page, checkmark-circle, order-summary' },
  { name: 'UI Essentials', count: 17, examples: 'toast, tabs, tooltip, avatar-group, pricing-toggle' },
  { name: 'Image System', count: 8, examples: 'img-responsive, img-overlay, avatar-photo, img-gallery' },
];

export default function DSBrowser() {
  return (
    <div>
      <ModuleHeader title="Design System" subtitle="Componentes, tokens e temas" icon={Palette} />

      {/* Tools grid */}
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {DS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.label}
              className="relative"
              style={{
                padding: '1.25rem',
                background: 'var(--aiox-surface)',
                border: '1px solid rgba(156, 156, 156, 0.12)',
                opacity: 0.6,
              }}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} style={{ color: 'var(--aiox-lime)', flexShrink: 0 }} />
                <div className="min-w-0 flex-1">
                  <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--aiox-cream)', display: 'block' }}>
                    {section.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-muted)', letterSpacing: '0.04em' }}>
                    {section.description}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aiox-lime)', flexShrink: 0 }}>
                  {section.count}
                </span>
              </div>
              <span
                className="absolute top-2 right-2"
                style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', background: 'rgba(156, 156, 156, 0.08)', padding: '0.1rem 0.35rem' }}
              >
                {section.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Component categories preview */}
      <h3 style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--aiox-gray-muted)', marginBottom: '0.75rem' }}>
        Categorias de Componentes
      </h3>

      <div style={{ border: '1px solid rgba(156, 156, 156, 0.12)' }}>
        {COMPONENT_CATEGORIES.map((cat, i) => (
          <div
            key={cat.name}
            className="flex items-center gap-4 px-4 py-3"
            style={{ borderBottom: i < COMPONENT_CATEGORIES.length - 1 ? '1px solid rgba(156, 156, 156, 0.06)' : 'none' }}
          >
            <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--aiox-lime)', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {cat.count}
            </span>
            <div className="min-w-0 flex-1">
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--aiox-cream)', display: 'block' }}>
                {cat.name}
              </span>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-dim)', letterSpacing: '0.02em' }}>
                {cat.examples}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
