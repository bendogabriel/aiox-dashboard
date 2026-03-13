import { useState } from 'react';
import { Palette, Component, Paintbrush, Eye, Copy, Check, type LucideIcon } from 'lucide-react';
import { ModuleHeader } from '../shared';

type DSTab = 'components' | 'tokens' | 'themes';

interface TabDef { id: DSTab; label: string; icon: LucideIcon }

const TABS: TabDef[] = [
  { id: 'components', label: 'Componentes', icon: Component },
  { id: 'tokens', label: 'Tokens', icon: Paintbrush },
  { id: 'themes', label: 'Temas', icon: Palette },
];

// ── Component catalog data ───────────────────────────────────

interface DSComponent {
  name: string;
  className: string;
  category: string;
  description: string;
}

const COMPONENTS: DSComponent[] = [
  // Sales Pages
  { name: 'Price Card', className: '.price-card', category: 'Sales Pages', description: 'Card de preco com destaque e CTA' },
  { name: 'Pain Card', className: '.pain-card', category: 'Sales Pages', description: 'Card de dor/problema do avatar' },
  { name: 'Comparison Table', className: '.comparison', category: 'Sales Pages', description: 'Tabela comparativa antes/depois' },
  { name: 'Expert Bio', className: '.expert-bio', category: 'Sales Pages', description: 'Biografia do especialista com foto' },
  { name: 'Guarantee Badge', className: '.guarantee', category: 'Sales Pages', description: 'Selo de garantia com prazo' },
  { name: 'Countdown Timer', className: '.countdown', category: 'Sales Pages', description: 'Timer de urgencia/escassez' },
  { name: 'Floating CTA', className: '.floating-cta', category: 'Sales Pages', description: 'Botao flutuante fixo no bottom' },
  { name: 'Objection Card', className: '.objection-card', category: 'Sales Pages', description: 'Card de quebrando objecoes' },
  { name: 'Timeline', className: '.timeline', category: 'Sales Pages', description: 'Linha do tempo de beneficios' },
  { name: 'Proof Bar', className: '.proof-bar', category: 'Sales Pages', description: 'Barra de prova social com numeros' },
  // VSL / Conversion
  { name: 'VSL Container', className: '.vsl-container', category: 'VSL / Conversion', description: 'Container de video com autoplay' },
  { name: 'Headline Stack', className: '.headline-stack', category: 'VSL / Conversion', description: 'Pre-headline + headline + sub' },
  { name: 'Timed CTA', className: '.timed-cta', category: 'VSL / Conversion', description: 'CTA que aparece apos X segundos' },
  { name: 'FAQ Section', className: '.faq-section', category: 'VSL / Conversion', description: 'Accordion de perguntas frequentes' },
  { name: 'Bonus Stack', className: '.bonus-stack', category: 'VSL / Conversion', description: 'Lista de bonus com valores' },
  { name: 'Feature Grid', className: '.feature-grid', category: 'VSL / Conversion', description: 'Grid de features/beneficios' },
  { name: 'Order Bump', className: '.order-bump', category: 'VSL / Conversion', description: 'Checkbox de oferta adicional' },
  { name: 'Payment Plan', className: '.payment-plan', category: 'VSL / Conversion', description: 'Opcoes de parcelamento' },
  { name: 'Checkout Trust', className: '.checkout-trust', category: 'VSL / Conversion', description: 'Badges de seguranca no checkout' },
  { name: 'Lead Opt-in', className: '.lead-optin', category: 'VSL / Conversion', description: 'Formulario de captura minimalista' },
  { name: 'ROI Calculator', className: '.roi-calculator', category: 'VSL / Conversion', description: 'Calculadora interativa de ROI' },
  // UI Essentials
  { name: 'Toast', className: '.toast', category: 'UI Essentials', description: 'Notificacao temporaria' },
  { name: 'Tabs', className: '.tabs', category: 'UI Essentials', description: 'Navegacao por abas' },
  { name: 'Tooltip', className: '.tooltip', category: 'UI Essentials', description: 'Tooltip ao hover' },
  { name: 'Avatar Group', className: '.avatar-group', category: 'UI Essentials', description: 'Grupo de avatares empilhados' },
  { name: 'Pricing Toggle', className: '.pricing-toggle', category: 'UI Essentials', description: 'Toggle mensal/anual' },
  { name: 'Sticky Header', className: '.sticky-header', category: 'UI Essentials', description: 'Header fixo no scroll' },
  { name: 'Gallery', className: '.gallery', category: 'UI Essentials', description: 'Galeria de imagens com lightbox' },
  { name: 'Alert', className: '.alert', category: 'UI Essentials', description: 'Alerta informativo' },
  { name: 'Testimonial Carousel', className: '.testimonial-carousel', category: 'UI Essentials', description: 'Carrossel de depoimentos' },
  { name: 'WhatsApp Float', className: '.whatsapp-float', category: 'UI Essentials', description: 'Botao flutuante de WhatsApp' },
  // Thank You
  { name: 'Obrigado Page', className: '.obrigado-page', category: 'Thank You', description: 'Layout completo de obrigado' },
  { name: 'Checkmark Circle', className: '.checkmark-circle', category: 'Thank You', description: 'Animacao de check de sucesso' },
  { name: 'Order Summary', className: '.order-summary', category: 'Thank You', description: 'Resumo do pedido' },
  { name: 'Next Steps', className: '.next-steps', category: 'Thank You', description: 'Proximos passos numerados' },
  // Image System
  { name: 'Responsive Image', className: '.img-responsive', category: 'Image System', description: 'Imagem responsiva com lazy load' },
  { name: 'Image Overlay', className: '.img-overlay', category: 'Image System', description: 'Imagem com overlay de texto' },
  { name: 'Avatar Photo', className: '.avatar-photo', category: 'Image System', description: 'Avatar circular com borda' },
  { name: 'Image Gallery', className: '.img-gallery', category: 'Image System', description: 'Grid de imagens com lightbox' },
];

const CATEGORIES = [...new Set(COMPONENTS.map((c) => c.category))];

// ── Token data ───────────────────────────────────────────────

interface TokenGroup {
  name: string;
  tokens: { name: string; value: string; preview?: string }[];
}

const TOKEN_GROUPS: TokenGroup[] = [
  {
    name: 'Cores — Entrada',
    tokens: [
      { name: '--color-primary', value: '#C17B3A', preview: '#C17B3A' },
      { name: '--color-primary-light', value: '#D4975A', preview: '#D4975A' },
      { name: '--color-accent', value: '#8B6914', preview: '#8B6914' },
      { name: '--color-bg', value: '#FFF9F0', preview: '#FFF9F0' },
      { name: '--color-text', value: '#2C1810', preview: '#2C1810' },
    ],
  },
  {
    name: 'Cores — Agenda Magica',
    tokens: [
      { name: '--color-primary', value: '#E63946', preview: '#E63946' },
      { name: '--color-accent', value: '#FFB703', preview: '#FFB703' },
      { name: '--color-bg', value: '#1D3557', preview: '#1D3557' },
      { name: '--color-text', value: '#F1FAEE', preview: '#F1FAEE' },
    ],
  },
  {
    name: 'Cores — Cura Pelas Maos',
    tokens: [
      { name: '--color-primary', value: '#0077B6', preview: '#0077B6' },
      { name: '--color-accent', value: '#00B4D8', preview: '#00B4D8' },
      { name: '--color-bg', value: '#FFFFFF', preview: '#FFFFFF' },
      { name: '--color-text', value: '#1B1B1B', preview: '#1B1B1B' },
    ],
  },
  {
    name: 'Cores — MAV Premium',
    tokens: [
      { name: '--color-primary', value: '#C9A84C', preview: '#C9A84C' },
      { name: '--color-accent', value: '#8B6914', preview: '#8B6914' },
      { name: '--color-bg', value: '#0A0A0A', preview: '#0A0A0A' },
      { name: '--color-text', value: '#F5F0E8', preview: '#F5F0E8' },
    ],
  },
  {
    name: 'Espacamento',
    tokens: [
      { name: '--space-xs', value: '0.25rem' },
      { name: '--space-sm', value: '0.5rem' },
      { name: '--space-md', value: '1rem' },
      { name: '--space-lg', value: '1.5rem' },
      { name: '--space-xl', value: '2rem' },
      { name: '--space-2xl', value: '3rem' },
      { name: '--space-3xl', value: '4rem' },
    ],
  },
  {
    name: 'Tipografia',
    tokens: [
      { name: '--font-family-heading', value: 'Playfair Display' },
      { name: '--font-family-body', value: 'Inter' },
      { name: '--font-family-accent', value: 'Poppins' },
      { name: '--font-size-xs', value: '0.75rem' },
      { name: '--font-size-sm', value: '0.875rem' },
      { name: '--font-size-base', value: '1rem' },
      { name: '--font-size-lg', value: '1.125rem' },
      { name: '--font-size-xl', value: '1.5rem' },
      { name: '--font-size-2xl', value: '2rem' },
      { name: '--font-size-hero', value: '3rem' },
    ],
  },
];

// ── Theme data ───────────────────────────────────────────────

const THEMES = [
  { id: 'entrada', name: 'Entrada', priceRange: 'R$ 27-97', personality: 'Warm, accessible', bgPreview: '#FFF9F0', primary: '#C17B3A', text: '#2C1810' },
  { id: 'agenda-magica', name: 'Agenda Magica', priceRange: 'R$ 297', personality: 'Energetic, action', bgPreview: '#1D3557', primary: '#E63946', text: '#F1FAEE' },
  { id: 'cura-pelas-maos', name: 'Cura Pelas Maos', priceRange: 'R$ 1.497', personality: 'Clinical, authority', bgPreview: '#FFFFFF', primary: '#0077B6', text: '#1B1B1B' },
  { id: 'mav-premium', name: 'MAV Premium', priceRange: 'Premium', personality: 'Dark luxury', bgPreview: '#0A0A0A', primary: '#C9A84C', text: '#F5F0E8' },
];

// ── Components tab ───────────────────────────────────────────

function ComponentsTab() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedClass, setCopiedClass] = useState<string | null>(null);

  const filtered = selectedCategory
    ? COMPONENTS.filter((c) => c.category === selectedCategory)
    : COMPONENTS;

  const handleCopy = (className: string) => {
    navigator.clipboard.writeText(className);
    setCopiedClass(className);
    setTimeout(() => setCopiedClass(null), 2000);
  };

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider"
          style={{
            background: !selectedCategory ? 'var(--aiox-lime)' : 'var(--aiox-surface)',
            color: !selectedCategory ? '#050505' : 'var(--aiox-gray-muted)',
            border: `1px solid ${!selectedCategory ? 'var(--aiox-lime)' : 'rgba(156,156,156,0.12)'}`,
            fontWeight: !selectedCategory ? 700 : 400,
          }}
        >
          Todos ({COMPONENTS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = COMPONENTS.filter((c) => c.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider"
              style={{
                background: selectedCategory === cat ? 'rgba(209,255,0,0.1)' : 'var(--aiox-surface)',
                color: selectedCategory === cat ? 'var(--aiox-lime)' : 'var(--aiox-gray-muted)',
                border: `1px solid ${selectedCategory === cat ? 'rgba(209,255,0,0.2)' : 'rgba(156,156,156,0.12)'}`,
              }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Component list */}
      <div style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
        {filtered.map((comp, i) => (
          <div
            key={comp.className}
            className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(156,156,156,0.06)' : 'none' }}
          >
            <Component size={14} style={{ color: 'var(--aiox-gray-dim)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--aiox-cream)', display: 'block' }}>
                {comp.name}
              </span>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)' }}>
                {comp.description}
              </span>
            </div>
            <button
              onClick={() => handleCopy(comp.className)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono transition-all hover:bg-white/5 flex-shrink-0"
              style={{ border: '1px solid rgba(156,156,156,0.12)', color: copiedClass === comp.className ? 'var(--aiox-lime)' : 'var(--aiox-gray-muted)' }}
            >
              {copiedClass === comp.className ? <Check size={10} /> : <Copy size={10} />}
              <code style={{ fontSize: '0.6rem' }}>{comp.className}</code>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tokens tab ───────────────────────────────────────────────

function TokensTab() {
  return (
    <div className="grid gap-6">
      {TOKEN_GROUPS.map((group) => (
        <div key={group.name}>
          <h4 style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', marginBottom: '0.5rem' }}>
            {group.name}
          </h4>
          <div style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
            {group.tokens.map((token, i) => (
              <div
                key={token.name}
                className="flex items-center gap-3 px-4 py-2"
                style={{ borderBottom: i < group.tokens.length - 1 ? '1px solid rgba(156,156,156,0.06)' : 'none' }}
              >
                {token.preview && (
                  <span style={{ width: 20, height: 20, background: token.preview, border: '1px solid rgba(156,156,156,0.2)', flexShrink: 0 }} />
                )}
                <code style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--aiox-lime)', flex: 1 }}>
                  {token.name}
                </code>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--aiox-cream)' }}>
                  {token.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Themes tab ───────────────────────────────────────────────

function ThemesTab() {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
      {THEMES.map((theme) => (
        <div
          key={theme.id}
          style={{
            border: '1px solid rgba(156,156,156,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Theme preview */}
          <div
            className="p-6 flex flex-col items-center gap-3"
            style={{ background: theme.bgPreview, minHeight: 160 }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: theme.text }}>
              {theme.name}
            </span>
            <button
              style={{
                background: theme.primary,
                color: theme.bgPreview === '#0A0A0A' || theme.bgPreview === '#1D3557' ? '#fff' : '#fff',
                padding: '0.5rem 1.5rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
              }}
            >
              Quero Agora
            </button>
          </div>
          {/* Theme info */}
          <div className="p-4" style={{ background: 'var(--aiox-surface)' }}>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-lime)', display: 'block', marginBottom: '0.25rem' }}>
              data-theme="{theme.id}"
            </span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)' }}>
              {theme.priceRange} — {theme.personality}
            </span>
            <div className="flex gap-1.5 mt-2">
              {[theme.bgPreview, theme.primary, theme.text].map((c, i) => (
                <span key={i} style={{ width: 20, height: 20, background: c, border: '1px solid rgba(156,156,156,0.2)' }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function DSBrowser() {
  const [activeTab, setActiveTab] = useState<DSTab>('components');

  return (
    <div>
      <ModuleHeader title="Design System" subtitle={`${COMPONENTS.length} componentes · ${TOKEN_GROUPS.reduce((a, g) => a + g.tokens.length, 0)} tokens · ${THEMES.length} temas`} icon={Palette}>
        <div className="flex items-center gap-0" style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(209,255,0,0.06)' : 'transparent',
                  color: isActive ? 'var(--aiox-cream)' : 'var(--aiox-gray-muted)',
                  borderRight: '1px solid rgba(156,156,156,0.08)',
                }}
              >
                <Icon size={12} style={isActive ? { color: 'var(--aiox-lime)' } : undefined} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </ModuleHeader>

      {activeTab === 'components' && <ComponentsTab />}
      {activeTab === 'tokens' && <TokensTab />}
      {activeTab === 'themes' && <ThemesTab />}
    </div>
  );
}
