import {
  Bot,
  Terminal,
  Shield,
  MessageSquare,
  ArrowRightLeft,
  X,
  Check,
  Mic,
  Ban,
} from 'lucide-react';
import { CockpitCard, Badge, StatusDot, SectionLabel, Avatar } from '../ui';
import { cn, formatRelativeTime } from '../../lib/utils';
import { hasAgentAvatar } from '../../lib/agent-avatars';
import { getSquadType } from '../../types';
import type { Agent, AgentTier } from '../../types';

interface AgentDetailPanelProps {
  agent: Agent;
}

const tierConfig: Record<AgentTier, { label: string; color: string; bg: string }> = {
  0: { label: 'Orchestrator', color: 'text-[var(--aiox-gray-muted)]', bg: 'bg-[var(--aiox-gray-muted)]/15' },
  1: { label: 'Master', color: 'text-[var(--aiox-blue)]', bg: 'bg-[var(--aiox-blue)]/15' },
  2: { label: 'Specialist', color: 'text-[var(--color-status-success)]', bg: 'bg-[var(--color-status-success)]/15' },
};

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
    >
      {children}
    </div>
  );
}

export function AgentDetailPanel({ agent }: AgentDetailPanelProps) {
  const tier = tierConfig[agent.tier as AgentTier] || tierConfig[2];
  const statusMap: Record<string, 'success' | 'waiting' | 'offline'> = {
    online: 'success',
    busy: 'waiting',
    offline: 'offline',
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Section delay={0}>
        <CockpitCard padding="lg">
          <div className="flex items-center gap-4">
            {hasAgentAvatar(agent.name) || hasAgentAvatar(agent.id) ? (
              <Avatar
                name={agent.name}
                agentId={agent.id}
                size="2xl"
                squadType={getSquadType(agent.squad)}
              />
            ) : (
              <div className={cn('w-14 h-14 rounded-none flex items-center justify-center', tier.bg)}>
                <Bot size={28} className={tier.color} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-primary">{agent.name}</h2>
              <p className="text-sm text-secondary">{agent.title || 'Agent'}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="default" size="sm" className={tier.bg}>
                  <span className={tier.color}>{tier.label}</span>
                </Badge>
                {agent.model && <Badge variant="default" size="sm">{agent.model}</Badge>}
                <StatusDot
                  status={statusMap[agent.status || 'offline'] || 'offline'}
                  size="sm"
                  label={agent.status || 'offline'}
                />
              </div>
            </div>
          </div>
          {agent.description && (
            <p className="text-sm text-secondary mt-4">{agent.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-tertiary">
            {agent.lastActive && (
              <span>Ativo: {formatRelativeTime(agent.lastActive)}</span>
            )}
            {agent.executionCount !== undefined && (
              <span>{agent.executionCount} execucoes</span>
            )}
          </div>
        </CockpitCard>
      </Section>

      {/* Persona */}
      {agent.persona && (
        <Section delay={0.05}>
          <CockpitCard padding="md">
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <MessageSquare size={12} />
                Persona
              </span>
            </SectionLabel>
            <div className="space-y-2 text-sm">
              {agent.persona.role && (
                <div>
                  <span className="text-tertiary">Role:</span>{' '}
                  <span className="text-primary">{agent.persona.role}</span>
                </div>
              )}
              {agent.persona.style && (
                <div>
                  <span className="text-tertiary">Style:</span>{' '}
                  <span className="text-primary">{agent.persona.style}</span>
                </div>
              )}
              {agent.persona.identity && (
                <div>
                  <span className="text-tertiary">Identity:</span>{' '}
                  <span className="text-primary">{agent.persona.identity}</span>
                </div>
              )}
            </div>
          </CockpitCard>
        </Section>
      )}

      {/* Core Principles */}
      {agent.corePrinciples && agent.corePrinciples.length > 0 && (
        <Section delay={0.1}>
          <CockpitCard padding="md">
            <SectionLabel count={agent.corePrinciples.length}>
              <span className="flex items-center gap-1.5">
                <Shield size={12} />
                Core Principles
              </span>
            </SectionLabel>
            <ul className="space-y-2">
              {agent.corePrinciples.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-primary">
                  <span className="text-[var(--aiox-blue)] mt-0.5 flex-shrink-0">&#8226;</span>
                  {p}
                </li>
              ))}
            </ul>
          </CockpitCard>
        </Section>
      )}

      {/* Commands */}
      {agent.commands && agent.commands.length > 0 && (
        <Section delay={0.15}>
          <CockpitCard padding="md">
            <SectionLabel count={agent.commands.length}>
              <span className="flex items-center gap-1.5">
                <Terminal size={12} />
                Commands
              </span>
            </SectionLabel>
            <div className="space-y-2">
              {agent.commands.map((cmd) => (
                <div key={cmd.command} className="flex items-start gap-3 glass-subtle rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-[var(--aiox-blue)] bg-[var(--aiox-blue)]/10 rounded px-1.5 py-0.5 flex-shrink-0">
                    {cmd.command}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary">{cmd.action}</p>
                    {cmd.description && (
                      <p className="text-[10px] text-tertiary mt-0.5">{cmd.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CockpitCard>
        </Section>
      )}

      {/* Voice DNA */}
      {agent.voiceDna && (
        <Section delay={0.2}>
          <CockpitCard padding="md">
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <Mic size={12} />
                Voice DNA
              </span>
            </SectionLabel>
            <div className="space-y-3">
              {agent.voiceDna.sentenceStarters && agent.voiceDna.sentenceStarters.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5">Sentence Starters</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.voiceDna.sentenceStarters.map((s, i) => (
                      <span key={i} className="text-xs text-primary bg-white/5 rounded-md px-2 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {agent.voiceDna.vocabulary?.alwaysUse && agent.voiceDna.vocabulary.alwaysUse.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5">Always Use</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.voiceDna.vocabulary.alwaysUse.map((w, i) => (
                      <span key={i} className="text-xs text-[var(--color-status-success)] bg-[var(--color-status-success)]/10 rounded-md px-2 py-1">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {agent.voiceDna.vocabulary?.neverUse && agent.voiceDna.vocabulary.neverUse.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5">Never Use</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.voiceDna.vocabulary.neverUse.map((w, i) => (
                      <span key={i} className="text-xs text-[var(--bb-error)] bg-[var(--bb-error)]/10 rounded-md px-2 py-1 line-through">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CockpitCard>
        </Section>
      )}

      {/* Anti-Patterns */}
      {agent.antiPatterns?.neverDo && agent.antiPatterns.neverDo.length > 0 && (
        <Section delay={0.25}>
          <CockpitCard padding="md">
            <SectionLabel count={agent.antiPatterns.neverDo.length}>
              <span className="flex items-center gap-1.5">
                <Ban size={12} />
                Anti-Patterns
              </span>
            </SectionLabel>
            <ul className="space-y-2">
              {agent.antiPatterns.neverDo.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-primary">
                  <X size={14} className="text-[var(--bb-error)] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CockpitCard>
        </Section>
      )}

      {/* Integration */}
      {agent.integration && (
        <Section delay={0.3}>
          <CockpitCard padding="md">
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft size={12} />
                Integration
              </span>
            </SectionLabel>
            <div className="space-y-3">
              {agent.integration.receivesFrom && agent.integration.receivesFrom.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5">Receives From</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.integration.receivesFrom.map((a) => (
                      <Badge key={a} variant="default" size="sm" className="bg-[var(--aiox-blue)]/10">
                        <span className="text-[var(--aiox-blue)]">{a}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {agent.integration.handoffTo && agent.integration.handoffTo.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5">Handoff To</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.integration.handoffTo.map((a) => (
                      <Badge key={a} variant="default" size="sm" className="bg-[var(--bb-flare)]/10">
                        <span className="text-[var(--bb-flare)]">{a}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CockpitCard>
        </Section>
      )}

      {/* Quality */}
      {agent.quality && (
        <Section delay={0.35}>
          <CockpitCard padding="md">
            <SectionLabel>Quality Indicators</SectionLabel>
            <div className="flex items-center gap-4">
              <QualityItem label="Voice DNA" active={agent.quality.hasVoiceDna} />
              <QualityItem label="Anti-Patterns" active={agent.quality.hasAntiPatterns} />
              <QualityItem label="Integration" active={agent.quality.hasIntegration} />
            </div>
          </CockpitCard>
        </Section>
      )}
    </div>
  );
}

function QualityItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {active ? (
        <Check size={14} className="text-[var(--color-status-success)]" />
      ) : (
        <X size={14} className="text-[var(--bb-error)]" />
      )}
      <span className={cn('text-xs', active ? 'text-primary' : 'text-tertiary')}>{label}</span>
    </div>
  );
}
