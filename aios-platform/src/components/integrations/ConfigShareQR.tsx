import { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Link, Loader2 } from 'lucide-react';
import { buildShareUrl, generateQrSvg } from '../../lib/qr-config-share';

/**
 * Config Share via QR Code — generates a share URL with compressed config
 * and renders it as a scannable QR code + copyable link.
 */
export function ConfigShareQR() {
  const [expanded, setExpanded] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const url = await buildShareUrl();
      setShareUrl(url);
      const svg = generateQrSvg(url, 200);
      setQrSvg(svg);
    } catch {
      setShareUrl(null);
      setQrSvg(null);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (expanded && !shareUrl && !generating) {
      generate();
    }
  }, [expanded]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
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
        <QrCode size={14} style={{ color: 'var(--aiox-blue, #0099FF)' }} />
        <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Share Config (QR)
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {generating ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              color: 'var(--aiox-gray-dim, #696969)',
              fontSize: '11px',
              gap: '8px',
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Generating share link...
            </div>
          ) : shareUrl ? (
            <>
              {/* QR Code */}
              {qrSvg ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px',
                  background: 'white',
                  marginBottom: '10px',
                }}>
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: 'var(--aiox-gray-dim, #696969)',
                  marginBottom: '10px',
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}>
                  Config too large for QR code — use the link below
                </div>
              )}

              {/* Share URL */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <Link size={12} style={{ color: 'var(--aiox-blue, #0099FF)', flexShrink: 0 }} />
                <input
                  readOnly
                  value={shareUrl}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    color: 'var(--aiox-gray-silver, #BDBDBD)',
                    fontSize: '9px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copied ? 'var(--aiox-lime, #D1FF00)' : 'var(--aiox-cream, #E5E5E5)',
                    cursor: 'pointer',
                    padding: '2px',
                    flexShrink: 0,
                  }}
                  title="Copy share link"
                  aria-label="Copy share link"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              {/* Regenerate */}
              <button
                onClick={generate}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '6px 10px',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--aiox-gray-muted, #999)',
                  cursor: 'pointer',
                }}
              >
                Regenerate
              </button>

              {/* Info */}
              <p style={{
                margin: '8px 0 0',
                fontSize: '10px',
                color: 'var(--aiox-gray-dim, #696969)',
              }}>
                Scan from another device to import this configuration.
                {' '}
                Secrets (API keys) are redacted for safety.
              </p>
            </>
          ) : (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '11px',
              color: 'var(--color-status-error, #EF4444)',
            }}>
              Failed to generate share link
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
