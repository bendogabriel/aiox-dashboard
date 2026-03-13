import { useState } from 'react';
import { useToastStore, type NotificationItem } from '../../stores/toastStore';
import { cn } from '../../lib/utils';

const typeConfig = {
  success: { color: 'text-[var(--color-status-success)]', bg: 'bg-[var(--color-status-success)]/10', label: 'Sucesso' },
  error: { color: 'text-[var(--bb-error)]', bg: 'bg-[var(--bb-error)]/10', label: 'Erro' },
  warning: { color: 'text-[var(--bb-warning)]', bg: 'bg-[var(--bb-warning)]/10', label: 'Aviso' },
  info: { color: 'text-[var(--aiox-blue)]', bg: 'bg-[var(--aiox-blue)]/10', label: 'Info' },
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'agora';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, clearNotifications } = useToastStore();

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-secondary hover:text-primary"
        aria-label="Notificações"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--bb-error)] text-white text-[9px] font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
</button>

      {/* Dropdown */}
      {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 z-50 w-80 max-h-[420px] overflow-hidden rounded-none border border-white/10 shadow-2xl"
              style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(12px)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-primary">Notificações</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-tertiary hover:text-primary transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-[340px] scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-tertiary">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <p className="text-xs">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <NotificationRow key={n.id} item={n} index={i} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
</div>
  );
}

function NotificationRow({ item, index }: { item: NotificationItem; index: number }) {
  const config = typeConfig[item.type];
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
        !item.read && 'bg-white/[0.02]'
      )}
    >
      <div className={cn('mt-0.5 w-2 h-2 rounded-full flex-shrink-0', item.read ? 'bg-transparent' : config.color.replace('text-', 'bg-'))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium uppercase', config.bg, config.color)}>
            {config.label}
          </span>
          <span className="text-[10px] text-tertiary ml-auto flex-shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <p className="text-xs text-primary mt-1 truncate">{item.title}</p>
        {item.message && (
          <p className="text-[11px] text-tertiary mt-0.5 line-clamp-2">{item.message}</p>
        )}
      </div>
    </div>
  );
}
