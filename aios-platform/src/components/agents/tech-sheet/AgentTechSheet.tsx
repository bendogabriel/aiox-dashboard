import { useState } from 'react';
import { Eye, Zap, Heart, Shield, Cpu, History } from 'lucide-react';
import { CockpitTabs, CockpitCard } from '../../ui';
import { useAgentTechSheet } from '../../../hooks/useAgentTechSheet';
import { AgentTechSheetHeader } from './AgentTechSheetHeader';
import { TabOverview } from './TabOverview';
import { TabCapabilities } from './TabCapabilities';
import { TabPersonality } from './TabPersonality';
import { TabBoundaries } from './TabBoundaries';
import { TabAutomation } from './TabAutomation';
import { TabHistory } from './TabHistory';

interface Props {
  squadId: string;
  agentId: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: <Eye size={12} /> },
  { id: 'capabilities', label: 'Capabilities', icon: <Zap size={12} /> },
  { id: 'personality', label: 'Personality', icon: <Heart size={12} /> },
  { id: 'boundaries', label: 'Boundaries', icon: <Shield size={12} /> },
  { id: 'automation', label: 'Automation', icon: <Cpu size={12} /> },
  { id: 'history', label: 'History', icon: <History size={12} /> },
];

export function AgentTechSheet({ squadId, agentId }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: agent, isLoading } = useAgentTechSheet(squadId, agentId);

  if (isLoading || !agent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Skeleton header */}
        <CockpitCard padding="lg">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, background: 'rgba(156,156,156,0.1)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '40%', height: 24, background: 'rgba(156,156,156,0.1)', marginBottom: 8 }} />
              <div style={{ width: '60%', height: 14, background: 'rgba(156,156,156,0.08)' }} />
            </div>
          </div>
        </CockpitCard>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {[1,2,3,4].map(i => (
            <CockpitCard key={i} padding="md">
              <div style={{ width: '50%', height: 10, background: 'rgba(156,156,156,0.08)', marginBottom: 8 }} />
              <div style={{ width: '70%', height: 28, background: 'rgba(156,156,156,0.1)' }} />
            </CockpitCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AgentTechSheetHeader agent={agent} />
      <CockpitTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div role="tabpanel">
        {activeTab === 'overview' && <TabOverview agent={agent} />}
        {activeTab === 'capabilities' && <TabCapabilities agent={agent} />}
        {activeTab === 'personality' && <TabPersonality agent={agent} />}
        {activeTab === 'boundaries' && <TabBoundaries agent={agent} />}
        {activeTab === 'automation' && <TabAutomation agent={agent} />}
        {activeTab === 'history' && <TabHistory agent={agent} />}
      </div>
    </div>
  );
}
