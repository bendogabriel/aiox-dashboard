/**
 * IntegrationDocsPanel — P15 In-app integration documentation
 *
 * Collapsible panel showing setup guides, env vars, and troubleshooting
 * for each integration.
 */

import { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp, ExternalLink,
  Terminal, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { INTEGRATION_DOCS, type IntegrationDoc } from '../../lib/integration-docs';
import type { IntegrationId } from '../../stores/integrationStore';

export function IntegrationDocsPanel() {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);

  const doc = selectedId ? INTEGRATION_DOCS[selectedId] : null;

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'var(--font-family-mono, monospace)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.02)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--aiox-cream, #E5E5E5)',
          fontSize: '12px',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <BookOpen size={14} style={{ color: 'var(--aiox-gray-dim, #696969)' }} />
        <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Setup Guides
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Integration selector */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '12px',
          }}>
            {(Object.keys(INTEGRATION_DOCS) as IntegrationId[]).map((id) => {
              const active = selectedId === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedId(active ? null : id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: active ? 'rgba(0, 153, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(0, 153, 255, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: active ? 'var(--aiox-blue, #0099FF)' : 'var(--aiox-gray-muted, #999)',
                    cursor: 'pointer',
                  }}
                >
                  {INTEGRATION_DOCS[id].name}
                </button>
              );
            })}
          </div>

          {/* Selected doc */}
          {doc && <DocView doc={doc} />}

          {!doc && (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '10px',
              color: 'var(--aiox-gray-dim, #696969)',
            }}>
              Select an integration above to view its setup guide
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Doc View ─────────────────────────────────────────────

function DocView({ doc }: { doc: IntegrationDoc }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Description */}
      <p style={{
        fontSize: '11px',
        color: 'var(--aiox-gray-muted, #999)',
        margin: 0,
        lineHeight: 1.5,
      }}>
        {doc.description}
      </p>

      {/* Setup steps */}
      <div>
        <SectionLabel icon={<CheckCircle2 size={10} />} label="Setup Steps" />
        <ol style={{
          margin: '6px 0 0',
          paddingLeft: '18px',
          fontSize: '10px',
          color: 'var(--aiox-cream, #E5E5E5)',
          lineHeight: 1.7,
        }}>
          {doc.steps.map((step, i) => (
            <li key={i} style={{ marginBottom: '2px' }}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Environment variables */}
      {doc.envVars.length > 0 && (
        <div>
          <SectionLabel icon={<Terminal size={10} />} label="Environment Variables" />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            marginTop: '6px',
          }}>
            {doc.envVars.map((env) => (
              <div
                key={env.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '9px',
                }}
              >
                <code style={{
                  color: 'var(--aiox-lime, #D1FF00)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {env.name}
                </code>
                <span style={{ color: 'var(--aiox-gray-muted)', flex: 1 }}>
                  {env.description}
                </span>
                {env.required && (
                  <span style={{
                    fontSize: '7px',
                    textTransform: 'uppercase',
                    color: 'var(--aiox-warning, #f59e0b)',
                    fontWeight: 600,
                  }}>
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Troubleshooting */}
      {doc.troubleshooting.length > 0 && (
        <div>
          <SectionLabel icon={<AlertTriangle size={10} />} label="Troubleshooting" />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginTop: '6px',
          }}>
            {doc.troubleshooting.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '9px',
                }}
              >
                <div style={{ color: 'var(--aiox-warning, #f59e0b)', fontWeight: 500, marginBottom: '2px' }}>
                  {t.problem}
                </div>
                <div style={{ color: 'var(--aiox-gray-muted, #999)' }}>
                  {t.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External docs link */}
      {doc.docsUrl && (
        <a
          href={doc.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            color: 'var(--aiox-blue, #0099FF)',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={10} />
          Official Documentation
        </a>
      )}
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 600,
      color: 'var(--aiox-gray-dim, #696969)',
    }}>
      {icon}
      {label}
    </div>
  );
}
