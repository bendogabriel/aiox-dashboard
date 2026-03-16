import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresenceStore } from '../../stores/presenceStore';
import { useEngineHealth } from '../../hooks/useEngine';
import { cn } from '../../lib/utils';

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function PresenceAvatars() {
  const { users, wsClientCount, engineConnected } = usePresenceStore();
  const { data: engineHealth } = useEngineHealth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Bridge engine health data to presenceStore
  useEffect(() => {
    if (engineHealth && engineHealth.status === 'ok') {
      usePresenceStore.getState().setEngineStatus(true, engineHealth.ws_clients ?? 0);
    } else {
      usePresenceStore.getState().setEngineStatus(false);
    }
  }, [engineHealth]);

  // eslint-disable-next-line react-hooks/purity -- Date.now() needed to filter stale presence data
  const onlineUsers = users.filter((u) => Date.now() - u.lastSeen < 300000);

  // When not connected to engine, show offline indicator
  if (!engineConnected) {
    return (
      <div className="relative hidden sm:flex items-center">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass-subtle">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-xs text-tertiary font-medium">Offline</span>
        </div>
      </div>
    );
  }

  // Show WS client count badge when connected
  return (
    <div className="relative hidden sm:flex items-center">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        aria-label={`${wsClientCount} clients connected`}
      >
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass-subtle">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-secondary font-medium">
            {wsClientCount} connected
          </span>
        </div>
      </button>

      {onlineUsers.length > 0 && (
        <AnimatePresence>
          {showDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[58]"
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full right-0 mt-2 w-56 glass-card rounded-xl z-[59] overflow-hidden shadow-xl"
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-semibold text-primary">Connected Clients</p>
                </div>
                <div className="p-2 space-y-1">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary truncate">{user.name}</p>
                        <p className="text-[10px] text-tertiary">
                          {timeAgo(user.lastSeen)}
                        </p>
                      </div>
                      <div className="h-2 w-2 rounded-full flex-shrink-0 bg-green-400" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
