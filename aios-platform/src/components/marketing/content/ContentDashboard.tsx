import { useState } from 'react';
import { FileImage, Image, Calendar, PenTool, type LucideIcon } from 'lucide-react';
import { ModuleHeader, HeroKpiStrip, SecondaryMetrics, SectionNumber, type HeroKpi } from '../shared';
import { ThumbnailCreator } from './ThumbnailCreator';
import { CarouselBuilder } from './CarouselBuilder';
import { ContentCalendar } from './ContentCalendar';

type ContentTab = 'calendar' | 'thumbnails' | 'carousel';

interface TabDef {
  id: ContentTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'thumbnails', label: 'Thumbnails', icon: Image },
  { id: 'carousel', label: 'Carrossel', icon: PenTool },
];

const HERO_KPIS: HeroKpi[] = [
  { label: 'Posts Agendados', value: '12', trend: 'up' },
  { label: 'Publicados (Mes)', value: '34', trend: 'up' },
  { label: 'Engajamento Medio', value: '4.2%', trend: 'up' },
  { label: 'Alcance Organico', value: '28.4K', trend: 'down' },
  { label: 'Saves', value: '892', trend: 'up' },
  { label: 'Shares', value: '456', trend: 'neutral' },
];

const SECONDARY_METRICS = [
  { label: 'Stories/Semana', value: '18' },
  { label: 'Reels/Semana', value: '4' },
  { label: 'Carrosseis/Mes', value: '8' },
  { label: 'Lives/Mes', value: '4' },
  { label: 'Best Day', value: 'Ter 15h' },
];

export default function ContentDashboard() {
  const [activeTab, setActiveTab] = useState<ContentTab>('calendar');

  return (
    <div>
      <ModuleHeader title="Content" subtitle="Criacao e distribuicao de conteudo" icon={FileImage}>
        {/* Sub-tabs */}
        <div
          className="flex items-center gap-0"
          style={{ border: '1px solid rgba(156,156,156,0.12)' }}
        >
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

      {/* Section header */}
      <SectionNumber
        number={activeTab === 'calendar' ? '01' : activeTab === 'thumbnails' ? '02' : '03'}
        title={TABS.find((t) => t.id === activeTab)?.label ?? ''}
        subtitle={
          activeTab === 'calendar'
            ? 'Planejamento semanal de publicacoes'
            : activeTab === 'thumbnails'
              ? 'Criacao de thumbnails para YouTube'
              : 'Builder de carrosseis para Instagram'
        }
      />

      {/* Tab content */}
      {activeTab === 'calendar' && <ContentCalendar />}
      {activeTab === 'thumbnails' && <ThumbnailCreator />}
      {activeTab === 'carousel' && <CarouselBuilder />}
    </div>
  );
}
