import { Bot } from 'lucide-react';
import { CockpitCard, CockpitKpiCard, CockpitBadge, StatusDot, Avatar } from '../../ui';
import { hasAgentAvatar } from '../../../lib/agent-avatars';
import { getSquadType } from '../../../types';
import type { Agent, AgentTier } from '../../../types';
import type { AgentTechSheet, AgentExecutionStats } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

const tierLabels: Record<number, string> = {
  0: 'ORCHESTRATOR',
  1: 'MASTER',
  2: 'SPECIALIST',
};

const tierColors: Record<number, string> = {
  0: 'var(--aiox-lime)',
  1: 'var(--aiox-blue)',
  2: 'var(--aiox-gray-muted)',
};

function formatDuration(ms?: number): string {
  if (!ms) return '--';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRelative(date?: string): string {
  if (!date) return '--';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return 'agora';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function AgentTechSheetHeader({ agent }: Props) {
  const stats = agent.executionStats;
  const tier = agent.tier as AgentTier;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <CockpitCard padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {hasAgentAvatar(agent.name) || hasAgentAvatar(agent.id) ? (
            <Avatar name={agent.name} agentId={agent.id} size="2xl" squadType={getSquadType(agent.squad)} />
          ) : (
            <div style={{
              width: 72, height: 72,
              background: `${tierColors[tier] || tierColors[2]}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={32} style={{ color: tierColors[tier] || tierColors[2] }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--aiox-cream)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {agent.name}
            </h2>
            <p style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.75rem',
              color: 'var(--aiox-gray-muted)',
              margin: '0.25rem 0 0.5rem',
            }}>
              {agent.title || 'Agent'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <CockpitBadge variant={tier === 0 ? 'lime' : tier === 1 ? 'blue' : 'surface'}>
                {tierLabels[tier] || 'SPECIALIST'}
              </CockpitBadge>
              <CockpitBadge variant="surface">{agent.squad}</CockpitBadge>
              <StatusDot status="success" size="sm" />
              {agent.personaProfile?.archetype && (
                <CockpitBadge variant="surface">{agent.personaProfile.archetype}</CockpitBadge>
              )}
            </div>
            {agent.whenToUse && (
              <p style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.625rem',
                color: 'var(--aiox-gray-dim)',
                marginTop: '0.75rem',
                lineHeight: 1.5,
              }}>
                {agent.whenToUse}
              </p>
            )}
          </div>
        </div>
      </CockpitCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        <CockpitKpiCard
          label="Executions"
          value={stats?.totalExecutions ?? '--'}
          trend="neutral"
        />
        <CockpitKpiCard
          label="Success Rate"
          value={stats?.totalExecutions ? `${stats.successRate!.toFixed(1)}%` : '--'}
          trend={stats?.successRate != null && stats.successRate >= 90 ? 'up' : stats?.successRate != null && stats.successRate < 70 ? 'down' : 'neutral'}
        />
        <CockpitKpiCard
          label="Avg Duration"
          value={formatDuration(stats?.avgDuration)}
          trend="neutral"
        />
        <CockpitKpiCard
          label="Last Active"
          value={formatRelative(stats?.lastActive)}
          trend="neutral"
        />
      </div>
    </div>
  );
}
