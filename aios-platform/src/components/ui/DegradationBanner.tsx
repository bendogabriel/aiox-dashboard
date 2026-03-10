import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Check, X, Minus, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { useViewCapabilities } from '../../hooks/useCapabilities';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import type { CapabilityLevel, CapabilityInfo } from '../../lib/degradation-map';
import type { IntegrationId } from '../../stores/integrationStore';

const levelConfig: Record<CapabilityLevel, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  full: {
    icon: <Check size={10} />,
    color: 'var(--aiox-lime, #D1FF00)',
    bg: 'rgba(209, 255, 0, 0.06)',
    border: 'rgba(209, 255, 0, 0.15)',
  },
  degraded: {
    icon: <Minus size={10} />,
    color: 'var(--aiox-warning, #f59e0b)',
    bg: 'rgba(245, 158, 11, 0.06)',
    border: 'rgba(245, 158, 11, 0.15)',
  },
  unavailable: {
    icon: <X size={10} />,
    color: 'var(--color-status-error, #EF4444)',
    bg: 'rgba(239, 68, 68, 0.06)',
    border: 'rgba(239, 68, 68, 0.15)',
  },
};

/** Extract the primary missing integration from a capability for the "fix" action */
function getPrimaryDependency(cap: CapabilityInfo): IntegrationId | null {
  if (!cap.reason) return null;
  // reason format: "Requires: engine, whatsapp" or "Limited without: voice"
  const match = cap.reason.match(/(?:Requires|Limited without): (.+)/);
  if (!match) return null;
  const first = match[1].split(',')[0].trim();
  const validIds: IntegrationId[] = ['engine', 'supabase', 'api-keys', 'whatsapp', 'telegram', 'voice', 'google-drive', 'google-calendar'];
  return validIds.includes(first as IntegrationId) ? (first as IntegrationId) : null;
}

/** Extract all unique missing integrations from degraded/unavailable capabilities */
function getMissingIntegrations(caps: CapabilityInfo[]): IntegrationId[] {
  const ids = new Set<IntegrationId>();
  for (const cap of caps) {
    const dep = getPrimaryDependency(cap);
    if (dep) ids.add(dep);
  }
  return [...ids];
}

/**
 * Collapsible degradation banner shown when capabilities are limited
 * for the current view. Hides when everything is fully operational.
 * Includes per-capability "Fix" action and a "Recheck" button.
 */
export function DegradationBanner() {
  const { capabilities, hasUnavailable, hasDegraded, allGood, summary } = useViewCapabilities();
  const { openSetup } = useIntegrationStore();
  const { checkMany, checking } = useHealthCheck();
  const [expanded, setExpanded] = useState(false);

  // Don't render when everything is fine
  if (allGood || capabilities.length === 0) return null;

  const degradedOrUnavailable = capabilities.filter((c) => c.level !== 'full');
  const bannerColor = hasUnavailable
    ? 'rgba(239, 68, 68, 0.08)'
    : 'rgba(245, 158, 11, 0.08)';
  const bannerBorder = hasUnavailable
    ? 'rgba(239, 68, 68, 0.2)'
    : 'rgba(245, 158, 11, 0.2)';
  const textColor = hasUnavailable
    ? 'var(--color-status-error, #EF4444)'
    : 'var(--aiox-warning, #f59e0b)';

  const handleRecheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checking) return;
    const missing = getMissingIntegrations(degradedOrUnavailable);
    if (missing.length > 0) {
      checkMany(missing);
    }
  };

  return (
    <div
      style={{
        margin: '0 0 12px',
        background: bannerColor,
        border: `1px solid ${bannerBorder}`,
        fontFamily: 'var(--font-family-mono, monospace)',
      }}
    >
      {/* Summary bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: textColor,
          fontSize: '11px',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <AlertTriangle size={13} />
        <span style={{ flex: 1 }}>
          <strong style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {hasUnavailable ? 'Limited Mode' : 'Degraded'}
          </strong>
          {' — '}
          {summary.unavailable > 0 && `${summary.unavailable} unavailable`}
          {summary.unavailable > 0 && summary.degraded > 0 && ', '}
          {summary.degraded > 0 && `${summary.degraded} degraded`}
          {' of '}
          {summary.total} capabilities
        </span>

        {/* Recheck button */}
        <button
          onClick={handleRecheck}
          disabled={checking}
          style={{
            background: 'none',
            border: `1px solid ${bannerBorder}`,
            color: textColor,
            cursor: checking ? 'default' : 'pointer',
            padding: '2px 8px',
            fontSize: '10px',
            fontFamily: 'inherit',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            opacity: checking ? 0.6 : 0.85,
          }}
          title="Recheck affected integrations"
          aria-label="Recheck integrations"
        >
          {checking ? (
            <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw size={10} />
          )}
          {checking ? 'Checking...' : 'Recheck'}
        </button>

        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 12px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {degradedOrUnavailable.map((cap) => {
            const cfg = levelConfig[cap.level];
            const fixTarget = getPrimaryDependency(cap);
            return (
              <div
                key={cap.id}
                title={cap.reason}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  color: cfg.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {cfg.icon}
                {cap.label}
                {fixTarget && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSetup(fixTarget);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: '0 0 0 2px',
                      opacity: 0.7,
                      display: 'inline-flex',
                    }}
                    title={`Configure ${fixTarget}`}
                    aria-label={`Fix ${cap.label}: configure ${fixTarget}`}
                  >
                    <Settings size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inline keyframes for Loader2 spin */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
