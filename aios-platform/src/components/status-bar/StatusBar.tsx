import { StatusDot } from '../ui';
import { cn } from '../../lib/utils';
import { Wifi, WifiOff, Bell } from 'lucide-react';

// Mock data - will be replaced by real API data later
const mockStatus = {
  connected: true,
  apiUsage: { current: 42, limit: 100 },
  claudeReady: true,
  bobActive: false,
  activeAgent: null as string | null,
  notificationCount: 3,
};

export function StatusBar() {
  const {
    connected,
    apiUsage,
    claudeReady,
    bobActive,
    activeAgent,
    notificationCount,
  } = mockStatus;

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30',
        'h-7 px-3 flex items-center justify-between',
        'glass-subtle border-t border-glass-border',
        'text-[10px] select-none'
      )}
      role="status"
      aria-label="Status bar"
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-3 w-3 text-green-500" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" aria-hidden="true" />
          )}
          <span
            className={cn(
              'font-medium',
              connected ? 'text-green-500' : 'text-red-500'
            )}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Separator */}
        <span className="h-3 w-px bg-glass-border" aria-hidden="true" />

        {/* API rate limit */}
        <span className="text-tertiary font-mono">
          API: {apiUsage.current}/{apiUsage.limit}
        </span>

        {/* Separator */}
        <span className="h-3 w-px bg-glass-border" aria-hidden="true" />

        {/* Claude status */}
        <div className="flex items-center gap-1.5">
          <StatusDot
            status={claudeReady ? 'success' : 'waiting'}
            size="sm"
            glow={claudeReady}
          />
          <span
            className={cn(
              'font-medium',
              claudeReady ? 'text-green-500' : 'text-yellow-500'
            )}
          >
            {claudeReady ? 'Claude Ready' : 'Claude Busy'}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Bob status */}
        <div className="flex items-center gap-1.5">
          <StatusDot
            status={bobActive ? 'working' : 'idle'}
            size="sm"
            pulse={bobActive}
          />
          <span className="text-tertiary">
            Bob: {bobActive ? 'Active' : 'Idle'}
          </span>
        </div>

        {/* Active agent */}
        {activeAgent && (
          <>
            <span className="h-3 w-px bg-glass-border" aria-hidden="true" />
            <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">
              {activeAgent}
            </span>
          </>
        )}

        {/* Separator */}
        <span className="h-3 w-px bg-glass-border" aria-hidden="true" />

        {/* Notification count */}
        <div className="flex items-center gap-1">
          <Bell className="h-3 w-3 text-tertiary" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="min-w-[14px] h-[14px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
              {notificationCount}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
