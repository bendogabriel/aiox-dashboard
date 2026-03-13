import { useState, useMemo } from 'react';
import { FileDown, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { generateDashboardEnv, generateEngineEnv, downloadEnvFile, type EnvGenResult } from '../../lib/env-generator';

type Tab = 'dashboard' | 'engine';

/**
 * Env Generator panel — generates and previews .env files
 * from the current integration config.
 */
export function EnvGenerator() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const result: EnvGenResult = useMemo(
    () => (tab === 'dashboard' ? generateDashboardEnv() : generateEngineEnv()),
    [tab],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: select all */ }
  };

  const handleDownload = () => {
    const filename = tab === 'dashboard' ? '.env.development' : 'engine/.env';
    downloadEnvFile(result.content, filename);
  };

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
        <FileDown size={14} style={{ color: 'var(--aiox-gray-dim, #696969)' }} />
        <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Env Generator
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            {(['dashboard', 'engine'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: tab === t ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${tab === t ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                  color: tab === t ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-muted, #999)',
                  cursor: 'pointer',
                }}
              >
                {t === 'dashboard' ? '.env (Dashboard)' : '.env (Engine)'}
              </button>
            ))}
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div style={{
              padding: '8px 10px',
              marginBottom: '8px',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              fontSize: '10px',
              color: 'var(--aiox-warning, #f59e0b)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {result.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={10} />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '10px',
            maxHeight: '200px',
            overflow: 'auto',
            fontSize: '10px',
            lineHeight: '1.6',
            whiteSpace: 'pre',
            color: 'var(--aiox-gray-silver, #BDBDBD)',
          }}>
            {result.content}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '11px',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(209, 255, 0, 0.08)',
                border: '1px solid rgba(209, 255, 0, 0.2)',
                color: 'var(--aiox-lime, #D1FF00)',
                cursor: 'pointer',
              }}
            >
              <FileDown size={12} />
              Download
            </button>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '11px',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: copied ? 'var(--aiox-lime, #D1FF00)' : 'var(--aiox-cream, #E5E5E5)',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Info */}
          <p style={{
            margin: '8px 0 0',
            fontSize: '10px',
            color: 'var(--aiox-gray-dim, #696969)',
          }}>
            {result.vars.filter(v => v.value).length}/{result.vars.length} vars populated
            {' · '}
            Secrets (API keys, tokens) are NOT included — set them manually
          </p>
        </div>
      )}
    </div>
  );
}
