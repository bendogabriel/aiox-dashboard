import { useState, lazy, Suspense } from 'react';
import { Sparkles, FolderOpen, Wand2, Zap, type LucideIcon } from 'lucide-react';
import { ModuleHeader } from '../shared';

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

function GeneratePanel() {
  return (
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
  );
}

function ComparePanel() {
  return (
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

      {activeTab === 'gallery' && (
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
      )}
      {activeTab === 'generate' && <GeneratePanel />}
      {activeTab === 'compare' && <ComparePanel />}
    </div>
  );
}
