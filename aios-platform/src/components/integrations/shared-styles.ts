/**
 * Shared AIOX brutalist styles for integration modals and wizard.
 * Extracted from SetupModals.tsx for reuse across Setup Wizard and Config Export.
 */

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  fontFamily: 'var(--font-family-mono, monospace)',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--aiox-cream, #E5E5E5)',
  outline: 'none',
  borderRadius: 0,
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontFamily: 'var(--font-family-mono, monospace)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--aiox-gray-muted, #999)',
  marginBottom: '6px',
};

export const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--aiox-gray-dim, #696969)',
  marginTop: '6px',
  fontFamily: 'var(--font-family-mono, monospace)',
};

export const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '13px',
  fontFamily: 'var(--font-family-mono, monospace)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
  background: 'var(--aiox-lime, #D1FF00)',
  color: 'var(--aiox-dark, #050505)',
  border: '1px solid var(--aiox-lime, #D1FF00)',
  cursor: 'pointer',
};

export const secondaryBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: 'transparent',
  color: 'var(--aiox-cream, #E5E5E5)',
  border: '1px solid rgba(255,255,255,0.1)',
};

export const statusBoxStyle = (ok: boolean): React.CSSProperties => ({
  padding: '10px 12px',
  fontSize: '12px',
  fontFamily: 'var(--font-family-mono)',
  background: ok ? 'rgba(209,255,0,0.06)' : 'rgba(239,68,68,0.06)',
  border: `1px solid ${ok ? 'rgba(209,255,0,0.2)' : 'rgba(239,68,68,0.2)'}`,
  color: ok ? 'var(--aiox-lime)' : 'var(--color-status-error)',
});
