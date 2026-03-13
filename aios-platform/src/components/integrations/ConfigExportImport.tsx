import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Upload, X, Check, AlertTriangle } from 'lucide-react';
import { downloadConfigExport, parseConfigImport, applyConfigImport, type ConfigExport } from '../../lib/config-export';
import { primaryBtnStyle, secondaryBtnStyle, hintStyle } from './shared-styles';

// ── Import Confirmation Modal ────────────────────────────

function ImportModal({ config, onApply, onClose }: { config: ConfigExport; onApply: () => void; onClose: () => void }) {
  const integrationCount = Object.keys(config.integrations).length;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--aiox-dark, #050505)',
          border: '1px solid rgba(209, 255, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '14px',
            fontFamily: 'var(--font-family-mono, monospace)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            color: 'var(--aiox-cream, #E5E5E5)',
          }}>
            Import Config
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--aiox-gray-dim)', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: 'var(--aiox-warning, #f59e0b)',
            fontSize: '12px',
            fontFamily: 'var(--font-family-mono)',
          }}>
            <AlertTriangle size={16} />
            <span>This will overwrite current integration configs</span>
          </div>

          <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-cream)' }}>
            <div>Exported: <span style={{ color: 'var(--aiox-gray-muted)' }}>{new Date(config.exportedAt).toLocaleString()}</span></div>
            <div>Integrations: <span style={{ color: 'var(--aiox-gray-muted)' }}>{integrationCount}</span></div>
            <div>Theme: <span style={{ color: 'var(--aiox-gray-muted)' }}>{config.settings.theme || 'default'}</span></div>
            <div>Voice: <span style={{ color: 'var(--aiox-gray-muted)' }}>{config.settings.voiceProvider || 'none'}</span></div>
          </div>

          <p style={{ ...hintStyle, margin: 0 }}>
            API keys and tokens are never exported. You will need to re-enter them.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ ...secondaryBtnStyle, flex: 1 }}>
              Cancel
            </button>
            <button onClick={onApply} style={{ ...primaryBtnStyle, flex: 1 }}>
              <Upload size={14} style={{ display: 'inline', marginRight: 6 }} />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main Component ───────────────────────────────────────

export function ConfigExportImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ConfigExport | null>(null);
  const [importResult, setImportResult] = useState<{ applied: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    downloadConfigExport();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseConfigImport(text);

    if ('error' in result) {
      setError(result.error);
      setTimeout(() => setError(null), 3000);
    } else {
      setPendingImport(result);
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApply = () => {
    if (!pendingImport) return;
    const result = applyConfigImport(pendingImport);
    setImportResult(result);
    setPendingImport(null);
    setTimeout(() => setImportResult(null), 4000);
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '11px',
    fontFamily: 'var(--font-family-mono, monospace)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 500,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--aiox-gray-muted, #999)',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={handleExport}
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--aiox-cream, #E5E5E5)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--aiox-gray-muted, #999)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
          title="Export configuration"
        >
          <Download size={13} />
          Export
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--aiox-blue, #0099FF)';
            e.currentTarget.style.borderColor = 'rgba(0, 153, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--aiox-gray-muted, #999)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
          title="Import configuration"
        >
          <Upload size={13} />
          Import
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error toast */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          fontSize: '12px',
          fontFamily: 'var(--font-family-mono)',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--color-status-error)',
          zIndex: 9998,
        }}>
          {error}
        </div>
      )}

      {/* Success toast */}
      {importResult && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          fontSize: '12px',
          fontFamily: 'var(--font-family-mono)',
          background: 'rgba(74, 222, 128, 0.06)',
          border: '1px solid rgba(74, 222, 128, 0.15)',
          color: 'var(--color-status-success, #4ADE80)',
          zIndex: 9998,
        }}>
          <Check size={14} style={{ display: 'inline', marginRight: 6 }} />
          Imported {importResult.applied.length} items
          {importResult.skipped.length > 0 && ` (${importResult.skipped.length} skipped)`}
        </div>
      )}

      {/* Import confirmation modal */}
      {pendingImport && (
          <ImportModal
            config={pendingImport}
            onApply={handleApply}
            onClose={() => setPendingImport(null)}
          />
        )}
</>
  );
}
