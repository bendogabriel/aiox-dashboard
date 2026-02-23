import { useState } from 'react';
import { Minimize2, Maximize2, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Badge, StatusDot } from '../ui';
import type { StatusType } from '../ui/StatusDot';
import { cn } from '../../lib/utils';

export interface TerminalSession {
  id: string;
  agent: string;
  status: 'working' | 'idle' | 'error';
  dir: string;
  story: string;
  output: string[];
}

function mapStatus(status: TerminalSession['status']): StatusType {
  return status;
}

interface TerminalCardProps {
  session: TerminalSession;
  listMode?: boolean;
}

export function TerminalCard({ session, listMode = false }: TerminalCardProps) {
  const [minimized, setMinimized] = useState(false);
  const isActive = session.status === 'working';
  const statusType = mapStatus(session.status);

  // Show last 8 lines of output
  const visibleLines = session.output.slice(-8);

  return (
    <GlassCard
      padding="none"
      className={cn(
        'overflow-hidden flex flex-col',
        !listMode && 'h-[280px]',
        listMode && 'h-auto',
        isActive && 'ring-1 ring-green-500/20',
      )}
      aria-label={`Terminal ${session.agent} - ${session.status}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot
            status={statusType}
            size="sm"
            glow={isActive}
            pulse={isActive}
          />
          <span className="text-sm font-semibold text-primary truncate">
            {session.agent}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-tertiary">
            <FolderOpen className="h-3 w-3" />
            <span className="max-w-[100px] truncate">{session.dir}</span>
          </span>
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded hover:bg-white/5 text-tertiary hover:text-secondary transition-colors"
            aria-label={minimized ? 'Maximize terminal' : 'Minimize terminal'}
          >
            {minimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal output area */}
      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            <div
              className={cn(
                'bg-black/80 p-3 font-mono text-xs leading-relaxed overflow-y-auto',
                !listMode && 'h-[200px]',
                listMode && 'max-h-[160px]',
              )}
            >
              {visibleLines.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.startsWith('$') ? (
                    <span className="text-green-400">{line}</span>
                  ) : line.startsWith('PASS') || line.includes('passed') || line.startsWith('✓') ? (
                    <span className="text-green-300">{line}</span>
                  ) : line.startsWith('FAIL') || line.includes('error') || line.includes('Error') ? (
                    <span className="text-red-400">{line}</span>
                  ) : (
                    <span className="text-gray-300">{line}</span>
                  )}
                </div>
              ))}
              {isActive && (
                <span className="text-green-400 animate-pulse">_</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer: Story badge */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5">
        {session.story ? (
          <Badge variant="default" size="sm">
            {session.story}
          </Badge>
        ) : (
          <span className="text-[10px] text-tertiary">No active story</span>
        )}
        <span
          className={cn(
            'text-[10px] font-medium capitalize',
            isActive ? 'text-green-400' : 'text-tertiary',
          )}
        >
          {session.status}
        </span>
      </div>
    </GlassCard>
  );
}
