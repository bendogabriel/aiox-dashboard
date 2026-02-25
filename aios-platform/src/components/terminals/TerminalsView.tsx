import { useState } from 'react';
import { Terminal, LayoutGrid, List, Plus } from 'lucide-react';
import { GlassCard, GlassButton, Badge, ProgressBar, SectionLabel } from '../ui';
import { TerminalCard } from './TerminalCard';
import type { TerminalSession } from './TerminalCard';
import { cn } from '../../lib/utils';

const MAX_SESSIONS = 12;

// TODO: Connect to Monitor Server WebSocket for real terminal sessions

export default function TerminalsView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Empty state — no active terminal sessions
  const sessions: TerminalSession[] = [];
  const sessionCount = sessions.length;
  const capacityPercent = Math.round((sessionCount / MAX_SESSIONS) * 100);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-primary">Terminals</h1>
          <Badge variant="default" size="sm">
            {sessionCount} sessions
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid/List toggle */}
          <div className="flex items-center glass rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-white/10 text-primary'
                  : 'text-tertiary hover:text-secondary',
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-white/10 text-primary'
                  : 'text-tertiary hover:text-secondary',
              )}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <GlassButton
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Terminal
          </GlassButton>
        </div>
      </div>

      {/* Terminal sessions */}
      <SectionLabel count={sessionCount}>Active Sessions</SectionLabel>

      {sessions.length > 0 ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'flex flex-col gap-3',
          )}
        >
          {sessions.map((session) => (
            <TerminalCard
              key={session.id}
              session={session}
              listMode={viewMode === 'list'}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <GlassCard padding="lg" className="text-center max-w-sm">
            <Terminal className="h-10 w-10 text-tertiary mx-auto mb-3" />
            <h2 className="text-sm font-semibold text-primary mb-1">No active terminals</h2>
            <p className="text-xs text-secondary">
              Terminal sessions will appear here when agents start executing tasks.
            </p>
          </GlassCard>
        </div>
      )}

      {/* Footer */}
      <GlassCard padding="sm" variant="subtle" className="flex-shrink-0 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-tertiary">Capacity</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-tertiary">
              {sessionCount}/{MAX_SESSIONS} sessions
            </span>
            <ProgressBar
              value={capacityPercent}
              size="sm"
              variant={capacityPercent > 80 ? 'warning' : 'default'}
              className="w-24"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
