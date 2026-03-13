import { useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Send } from 'lucide-react';
import {
  useCapabilityHistoryStore,
  type WebhookConfig,
  type WebhookTrigger,
} from '../../stores/capabilityHistoryStore';
import { inputStyle, labelStyle, hintStyle, primaryBtnStyle } from './shared-styles';

const TRIGGER_LABELS: Record<WebhookTrigger, { label: string; desc: string }> = {
  integration_down: { label: 'Down', desc: 'Integration goes offline' },
  integration_up: { label: 'Up', desc: 'Integration comes back online' },
  all_clear: { label: 'All Clear', desc: 'All capabilities fully operational' },
  degraded: { label: 'Degraded', desc: 'Capabilities become degraded' },
};

/**
 * Webhook Alerts — configure HTTP webhook URLs that fire on health events.
 */
export function WebhookAlerts() {
  const { webhooks, addWebhook, removeWebhook, toggleWebhook } = useCapabilityHistoryStore();
  const [expanded, setExpanded] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTriggers, setNewTriggers] = useState<WebhookTrigger[]>(['integration_down', 'integration_up']);
  const [testing, setTesting] = useState<string | null>(null);

  const handleAdd = () => {
    const url = newUrl.trim();
    if (!url || !url.startsWith('http')) return;
    addWebhook(url, newTriggers);
    setNewUrl('');
    setNewTriggers(['integration_down', 'integration_up']);
  };

  const toggleTrigger = (trigger: WebhookTrigger) => {
    setNewTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger],
    );
  };

  const handleTest = async (wh: WebhookConfig) => {
    setTesting(wh.id);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (wh.authHeader) headers['Authorization'] = wh.authHeader;

      await fetch(wh.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'aios-health-event',
          trigger: 'test',
          event: {
            integrationId: 'engine',
            previousStatus: 'disconnected',
            newStatus: 'connected',
            capabilitiesAffected: 0,
            summary: { full: 21, degraded: 0, unavailable: 0, total: 21 },
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch {
      /* best-effort test */
    } finally {
      setTesting(null);
    }
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
        <Bell size={14} style={{ color: 'var(--aiox-gray-dim, #696969)' }} />
        <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Webhook Alerts
        </span>
        {webhooks.length > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--aiox-gray-dim)' }}>
            {webhooks.filter((w) => w.enabled).length}/{webhooks.length} active
          </span>
        )}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Existing webhooks */}
          {webhooks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: wh.enabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${wh.enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                    opacity: wh.enabled ? 1 : 0.5,
                  }}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggleWebhook(wh.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: wh.enabled ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-dim)' }}
                    title={wh.enabled ? 'Disable' : 'Enable'}
                    aria-label={wh.enabled ? 'Disable webhook' : 'Enable webhook'}
                  >
                    {wh.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>

                  {/* URL */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '10px', color: 'var(--aiox-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {wh.url}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--aiox-gray-dim)', marginTop: '2px' }}>
                      {wh.triggers.map((t) => TRIGGER_LABELS[t].label).join(', ')}
                    </div>
                  </div>

                  {/* Test */}
                  <button
                    onClick={() => handleTest(wh)}
                    disabled={testing === wh.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--aiox-blue, #0099FF)' }}
                    title="Send test webhook"
                    aria-label="Test webhook"
                  >
                    <Send size={12} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => removeWebhook(wh.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-status-error)' }}
                    title="Remove webhook"
                    aria-label="Remove webhook"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new webhook */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={labelStyle}>Webhook URL</label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                style={inputStyle}
              />
            </div>

            {/* Trigger selection */}
            <div>
              <label style={labelStyle}>Triggers</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(Object.entries(TRIGGER_LABELS) as [WebhookTrigger, typeof TRIGGER_LABELS[WebhookTrigger]][]).map(
                  ([trigger, meta]) => {
                    const active = newTriggers.includes(trigger);
                    return (
                      <button
                        key={trigger}
                        onClick={() => toggleTrigger(trigger)}
                        title={meta.desc}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontFamily: 'inherit',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: active ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                          color: active ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-muted, #999)',
                          cursor: 'pointer',
                        }}
                      >
                        {meta.label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!newUrl.trim() || !newUrl.startsWith('http') || newTriggers.length === 0}
              style={{ ...primaryBtnStyle, opacity: !newUrl.trim() || newTriggers.length === 0 ? 0.5 : 1 }}
            >
              <Plus size={12} style={{ display: 'inline', marginRight: 6 }} />
              Add Webhook
            </button>

            <p style={hintStyle}>
              Webhooks send POST requests with JSON payload on health events.
              Supports Slack, Discord, n8n, or any HTTP endpoint.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
