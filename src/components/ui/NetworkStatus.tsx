import { useNetworkStatus, useOfflineQueue } from '../../services/offline';
import { CockpitButton } from './cockpit/CockpitButton';
import { cn } from '../../lib/utils';

const WifiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const WifiOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const SyncIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

interface NetworkStatusBannerProps {
  className?: string;
  showQueueInfo?: boolean;
}

export function NetworkStatusBanner({ className, showQueueInfo = true }: NetworkStatusBannerProps) {
  const { status, isOnline, isSlow } = useNetworkStatus();
  const { queueSize, isSyncing, sync } = useOfflineQueue();

  // Don't show if online and no queue
  if (isOnline && !isSlow && queueSize === 0) {
    return null;
  }

  return (
    <>
    {(!isOnline || isSlow || queueSize > 0) && (
        <div

          className={cn(
            'px-4 py-2 flex items-center justify-between gap-3',
            status === 'offline' && 'bg-[var(--bb-error)]/10 border-b border-[var(--bb-error)]/20',
            status === 'slow' && 'bg-[var(--bb-warning)]/10 border-b border-[var(--bb-warning)]/20',
            status === 'online' && queueSize > 0 && 'bg-[var(--aiox-blue)]/10 border-b border-[var(--aiox-blue)]/20',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn(
              status === 'offline' && 'text-[var(--bb-error)]',
              status === 'slow' && 'text-[var(--bb-warning)]',
              status === 'online' && 'text-[var(--aiox-blue)]'
            )}>
              {status === 'offline' ? <WifiOffIcon /> : <WifiIcon />}
            </span>
            <span className={cn(
              'text-sm font-medium',
              status === 'offline' && 'text-[var(--bb-error)]',
              status === 'slow' && 'text-[var(--bb-warning)]',
              status === 'online' && 'text-[var(--aiox-blue)]'
            )}>
              {status === 'offline' && 'Sem conexão'}
              {status === 'slow' && 'Conexão lenta'}
              {status === 'online' && queueSize > 0 && 'Sincronizando...'}
            </span>
            {showQueueInfo && queueSize > 0 && (
              <span className="text-xs text-tertiary">
                ({queueSize} pendente{queueSize > 1 ? 's' : ''})
              </span>
            )}
          </div>

          {queueSize > 0 && isOnline && (
            <CockpitButton
              variant="ghost"
              size="sm"
              onClick={sync}
              disabled={isSyncing}
              className="h-7 text-xs"
              leftIcon={
                <span

                >
                  <SyncIcon />
                </span>
              }
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </CockpitButton>
          )}
        </div>
      )}
    </>
);
}

// Compact indicator for header/sidebar
interface NetworkStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function NetworkStatusIndicator({ className, showLabel = false }: NetworkStatusIndicatorProps) {
  const { status, quality } = useNetworkStatus();
  const { queueSize } = useOfflineQueue();

  const getStatusColor = () => {
    if (status === 'offline') return 'bg-[var(--bb-error)]';
    if (status === 'slow' || quality < 0.5) return 'bg-[var(--bb-warning)]';
    return 'bg-[var(--color-status-success)]';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className={cn(
          'w-2 h-2 rounded-full',
          getStatusColor()
        )} />
        {status === 'online' && (
          <div
            className={cn(
              'absolute inset-0 w-2 h-2 rounded-full',
              getStatusColor()
            )}

          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-tertiary">
          {status === 'offline' && 'Offline'}
          {status === 'slow' && 'Lento'}
          {status === 'online' && 'Online'}
        </span>
      )}
      {queueSize > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bb-flare)]/20 text-[var(--bb-flare)]">
          {queueSize}
        </span>
      )}
    </div>
  );
}
