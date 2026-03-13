/**
 * NotificationCenter — P14 Centralized notification panel
 *
 * Shows persistent notification history (beyond ephemeral toasts).
 * Supports mark-all-read, clear, filtering by type, and desktop notification toggle.
 */

import { useState, useMemo } from 'react';
import { Bell, Check, Trash2, BellOff, BellRing, X } from 'lucide-react';
import { useToastStore, type NotificationItem, type ToastType } from '../../stores/toastStore';

// ── Type filter ──────────────────────────────────────────

type FilterType = 'all' | ToastType;

const TYPE_COLORS: Record<ToastType, string> = {
  success: 'var(--color-status-success, #4ADE80)',
  error: 'var(--color-status-error, #EF4444)',
  warning: 'var(--aiox-warning, #f59e0b)',
  info: 'var(--aiox-gray-muted, #999)',
};

const TYPE_LABELS: Record<FilterType, string> = {
  all: 'All',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;

  // Same year? show month/day
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString();
}

// ── Component ────────────────────────────────────────────

export function NotificationCenter() {
  const notifications = useToastStore((s) => s.notifications);
  const unreadCount = useToastStore((s) => s.unreadCount);
  const markAllRead = useToastStore((s) => s.markAllRead);
  const clearNotifications = useToastStore((s) => s.clearNotifications);
  const desktopEnabled = useToastStore((s) => s.desktopNotificationsEnabled);
  const enableDesktop = useToastStore((s) => s.enableDesktopNotifications);
  const setDesktop = useToastStore((s) => s.setDesktopNotifications);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    for (const n of notifications) {
      counts[n.type] = (counts[n.type] || 0) + 1;
    }
    return counts;
  }, [notifications]);

  const handleToggleDesktop = async () => {
    if (desktopEnabled) {
      setDesktop(false);
    } else {
      await enableDesktop();
    }
  };

  return (
    <div style={{
      background: 'var(--aiox-surface, #0a0a0a)',
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'var(--font-family-mono, monospace)',
    }}>
      {/* Header */}
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--aiox-cream, #E5E5E5)',
          fontSize: '11px',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <Bell size={14} style={{ color: 'var(--aiox-gray-dim, #696969)' }} />
        <span style={{
          flex: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}>
          Notifications
        </span>
        {unreadCount > 0 && (
          <span style={{
            padding: '1px 6px',
            fontSize: '9px',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.12)',
            color: 'var(--aiox-cream, #E5E5E5)',
          }}>
            {unreadCount}
          </span>
        )}
        <span style={{ fontSize: '9px', color: 'var(--aiox-gray-dim)' }}>
          {notifications.length}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Actions bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '2px' }}>
              {(['all', 'error', 'warning', 'success', 'info'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '8px',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    background: filter === f ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: filter === f ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {TYPE_LABELS[f]} {typeCounts[f] ? `(${typeCounts[f]})` : ''}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleToggleDesktop}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: desktopEnabled ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-dim)',
                }}
                title={desktopEnabled ? 'Disable desktop notifications' : 'Enable desktop notifications'}
                aria-label="Toggle desktop notifications"
              >
                {desktopEnabled ? <BellRing size={12} /> : <BellOff size={12} />}
              </button>
              <button
                onClick={() => { markAllRead(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--aiox-gray-muted, #999)',
                }}
                title="Mark all read"
                aria-label="Mark all read"
              >
                <Check size={12} />
              </button>
              <button
                onClick={clearNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--color-status-error, #EF4444)',
                }}
                title="Clear all"
                aria-label="Clear all notifications"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{
            maxHeight: '320px',
            overflow: 'auto',
          }}>
            {filtered.length === 0 && (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontSize: '10px',
                color: 'var(--aiox-gray-dim, #696969)',
              }}>
                No notifications{filter !== 'all' ? ` of type "${filter}"` : ''}
              </div>
            )}

            {filtered.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification Row ─────────────────────────────────────

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const color = TYPE_COLORS[notification.type];

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      padding: '10px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      opacity: notification.read ? 0.7 : 1,
    }}>
      {/* Type indicator */}
      <div style={{
        width: '3px',
        flexShrink: 0,
        background: color,
        opacity: notification.read ? 0.4 : 1,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '10px',
          fontWeight: notification.read ? 400 : 600,
          color: 'var(--aiox-cream, #E5E5E5)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {notification.title}
        </div>
        {notification.message && (
          <div style={{
            fontSize: '9px',
            color: 'var(--aiox-gray-muted, #999)',
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {notification.message}
          </div>
        )}
      </div>

      {/* Time */}
      <span style={{
        fontSize: '8px',
        color: 'var(--aiox-gray-dim, #696969)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        {formatTime(notification.timestamp)}
      </span>
    </div>
  );
}
