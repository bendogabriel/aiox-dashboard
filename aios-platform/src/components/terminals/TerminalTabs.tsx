import { X } from 'lucide-react';
import { StatusDot } from '../ui';
import type { TerminalSession } from './TerminalCard';
import { cn } from '../../lib/utils';

interface TerminalTabsProps {
  sessions: TerminalSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function TerminalTabs({ sessions, activeId, onSelect, onClose }: TerminalTabsProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-shrink-0">
      {sessions.map((session) => {
        const isActive = session.id === activeId;

        return (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors min-w-0',
              isActive
                ? 'glass bg-white/10 text-primary'
                : 'text-tertiary hover:text-secondary hover:bg-white/5',
            )}
            aria-label={`Terminal ${session.agent}`}
            aria-selected={isActive}
            role="tab"
          >
            <StatusDot
              status={session.status}
              size="sm"
              pulse={session.status === 'working'}
            />
            <span className="truncate max-w-[120px]">{session.agent}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClose(session.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onClose(session.id);
                }
              }}
              className="p-0.5 rounded hover:bg-white/10 text-tertiary hover:text-secondary transition-colors"
              aria-label={`Close terminal ${session.agent}`}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
