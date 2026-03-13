import { useMemo } from 'react';
import { CockpitCard, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { getIconComponent } from '../../lib/icons';
import type { AgentSummary, AgentTier } from '../../types';

interface SquadOrgChartProps {
  agents: AgentSummary[];
}

const tierConfig: Record<AgentTier, { label: string; color: string; bg: string; borderColor: string }> = {
  0: { label: 'Orchestrator', color: 'text-[var(--aiox-gray-muted)]', bg: 'bg-[var(--aiox-gray-muted)]/15', borderColor: 'border-[var(--aiox-gray-muted)]/30' },
  1: { label: 'Master', color: 'text-[var(--aiox-blue)]', bg: 'bg-[var(--aiox-blue)]/15', borderColor: 'border-[var(--aiox-blue)]/30' },
  2: { label: 'Specialist', color: 'text-[var(--color-status-success)]', bg: 'bg-[var(--color-status-success)]/15', borderColor: 'border-[var(--color-status-success)]/30' },
};

function AgentNode({ agent, index }: { agent: AgentSummary; index: number }) {
  const tier = tierConfig[agent.tier];
  /* eslint-disable react-hooks/static-components -- Lucide icons are stateless; dynamic lookup is safe */
  const iconElement = useMemo(() => {
    const IconComp = getIconComponent(agent.icon || agent.name.charAt(0));
    return <IconComp size={14} />;
  }, [agent.icon, agent.name]);
  /* eslint-enable react-hooks/static-components */

  return (
    <div
    >
      <CockpitCard padding="sm" className="w-36 text-center">
        <div className={cn('w-8 h-8 rounded-lg mx-auto flex items-center justify-center', tier.bg)}>
          {iconElement}
        </div>
        <p className="text-xs font-medium text-primary mt-1.5 truncate">{agent.name}</p>
        <Badge variant="default" size="sm" className={cn('mt-1', tier.bg)}>
          <span className={tier.color}>{tier.label}</span>
        </Badge>
      </CockpitCard>
    </div>
  );
}

export function SquadOrgChart({ agents }: SquadOrgChartProps) {
  const tiers: AgentTier[] = [0, 1, 2];
  const grouped = tiers.map((t) => ({
    tier: t,
    config: tierConfig[t],
    agents: agents.filter((a) => a.tier === t),
  })).filter((g) => g.agents.length > 0);

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-secondary text-sm">Nenhum agente neste squad</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group, gi) => (
        <div key={group.tier} className="relative">
          {/* Tier label */}
          <div className="flex items-center gap-3 mb-4">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', group.config.color)}>
              Tier {group.tier} - {group.config.label}
            </span>
            <div className={cn('flex-1 h-px', group.config.bg)} />
          </div>

          {/* Agent nodes */}
          <div className="flex flex-wrap justify-center gap-4">
            {group.agents.map((agent, ai) => (
              <AgentNode key={agent.id} agent={agent} index={gi * 3 + ai} />
            ))}
          </div>

          {/* Connecting line to next tier */}
          {gi < grouped.length - 1 && (
            <div className="flex justify-center my-4">
              <div className="w-px h-8 bg-white/10" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
