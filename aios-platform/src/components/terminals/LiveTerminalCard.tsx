import { useTerminalSSE } from '../../hooks/useTerminalSSE';
import { TerminalCard, type TerminalSession } from './TerminalCard';

interface LiveTerminalCardProps {
  session: TerminalSession;
  listMode?: boolean;
}

/**
 * Wraps TerminalCard with an SSE connection.
 * Each card manages its own EventSource lifecycle.
 */
export function LiveTerminalCard({ session, listMode }: LiveTerminalCardProps) {
  useTerminalSSE({
    sessionId: session.id,
    agentId: session.agentId || session.agent,
    enabled: true,
  });

  return <TerminalCard session={session} listMode={listMode} />;
}
