import { Mic, Ban, Quote, Smile } from 'lucide-react';
import { CockpitCard, CockpitBadge, CockpitAccordion, SectionLabel } from '../../ui';
import type { Agent } from '../../../types';
import type { AgentTechSheet } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

export function TabPersonality({ agent }: Props) {
  const profile = agent.personaProfile;
  const greetings = profile?.communication?.greetingLevels;

  const greetingItems = greetings ? [
    greetings.minimal && { id: 'minimal', title: 'MINIMAL', content: <p style={{ color: 'var(--aiox-cream)', fontSize: '0.75rem', margin: 0 }}>{greetings.minimal}</p> },
    greetings.named && { id: 'named', title: 'NAMED', content: <p style={{ color: 'var(--aiox-cream)', fontSize: '0.75rem', margin: 0 }}>{greetings.named}</p> },
    greetings.archetypal && { id: 'archetypal', title: 'ARCHETYPAL', content: <p style={{ color: 'var(--aiox-cream)', fontSize: '0.75rem', margin: 0 }}>{greetings.archetypal}</p>, defaultOpen: true },
  ].filter(Boolean) as Array<{id: string; title: string; content: React.ReactNode; defaultOpen?: boolean}> : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Voice DNA */}
      {agent.voiceDna && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Mic size={12} /> Voice DNA
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {agent.voiceDna.sentenceStarters && agent.voiceDna.sentenceStarters.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.5rem' }}>Sentence Starters</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {agent.voiceDna.sentenceStarters.map((s, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', color: 'var(--aiox-cream)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {agent.voiceDna.vocabulary?.alwaysUse && agent.voiceDna.vocabulary.alwaysUse.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.5rem' }}>Always Use</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {agent.voiceDna.vocabulary.alwaysUse.map((w, i) => (
                    <CockpitBadge key={i} variant="lime">{w}</CockpitBadge>
                  ))}
                </div>
              </div>
            )}
            {agent.voiceDna.vocabulary?.neverUse && agent.voiceDna.vocabulary.neverUse.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.5rem' }}>Never Use</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {agent.voiceDna.vocabulary.neverUse.map((w, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', color: 'var(--color-status-error)', background: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.5rem', textDecoration: 'line-through' }}>{w}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CockpitCard>
      )}

      {/* Anti-Patterns */}
      {agent.antiPatterns?.neverDo && agent.antiPatterns.neverDo.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={agent.antiPatterns.neverDo.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Ban size={12} /> Anti-Patterns
            </span>
          </SectionLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {agent.antiPatterns.neverDo.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--aiox-cream)' }}>
                <Ban size={12} style={{ color: 'var(--color-status-error)', marginTop: 2, flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
        </CockpitCard>
      )}

      {/* Greeting Levels */}
      {greetingItems.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Smile size={12} /> Greeting Levels
            </span>
          </SectionLabel>
          <CockpitAccordion items={greetingItems} />
        </CockpitCard>
      )}

      {/* Signature Closing */}
      {profile?.communication?.signatureClosing && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Quote size={12} /> Signature
            </span>
          </SectionLabel>
          <blockquote style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: '0.875rem',
            color: 'var(--aiox-cream)',
            borderLeft: '3px solid var(--aiox-lime)',
            paddingLeft: '0.75rem',
            margin: '0.5rem 0 0',
            fontStyle: 'italic',
          }}>
            {profile.communication.signatureClosing}
          </blockquote>
        </CockpitCard>
      )}

      {/* Empty state */}
      {!agent.voiceDna && !agent.antiPatterns?.neverDo?.length && greetingItems.length === 0 && !profile?.communication?.signatureClosing && (
        <CockpitCard padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--aiox-gray-dim)', fontSize: '0.7rem' }}>No personality data available</p>
        </CockpitCard>
      )}
    </div>
  );
}
