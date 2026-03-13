import { Terminal, ListChecks, Workflow, FolderOpen } from 'lucide-react';
import { CockpitCard, CockpitTable, CockpitAccordion, CockpitBadge, SectionLabel } from '../../ui';
import type { CockpitTableColumn } from '../../ui';
import type { Agent } from '../../../types';
import type { AgentTechSheet } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

export function TabCapabilities({ agent }: Props) {
  const commandCols: CockpitTableColumn<Record<string, unknown>>[] = [
    { key: 'command', header: 'Command', render: (v) => (
      <span style={{ color: 'var(--aiox-blue)', fontFamily: 'var(--font-family-mono)' }}>*{String(v).replace(/^\*/, '')}</span>
    )},
    { key: 'description', header: 'Description' },
  ];

  const commandData = (agent.commands || []).map(c => ({
    command: c.command,
    description: c.description || c.action,
  }));

  const taskCols: CockpitTableColumn<Record<string, unknown>>[] = [
    { key: 'name', header: 'Task', render: (v) => (
      <span style={{ color: 'var(--aiox-lime)' }}>{String(v)}</span>
    )},
    { key: 'agent', header: 'Agent' },
    { key: 'purpose', header: 'Purpose' },
  ];

  const taskData = (agent.assignedTasks || []).map(t => ({
    name: t.name,
    agent: t.agent || '--',
    purpose: t.purpose || '--',
  }));

  // Group resources by type
  const resourcesByType: Record<string, typeof agent.assignedResources> = {};
  for (const r of agent.assignedResources || []) {
    if (!resourcesByType[r.type]) resourcesByType[r.type] = [];
    resourcesByType[r.type]!.push(r);
  }

  const resourceAccordionItems = Object.entries(resourcesByType).map(([type, items]) => ({
    id: type,
    title: `${type.toUpperCase()} (${items!.length})`,
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {items!.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0' }}>
            <CockpitBadge variant="surface">{r.type}</CockpitBadge>
            <span style={{ color: 'var(--aiox-cream)', fontSize: '0.65rem' }}>{r.name}</span>
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Commands */}
      {commandData.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={commandData.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Terminal size={12} /> Commands
            </span>
          </SectionLabel>
          <CockpitTable columns={commandCols} data={commandData} compact striped />
        </CockpitCard>
      )}

      {/* Tasks */}
      {taskData.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={taskData.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ListChecks size={12} /> Tasks
            </span>
          </SectionLabel>
          <CockpitTable columns={taskCols} data={taskData} compact striped />
        </CockpitCard>
      )}

      {/* Workflows */}
      {(agent.assignedWorkflows || []).length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={agent.assignedWorkflows!.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Workflow size={12} /> Workflows
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {agent.assignedWorkflows!.map(w => (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(156,156,156,0.08)',
              }}>
                <div>
                  <span style={{ color: 'var(--aiox-cream)', fontSize: '0.7rem', fontWeight: 500 }}>{w.name}</span>
                  {w.description && <p style={{ color: 'var(--aiox-gray-dim)', fontSize: '0.6rem', margin: '0.25rem 0 0' }}>{w.description}</p>}
                </div>
                {w.phases !== undefined && (
                  <CockpitBadge variant="surface">{w.phases} phases</CockpitBadge>
                )}
              </div>
            ))}
          </div>
        </CockpitCard>
      )}

      {/* Resources */}
      {resourceAccordionItems.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={agent.assignedResources?.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <FolderOpen size={12} /> Resources
            </span>
          </SectionLabel>
          <CockpitAccordion items={resourceAccordionItems} allowMultiple />
        </CockpitCard>
      )}

      {/* Empty state */}
      {commandData.length === 0 && taskData.length === 0 && (agent.assignedWorkflows || []).length === 0 && resourceAccordionItems.length === 0 && (
        <CockpitCard padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--aiox-gray-dim)', fontSize: '0.7rem' }}>No capabilities data available</p>
        </CockpitCard>
      )}
    </div>
  );
}
