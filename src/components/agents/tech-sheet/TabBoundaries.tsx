import { Shield, GitBranch, ArrowRightLeft, Lock, Check, X, Target } from 'lucide-react';
import { CockpitCard, CockpitTable, CockpitBadge, SectionLabel } from '../../ui';
import type { CockpitTableColumn } from '../../ui';
import type { Agent } from '../../../types';
import type { AgentTechSheet } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

export function TabBoundaries({ agent }: Props) {
  const boundaries = agent.boundaries;
  const git = agent.gitRestrictions;
  const routing = agent.routingMatrix;

  const delegationCols: CockpitTableColumn<Record<string, unknown>>[] = [
    { key: 'to', header: 'To Agent', render: (v) => <CockpitBadge variant="blue">{String(v)}</CockpitBadge> },
    { key: 'when', header: 'When' },
    { key: 'retain', header: 'Retains' },
  ];

  const delegationData = (boundaries?.delegations || []).map(d => ({
    to: d.to,
    when: d.when || '--',
    retain: d.retain || '--',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Primary Scope */}
      {boundaries?.primaryScope && boundaries.primaryScope.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={boundaries.primaryScope.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Target size={12} /> Responsibility Scope
            </span>
          </SectionLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {boundaries.primaryScope.map((s, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--aiox-cream)' }}>
                <Check size={12} style={{ color: 'var(--aiox-lime)', flexShrink: 0 }} />
                {s}
              </li>
            ))}
          </ul>
        </CockpitCard>
      )}

      {/* Delegations */}
      {delegationData.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={delegationData.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ArrowRightLeft size={12} /> Delegations
            </span>
          </SectionLabel>
          <CockpitTable columns={delegationCols} data={delegationData} compact />
        </CockpitCard>
      )}

      {/* Exclusive Authority */}
      {boundaries?.exclusiveAuthority && boundaries.exclusiveAuthority.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={boundaries.exclusiveAuthority.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Lock size={12} /> Exclusive Authority
            </span>
          </SectionLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {boundaries.exclusiveAuthority.map((a, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--aiox-cream)' }}>
                <Lock size={10} style={{ color: 'var(--aiox-lime)', flexShrink: 0 }} />
                {a}
              </li>
            ))}
          </ul>
        </CockpitCard>
      )}

      {/* Git Restrictions */}
      {git && (git.allowedOperations?.length || git.blockedOperations?.length) && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GitBranch size={12} /> Git Restrictions
            </span>
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {git.allowedOperations && git.allowedOperations.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.5rem' }}>Allowed</span>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {git.allowedOperations.map((op, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.625rem', color: 'var(--aiox-cream)' }}>
                      <Check size={10} style={{ color: 'var(--aiox-lime)', flexShrink: 0 }} />
                      <code style={{ fontFamily: 'var(--font-family-mono)' }}>{op}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {git.blockedOperations && git.blockedOperations.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.5rem' }}>Blocked</span>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {git.blockedOperations.map((op, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.625rem', color: 'var(--aiox-cream)' }}>
                      <X size={10} style={{ color: 'var(--color-status-error)', flexShrink: 0 }} />
                      <code style={{ fontFamily: 'var(--font-family-mono)' }}>{op}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {git.redirectMessage && (
            <p style={{ fontSize: '0.6rem', color: 'var(--aiox-gray-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>{git.redirectMessage}</p>
          )}
        </CockpitCard>
      )}

      {/* Integration */}
      {agent.integration && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ArrowRightLeft size={12} /> Integration
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {agent.integration.receivesFrom && agent.integration.receivesFrom.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.375rem' }}>Receives From</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {agent.integration.receivesFrom.map(a => <CockpitBadge key={a} variant="blue">{a}</CockpitBadge>)}
                </div>
              </div>
            )}
            {agent.integration.handoffTo && agent.integration.handoffTo.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.375rem' }}>Handoff To</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {agent.integration.handoffTo.map(a => <CockpitBadge key={a} variant="surface">{a}</CockpitBadge>)}
                </div>
              </div>
            )}
          </div>
        </CockpitCard>
      )}

      {/* Routing Matrix */}
      {routing && (routing.inScope?.length || routing.outOfScope?.length) && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Shield size={12} /> Routing Matrix
            </span>
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {routing.inScope && routing.inScope.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.375rem' }}>In Scope</span>
                {routing.inScope.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.625rem', color: 'var(--aiox-lime)', marginBottom: '0.25rem' }}>
                    <Check size={10} /> {s}
                  </div>
                ))}
              </div>
            )}
            {routing.outOfScope && routing.outOfScope.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.375rem' }}>Out of Scope</span>
                {routing.outOfScope.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.625rem', color: 'var(--color-status-error)', marginBottom: '0.25rem' }}>
                    <X size={10} /> {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CockpitCard>
      )}

      {/* Empty state */}
      {!boundaries?.primaryScope?.length && !delegationData.length && !boundaries?.exclusiveAuthority?.length && !git?.allowedOperations?.length && !git?.blockedOperations?.length && !agent.integration && !routing?.inScope?.length && !routing?.outOfScope?.length && (
        <CockpitCard padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--aiox-gray-dim)', fontSize: '0.7rem' }}>No boundaries data available</p>
        </CockpitCard>
      )}
    </div>
  );
}
