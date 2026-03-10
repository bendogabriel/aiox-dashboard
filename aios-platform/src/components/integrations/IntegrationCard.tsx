import { RefreshCw, Settings, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IntegrationStatus } from '../../stores/integrationStore';

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  status: IntegrationStatus;
  message?: string;
  onConfigure: () => void;
  onRefresh: () => void;
}

const statusConfig: Record<IntegrationStatus, {
  color: string;
  bg: string;
  border: string;
  label: string;
  icon: ReactNode;
}> = {
  connected: {
    color: 'var(--aiox-lime, #D1FF00)',
    bg: 'rgba(209, 255, 0, 0.06)',
    border: 'rgba(209, 255, 0, 0.2)',
    label: 'Connected',
    icon: <Check size={14} />,
  },
  disconnected: {
    color: 'var(--aiox-gray-dim, #696969)',
    bg: 'rgba(105, 105, 105, 0.06)',
    border: 'rgba(105, 105, 105, 0.2)',
    label: 'Not Connected',
    icon: <X size={14} />,
  },
  checking: {
    color: 'var(--aiox-blue, #0099FF)',
    bg: 'rgba(0, 153, 255, 0.06)',
    border: 'rgba(0, 153, 255, 0.2)',
    label: 'Checking...',
    icon: <Loader2 size={14} className="animate-spin" />,
  },
  error: {
    color: 'var(--color-status-error, #EF4444)',
    bg: 'rgba(239, 68, 68, 0.06)',
    border: 'rgba(239, 68, 68, 0.2)',
    label: 'Error',
    icon: <X size={14} />,
  },
  partial: {
    color: 'var(--aiox-warning, #f59e0b)',
    bg: 'rgba(245, 158, 11, 0.06)',
    border: 'rgba(245, 158, 11, 0.2)',
    label: 'Partial',
    icon: <AlertTriangle size={14} />,
  },
};

export function IntegrationCard({ name, description, icon, status, message, onConfigure, onRefresh }: IntegrationCardProps) {
  const cfg = statusConfig[status];

  return (
    <div
      style={{
        background: 'var(--aiox-surface, #0A0A0A)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 0,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {/* Header: icon + name + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-family-mono, monospace)',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: 'var(--aiox-cream, #E5E5E5)',
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--aiox-gray-dim, #696969)',
                marginTop: '2px',
              }}
            >
              {description}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-family-mono, monospace)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {cfg.icon}
          {cfg.label}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            fontSize: '12px',
            fontFamily: 'var(--font-family-mono, monospace)',
            color: 'var(--aiox-gray-muted, #999999)',
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `2px solid ${cfg.border}`,
          }}
        >
          {message}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          onClick={onConfigure}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-family-mono, monospace)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            fontWeight: 500,
            color: status === 'connected' ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-dark, #050505)',
            background: status === 'connected'
              ? 'transparent'
              : 'var(--aiox-lime, #D1FF00)',
            border: status === 'connected'
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid var(--aiox-lime, #D1FF00)',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <Settings size={14} />
          {status === 'connected' ? 'Configure' : 'Connect'}
        </button>

        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--aiox-gray-muted, #999)',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--aiox-lime, #D1FF00)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--aiox-gray-muted, #999)'; }}
          title="Refresh status"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}
