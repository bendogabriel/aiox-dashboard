import { useTerminalSSE } from '../../hooks/useTerminalSSE';
import { TerminalOutput } from './TerminalOutput';
import type { TerminalSession } from './TerminalCard';

interface LiveTerminalOutputProps {
  session: TerminalSession;
}

/**
 * Wraps TerminalOutput with an SSE connection for the expanded/focused view.
 */
export function LiveTerminalOutput({ session }: LiveTerminalOutputProps) {
  const { reconnect } = useTerminalSSE({
    sessionId: session.id,
    agentId: session.agentId || session.agent,
    enabled: true,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TerminalOutput
        lines={session.output}
        isActive={session.status === 'working' || session.status === 'connecting'}
      />
      {session.status === 'error' && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 bg-[var(--bb-error)]/10">
          <span className="text-xs text-[var(--bb-error)]">Connection lost</span>
          <button
            onClick={reconnect}
            className="text-xs text-[var(--bb-error)] hover:text-[var(--bb-error)]/80 underline"
          >
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
}
