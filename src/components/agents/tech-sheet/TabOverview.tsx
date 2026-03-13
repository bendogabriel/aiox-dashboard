import { Shield, User, Brain, Sparkles } from 'lucide-react';
import { CockpitCard, CockpitBadge, SectionLabel } from '../../ui';
import type { Agent } from '../../../types';
import type { AgentTechSheet } from '../../../types/agent-tech-sheet';

interface Props {
  agent: Agent & AgentTechSheet;
}

export function TabOverview({ agent }: Props) {
  const profile = agent.personaProfile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Persona */}
      {agent.persona && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={12} /> Persona
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
            {agent.persona.role && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Role:</span>{' '}<span style={{ color: 'var(--aiox-cream)' }}>{agent.persona.role}</span></div>
            )}
            {agent.persona.style && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Style:</span>{' '}<span style={{ color: 'var(--aiox-cream)' }}>{agent.persona.style}</span></div>
            )}
            {agent.persona.identity && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Identity:</span>{' '}<span style={{ color: 'var(--aiox-cream)' }}>{agent.persona.identity}</span></div>
            )}
            {agent.persona.focus && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Focus:</span>{' '}<span style={{ color: 'var(--aiox-cream)' }}>{agent.persona.focus}</span></div>
            )}
            {agent.persona.background && (
              <div><span style={{ color: 'var(--aiox-gray-dim)' }}>Background:</span>{' '}<span style={{ color: 'var(--aiox-cream)' }}>{agent.persona.background}</span></div>
            )}
          </div>
        </CockpitCard>
      )}

      {/* Persona Profile */}
      {profile && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Sparkles size={12} /> Profile
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {profile.archetype && (
                <div>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)' }}>Archetype</span>
                  <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', color: 'var(--aiox-cream)', margin: '0.25rem 0 0' }}>{profile.archetype}</p>
                </div>
              )}
              {profile.zodiac && (
                <div>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)' }}>Zodiac</span>
                  <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', color: 'var(--aiox-cream)', margin: '0.25rem 0 0' }}>{profile.zodiac}</p>
                </div>
              )}
              {profile.communication?.tone && (
                <div>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)' }}>Tone</span>
                  <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', color: 'var(--aiox-cream)', margin: '0.25rem 0 0' }}>{profile.communication.tone}</p>
                </div>
              )}
              {profile.communication?.emojiFrequency && (
                <div>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)' }}>Emoji</span>
                  <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', color: 'var(--aiox-cream)', margin: '0.25rem 0 0' }}>{profile.communication.emojiFrequency}</p>
                </div>
              )}
            </div>
            {profile.communication?.vocabulary && profile.communication.vocabulary.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '0.5rem' }}>Vocabulary</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {profile.communication.vocabulary.map((w, i) => (
                    <CockpitBadge key={i} variant="lime">{w}</CockpitBadge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CockpitCard>
      )}

      {/* Core Principles */}
      {agent.corePrinciples && agent.corePrinciples.length > 0 && (
        <CockpitCard padding="md">
          <SectionLabel count={agent.corePrinciples.length}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Shield size={12} /> Core Principles
            </span>
          </SectionLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {agent.corePrinciples.map((p, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--aiox-cream)' }}>
                <Shield size={12} style={{ color: 'var(--aiox-blue)', marginTop: 2, flexShrink: 0 }} />
                {p}
              </li>
            ))}
          </ul>
        </CockpitCard>
      )}

      {/* Mind Source */}
      {agent.mindSource && (
        <CockpitCard padding="md">
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Brain size={12} /> Mind Source
            </span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {agent.mindSource.name && (
              <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.875rem', color: 'var(--aiox-cream)', margin: 0 }}>{agent.mindSource.name}</p>
            )}
            {agent.mindSource.credentials && agent.mindSource.credentials.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {agent.mindSource.credentials.map((c, i) => (
                  <CockpitBadge key={i} variant="blue">{c}</CockpitBadge>
                ))}
              </div>
            )}
            {agent.mindSource.frameworks && agent.mindSource.frameworks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {agent.mindSource.frameworks.map((f, i) => (
                  <CockpitBadge key={i} variant="surface">{f}</CockpitBadge>
                ))}
              </div>
            )}
          </div>
        </CockpitCard>
      )}
    </div>
  );
}
