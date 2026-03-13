import { Activity, Clock, Server, Info } from 'lucide-react';
import { CockpitCard, CockpitTable, CockpitProgress, CockpitBadge, SectionLabel } from '../../ui';
import type { CockpitTableColumn } from '../../ui';
import type { Agent } from '../../../types';
import type { AgentTechSheet } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

export function TabHistory({ agent }: Props) {
  const stats = agent.executionStats;

  const jobCols: CockpitTableColumn<Record<string, unknown>>[] = [
    { key: 'id', header: 'ID', width: '80px', render: (v) => (
      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem' }}>{String(v).slice(0, 8)}</span>
    )},
    { key: 'status', header: 'Status', render: (v) => (
      <CockpitBadge variant={v === 'done' || v === 'completed' ? 'lime' : v === 'failed' ? 'error' : v === 'running' ? 'blue' : 'surface'}>
        {String(v).toUpperCase()}
      </CockpitBadge>
    )},
    { key: 'triggerType', header: 'Trigger' },
    { key: 'createdAt', header: 'Started', render: (v) => <span style={{ fontSize: '0.55rem' }}>{v ? new Date(String(v)).toLocaleString() : '--'}</span> },
    { key: 'errorMessage', header: 'Error', render: (v) => v ? <span style={{ color: 'var(--color-status-error)', fontSize: '0.55rem' }}>{String(v).slice(0, 50)}</span> : '--' },
  ];

  const jobData = (agent.recentJobs || []).map(j => ({
    id: j.id,
    status: j.status,
    triggerType: j.triggerType || '--',
    createdAt: j.createdAt,
    errorMessage: j.errorMessage || '',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Execution Summary */}
      {stats && (stats.totalExecutions || 0) > 0 && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Activity size={12} /> Execution Summary
            </span>
          </SectionLabel>
          <CockpitProgress
            value={stats.successRate || 0}
            label="Success Rate"
            showValue
            variant={(stats.successRate || 0) >= 90 ? 'success' : (stats.successRate || 0) >= 70 ? 'warning' : 'error'}
            animated
            style={{ marginTop: '0.5rem' }}
          />
        </CockpitCard>
      )}

      {/* Pool Status */}
      {agent.currentSlot && (
        <CockpitCard padding="md" accentBorder="left" accentColor="var(--aiox-blue)">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Server size={12} /> Currently Running
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <CockpitBadge variant="blue">Slot #{agent.currentSlot.id}</CockpitBadge>
            <CockpitBadge variant="surface">Job: {agent.currentSlot.jobId.slice(0, 8)}</CockpitBadge>
          </div>
        </CockpitCard>
      )}

      {/* Recent Jobs */}
      <CockpitCard padding="md">
        <SectionLabel count={jobData.length}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={12} /> Recent Jobs
          </span>
        </SectionLabel>
        <CockpitTable columns={jobCols} data={jobData} compact striped emptyMessage="No jobs recorded" />
      </CockpitCard>

      {/* Metadata */}
      {agent.metadata && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Info size={12} /> Metadata
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.7rem' }}>
            {agent.metadata.version && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Version:</span> <span style={{ color: 'var(--aiox-cream)' }}>{agent.metadata.version}</span></div>
            )}
            {agent.metadata.created && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Created:</span> <span style={{ color: 'var(--aiox-cream)' }}>{agent.metadata.created}</span></div>
            )}
            {agent.metadata.updated && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Updated:</span> <span style={{ color: 'var(--aiox-cream)' }}>{agent.metadata.updated}</span></div>
            )}
            {agent.metadata.influenceSource && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Influence:</span> <span style={{ color: 'var(--aiox-cream)' }}>{agent.metadata.influenceSource}</span></div>
            )}
          </div>
        </CockpitCard>
      )}
    </div>
  );
}
