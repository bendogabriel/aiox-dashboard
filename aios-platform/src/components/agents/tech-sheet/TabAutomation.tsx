import { Cpu, Bug, Package, Clock } from 'lucide-react';
import { CockpitCard, CockpitTable, CockpitAccordion, CockpitBadge, SectionLabel } from '../../ui';
import type { CockpitTableColumn } from '../../ui';
import type { Agent } from '../../../types';
import type { AgentTechSheet } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

function FlagIndicator({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      background: active ? 'rgba(209,255,0,0.05)' : 'rgba(156,156,156,0.03)',
      border: `1px solid ${active ? 'rgba(209,255,0,0.15)' : 'rgba(156,156,156,0.08)'}`,
    }}>
      <div style={{
        width: 8, height: 8,
        background: active ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)',
        boxShadow: active ? '0 0 6px rgba(209,255,0,0.4)' : 'none',
      }} />
      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: active ? 'var(--aiox-cream)' : 'var(--aiox-gray-dim)' }}>
        {label}
      </span>
    </div>
  );
}

export function TabAutomation({ agent }: Props) {
  const ac = agent.autoClaude;
  const cr = agent.codeRabbit;
  const deps = agent.agentDependencies;

  const cronCols: CockpitTableColumn<Record<string, unknown>>[] = [
    { key: 'schedule', header: 'Schedule', render: (v) => <code style={{ fontFamily: 'var(--font-family-mono)' }}>{String(v)}</code> },
    { key: 'description', header: 'Description' },
    { key: 'enabled', header: 'Enabled', render: (v) => (
      <span style={{ color: v ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)' }}>{v ? 'ON' : 'OFF'}</span>
    )},
    { key: 'lastRunAt', header: 'Last Run' },
    { key: 'nextRunAt', header: 'Next Run' },
  ];

  const cronData = (agent.scheduledCrons || []).map(c => ({
    schedule: c.schedule,
    description: c.description || '--',
    enabled: c.enabled,
    lastRunAt: c.lastRunAt || '--',
    nextRunAt: c.nextRunAt || '--',
  }));

  // Dependencies accordion
  const depItems = deps ? [
    deps.tasks?.length && { id: 'tasks', title: `TASKS (${deps.tasks.length})`, content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{deps.tasks.map(t => <CockpitBadge key={t} variant="surface">{t}</CockpitBadge>)}</div> },
    deps.templates?.length && { id: 'templates', title: `TEMPLATES (${deps.templates.length})`, content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{deps.templates.map(t => <CockpitBadge key={t} variant="surface">{t}</CockpitBadge>)}</div> },
    deps.checklists?.length && { id: 'checklists', title: `CHECKLISTS (${deps.checklists.length})`, content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{deps.checklists.map(t => <CockpitBadge key={t} variant="surface">{t}</CockpitBadge>)}</div> },
    deps.tools?.length && { id: 'tools', title: `TOOLS (${deps.tools.length})`, content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{deps.tools.map(t => <CockpitBadge key={t} variant="lime">{t}</CockpitBadge>)}</div> },
    deps.scripts?.length && { id: 'scripts', title: `SCRIPTS (${deps.scripts.length})`, content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{deps.scripts.map(t => <CockpitBadge key={t} variant="surface">{t}</CockpitBadge>)}</div> },
    deps.data?.length && { id: 'data', title: `DATA (${deps.data.length})`, content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{deps.data.map(t => <CockpitBadge key={t} variant="surface">{t}</CockpitBadge>)}</div> },
  ].filter(Boolean) as Array<{id: string; title: string; content: React.ReactNode}> : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* AutoClaude */}
      {ac && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Cpu size={12} /> AutoClaude {ac.version && <CockpitBadge variant="surface">v{ac.version}</CockpitBadge>}
            </span>
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
            <FlagIndicator label="Create Plan" active={ac.execution?.canCreatePlan} />
            <FlagIndicator label="Create Context" active={ac.execution?.canCreateContext} />
            <FlagIndicator label="Execute" active={ac.execution?.canExecute} />
            <FlagIndicator label="Verify" active={ac.execution?.canVerify} />
          </div>
          {ac.recovery && (
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.375rem' }}>Recovery</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ac.recovery.canTrack && <CockpitBadge variant="lime">Track</CockpitBadge>}
                {ac.recovery.canRollback && <CockpitBadge variant="lime">Rollback</CockpitBadge>}
                {ac.recovery.stuckDetection && <CockpitBadge variant="lime">Stuck Detection</CockpitBadge>}
                {ac.recovery.maxAttempts && <CockpitBadge variant="surface">Max {ac.recovery.maxAttempts} attempts</CockpitBadge>}
              </div>
            </div>
          )}
        </CockpitCard>
      )}

      {/* CodeRabbit */}
      {cr && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Bug size={12} /> CodeRabbit
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <CockpitBadge variant={cr.enabled ? 'lime' : 'error'}>{cr.enabled ? 'ENABLED' : 'DISABLED'}</CockpitBadge>
            {cr.selfHealing?.enabled && <CockpitBadge variant="lime">Self-Healing</CockpitBadge>}
            {cr.selfHealing?.maxIterations && <CockpitBadge variant="surface">Max {cr.selfHealing.maxIterations} iterations</CockpitBadge>}
            {cr.selfHealing?.timeout && <CockpitBadge variant="surface">Timeout: {cr.selfHealing.timeout}min</CockpitBadge>}
          </div>
          {cr.severityHandling && Object.keys(cr.severityHandling).length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.375rem' }}>Severity Handling</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.entries(cr.severityHandling).map(([sev, action]) => (
                  <CockpitBadge key={sev} variant={sev === 'CRITICAL' ? 'error' : 'surface'}>{sev}: {action}</CockpitBadge>
                ))}
              </div>
            </div>
          )}
        </CockpitCard>
      )}

      {/* Dependencies */}
      {depItems.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Package size={12} /> Dependencies
            </span>
          </SectionLabel>
          <CockpitAccordion items={depItems} allowMultiple />
        </CockpitCard>
      )}

      {/* Scheduled Crons */}
      {cronData.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={cronData.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Clock size={12} /> Scheduled Crons
            </span>
          </SectionLabel>
          <CockpitTable columns={cronCols} data={cronData} compact striped />
        </CockpitCard>
      )}

      {/* Empty state */}
      {!ac && !cr && depItems.length === 0 && cronData.length === 0 && (
        <CockpitCard padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--aiox-gray-dim)', fontSize: '0.7rem' }}>No automation data available</p>
        </CockpitCard>
      )}
    </div>
  );
}
