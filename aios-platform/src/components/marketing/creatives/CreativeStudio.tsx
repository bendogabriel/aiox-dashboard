import { useState, lazy, Suspense } from 'react';
import { Sparkles, FolderOpen, Wand2, Zap, type LucideIcon } from 'lucide-react';
import { ModuleHeader, HeroKpiStrip, SecondaryMetrics, SectionNumber, type HeroKpi } from '../shared';

// Reuse existing CreativeGallery component
const CreativeGallery = lazy(() =>
  import('../../creative-gallery/CreativeGallery')
);

type CreativeTab = 'gallery' | 'generate' | 'compare';

interface TabDef {
  id: CreativeTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: 'gallery', label: 'Galeria', icon: FolderOpen },
  { id: 'generate', label: 'Gerar IA', icon: Wand2 },
  { id: 'compare', label: 'A/B Test', icon: Zap },
];

const HERO_KPIS: HeroKpi[] = [
  { label: 'Criativos Ativos', value: '47', trend: 'up' },
  { label: 'CTR Medio', value: '2.8%', trend: 'up' },
  { label: 'Melhor Criativo', value: '4.1% CTR', trend: 'up' },
  { label: 'Gerados (Mes)', value: '23', trend: 'up' },
  { label: 'Testes A/B', value: '6', trend: 'neutral' },
  { label: 'Win Rate', value: '67%', trend: 'up' },
];

const SECONDARY_METRICS = [
  { label: 'Imagens', value: '34' },
  { label: 'Videos', value: '13' },
  { label: 'Carrosseis', value: '8' },
  { label: 'CPA Medio', value: 'R$ 12,40' },
  { label: 'Custo/Criativo', value: 'R$ 0,08' },
];

function GeneratePanel() {
  return (
    <div>
      <SectionNumber number="02" title="Gerador IA" subtitle="Crie variantes de criativos com inteligencia artificial" />
      <div
        className="flex flex-col items-center justify-center gap-4 py-12"
        style={{
          background: 'var(--aiox-surface)',
          border: '1px dashed rgba(156,156,156,0.15)',
        }}
      >
        <Wand2 size={32} style={{ color: 'var(--aiox-gray-dim)' }} />
        <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
          Gerador de Criativos IA
        </p>
        <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', maxWidth: 400 }}>
          Gere variantes de criativos para Meta Ads usando fal-ai + nano-banana.
          Interface completa em desenvolvimento.
        </p>
      </div>
    </div>
  );
}

function ComparePanel() {
  return (
    <div>
      <SectionNumber number="03" title="Teste A/B" subtitle="Compare variantes lado a lado com metricas de performance" />
      <div
        className="flex flex-col items-center justify-center gap-4 py-12"
        style={{
          background: 'var(--aiox-surface)',
          border: '1px dashed rgba(156,156,156,0.15)',
        }}
      >
        <Zap size={32} style={{ color: 'var(--aiox-gray-dim)' }} />
        <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
          Teste A/B Visual
        </p>
        <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', maxWidth: 400 }}>
          Compare variantes de criativos lado a lado com metricas de performance.
          Interface completa em desenvolvimento.
        </p>
      </div>
    </div>
  );
}

export default function CreativeStudio() {
  const [activeTab, setActiveTab] = useState<CreativeTab>('gallery');

  return (
    <div>
      <ModuleHeader title="Criativos" subtitle="Assets e studio criativo" icon={Sparkles}>
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

      {/* Hero KPI strip */}
      <HeroKpiStrip kpis={HERO_KPIS} />

      {/* Secondary metrics */}
      <SecondaryMetrics metrics={SECONDARY_METRICS} />

      {activeTab === 'gallery' && (
        <>
          <SectionNumber number="01" title="Galeria" subtitle={`${47} criativos ativos em campanhas`} />
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-48">
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Carregando galeria...
                </span>
              </div>
            }
          >
            <CreativeGallery />
          </Suspense>
        </>
      )}
      {activeTab === 'generate' && <GeneratePanel />}
      {activeTab === 'compare' && <ComparePanel />}
    </div>
  );
}
