import React, { useState } from 'react';
import {
  type LucideIcon,
  BarChart3,
  Bot,
  PlugZap,
  DollarSign,
  Settings,
} from 'lucide-react';
import { CockpitButton } from '../ui';
import { CockpitSectionDivider } from '../ui/cockpit';
import { ICON_SIZES } from '../../lib/icons';
import { cn } from '../../lib/utils';
import { WidgetCustomizer } from './WidgetCustomizer';
import { RefreshIcon } from './dashboard-icons';
import { OverviewTab } from './OverviewTab';
import { AgentsTab } from './AgentsTab';
import { MCPTab } from './MCPTab';
import { CostsTab } from './CostsTab';
import { SystemTab } from './SystemTab';

type TabType = 'overview' | 'agents' | 'mcp' | 'costs' | 'system';

const TAB_LABELS: Record<TabType, { label: string; num: string }> = {
  overview: { label: 'Visão Geral', num: '01' },
  agents: { label: 'Agents', num: '02' },
  mcp: { label: 'MCP & Tools', num: '03' },
  costs: { label: 'Custos', num: '04' },
  system: { label: 'Sistema', num: '05' },
};

export function DashboardOverview({ viewToggle }: { viewToggle?: React.ReactNode } = {}) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'mcp', label: 'MCP & Tools', icon: PlugZap },
    { id: 'costs', label: 'Custos', icon: DollarSign },
    { id: 'system', label: 'Sistema', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="heading-display text-xl font-semibold text-primary">Dashboard</h1>
            <p className="text-secondary text-sm mt-0.5 label-mono">
              Analytics do AIOS Core Platform
            </p>
          </div>
          {viewToggle}
        </div>
        <div className="flex items-center gap-2">
          <WidgetCustomizer />
          <CockpitButton variant="ghost" size="sm" leftIcon={<RefreshIcon />}>
            Atualizar
          </CockpitButton>
        </div>
      </div>

      {/* Tech Divider */}
      <div className="divider-tech mb-4 flex-shrink-0" aria-hidden="true" />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 glass-subtle rounded-none mb-4 flex-shrink-0 overflow-x-auto" role="tablist" aria-label="Abas do painel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'glass text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            )}
          >
            <tab.icon size={ICON_SIZES.md} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Section Header */}
      <CockpitSectionDivider
        label={TAB_LABELS[activeTab].label}
        num={TAB_LABELS[activeTab].num}
        className="mb-4 flex-shrink-0"
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        {activeTab === 'overview' && <OverviewTab key="overview" />}
        {activeTab === 'agents' && <AgentsTab key="agents" />}
        {activeTab === 'mcp' && <MCPTab key="mcp" />}
        {activeTab === 'costs' && <CostsTab key="costs" />}
        {activeTab === 'system' && <SystemTab key="system" />}
      </div>
    </div>
  );
}
