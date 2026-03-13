import { useState } from 'react';
import { Layers, LayoutTemplate, GitBranch, type LucideIcon } from 'lucide-react';
import { ModuleHeader } from '../shared';
import { TemplateGallery } from './TemplateGallery';
import { FunnelBuilder } from './FunnelBuilder';

type FunnelTab = 'builder' | 'templates';

interface TabDef {
  id: FunnelTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: 'builder', label: 'Builder', icon: GitBranch },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
];

export default function FunnelDashboard() {
  const [activeTab, setActiveTab] = useState<FunnelTab>('builder');

  return (
    <div>
      <ModuleHeader title="Funnels" subtitle="Landing pages, VSL, quiz funnels" icon={Layers}>
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

      {activeTab === 'builder' && <FunnelBuilder />}
      {activeTab === 'templates' && <TemplateGallery />}
    </div>
  );
}
