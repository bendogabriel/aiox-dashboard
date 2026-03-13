import { useState } from 'react';
import { FileImage, Image, Calendar, PenTool, type LucideIcon } from 'lucide-react';
import { ModuleHeader } from '../shared';
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

      {/* Tab content */}
      {activeTab === 'calendar' && <ContentCalendar />}
      {activeTab === 'thumbnails' && <ThumbnailCreator />}
      {activeTab === 'carousel' && <CarouselBuilder />}
    </div>
  );
}
