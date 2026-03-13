import { useState, useEffect, useRef } from 'react';
import { Terminal, LayoutGrid, List, Plus, ArrowLeft, Radio, RefreshCw } from 'lucide-react';
import { CockpitCard, CockpitButton, Badge, ProgressBar, SectionLabel } from '../ui';
import { LiveTerminalCard } from './LiveTerminalCard';
import { LiveTerminalOutput } from './LiveTerminalOutput';
import { TerminalTabs } from './TerminalTabs';
import { useTerminalStore } from '../../stores/terminalStore';
import { useActiveAgents } from '../../hooks/useActiveAgents';
import type { TerminalSession } from './TerminalCard';
import { cn } from '../../lib/utils';

// Map known agent IDs to display names
const AGENT_DISPLAY: Record<string, string> = {
  main: 'Main',
  dev: '@dev (Dex)',
  qa: '@qa (Quinn)',
  architect: '@architect (Aria)',
  pm: '@pm (Morgan)',
  po: '@po (Pax)',
  sm: '@sm (River)',
  devops: '@devops (Gage)',
  analyst: '@analyst (Orion)',
  'data-engineer': '@data-engineer (Dara)',
};

const AVAILABLE_AGENTS = ['main', 'dev', 'qa', 'architect', 'pm', 'po', 'devops', 'sm'];

const MAX_SESSIONS = 12;

function createSessionForAgent(agentId: string): TerminalSession {
  return {
    id: `live-${agentId}-${Date.now()}`,
    agent: AGENT_DISPLAY[agentId] || `@${agentId}`,
    agentId,
    status: 'idle',
    dir: '~/.aios/logs',
    story: '',
    output: [],
  };
}

export default function TerminalsView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const {
    sessions,
    activeSessionId,
    addSession,
    removeSession,
    setActiveSession,
    getSessionByAgentId,
    setSessions,
  } = useTerminalStore();

  const { agents, activeCount, refetch } = useActiveAgents({
    pollInterval: 10_000,
    activeOnly: false,
  });

  const syncedRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Auto-create sessions for active agents
  useEffect(() => {
    // On first load, clear stale mock sessions
    if (!initializedRef.current) {
      const hasMockSessions = sessions.some(s => !s.agentId);
      if (hasMockSessions) {
        setSessions([]);
      }
      initializedRef.current = true;
    }

    const activeAgents = (agents || []).filter(a => a.active);
    for (const agent of activeAgents) {
      if (syncedRef.current.has(agent.agentId)) continue;

      const existing = getSessionByAgentId(agent.agentId);
      if (!existing) {
        addSession(createSessionForAgent(agent.agentId));
      }
      syncedRef.current.add(agent.agentId);
    }
  }, [agents, sessions, addSession, getSessionByAgentId, setSessions]);

  const handleRemoveSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session?.agentId) {
      syncedRef.current.delete(session.agentId);
    }
    removeSession(id);
  };

  const handleAddAgent = (agentId: string) => {
    const existing = getSessionByAgentId(agentId);
    if (existing) {
      setActiveSession(existing.id);
      return;
    }
    const session = createSessionForAgent(agentId);
    addSession(session);
    setActiveSession(session.id);
    syncedRef.current.add(agentId);
  };

  const sessionCount = sessions.length;
  const capacityPercent = Math.round((sessionCount / MAX_SESSIONS) * 100);
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // Agents not yet in a session
  const agentsWithoutSession = (agents || []).filter(
    a => !getSessionByAgentId(a.agentId)
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-primary" />
          <h1 className="heading-display text-xl font-semibold text-primary type-h2">Terminals</h1>
          <Badge variant="default" size="sm">
            {sessionCount} sessions
          </Badge>
          {activeCount > 0 && (
            <Badge variant="default" size="sm" className="terminal-status-active">
              <Radio className="h-3 w-3 mr-1 animate-pulse" />
              {activeCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={refetch}
            className="p-2 rounded-none text-tertiary hover:text-secondary hover:bg-white/5 transition-colors"
            title="Refresh agent list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Grid/List toggle */}
          <div className="flex items-center glass rounded-none overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-white/10 text-primary'
                  : 'text-tertiary hover:text-secondary',
              )}
              aria-label="Grid view"
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
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* New Terminal Dropdown */}
          <div className="relative group">
            <CockpitButton
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={sessionCount >= MAX_SESSIONS}
            >
              New Terminal
            </CockpitButton>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20">
              <div className="glass rounded-none py-1 min-w-[200px] shadow-lg border border-white/10">
                {/* Agents with logs but no session */}
                {agentsWithoutSession.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-[10px] text-tertiary uppercase tracking-wider">
                      With logs
                    </div>
                    {agentsWithoutSession.map((agent) => (
                      <button
                        key={agent.agentId}
                        onClick={() => handleAddAgent(agent.agentId)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 text-secondary hover:text-primary transition-colors"
                      >
                        <span className="h-2 w-2 rounded-full bg-[var(--color-status-success)]" />
                        {AGENT_DISPLAY[agent.agentId] || `@${agent.agentId}`}
                        {agent.active && (
                          <span className="ml-auto text-[10px] terminal-status-active">live</span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-white/5 my-1" />
                  </>
                )}
                <div className="px-3 py-1 text-[10px] text-tertiary uppercase tracking-wider">
                  All agents
                </div>
                {AVAILABLE_AGENTS.map((agentId) => (
                  <button
                    key={agentId}
                    onClick={() => handleAddAgent(agentId)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 text-secondary hover:text-primary transition-colors"
                  >
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    {AGENT_DISPLAY[agentId] || `@${agentId}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Tabs */}
      <TerminalTabs
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={(id) =>
          setActiveSession(id === activeSessionId ? null : id)
        }
        onClose={(id) => handleRemoveSession(id)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        {activeSession ? (
          /* Expanded terminal output for selected session */
          <CockpitCard padding="none" className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSession(null)}
                  className="p-1 rounded hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                  aria-label="Back to all terminals"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-primary">
                  {activeSession.agent}
                </span>
                <span className={cn(
                  'text-[10px] font-medium capitalize',
                  activeSession.status === 'working' && 'terminal-status-active',
                  activeSession.status === 'connecting' && 'text-[var(--bb-warning)]',
                  activeSession.status === 'error' && 'text-[var(--bb-error)]',
                  activeSession.status === 'idle' && 'text-tertiary',
                )}>
                  {activeSession.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeSession.story && (
                  <Badge variant="default" size="sm">{activeSession.story}</Badge>
                )}
                <span className="text-[10px] text-tertiary">
                  {activeSession.output.length} lines
                </span>
              </div>
            </div>
            <LiveTerminalOutput session={activeSession} />
          </CockpitCard>
        ) : (
          /* Session cards grid/list */
          <div className="flex-1 overflow-y-auto" tabIndex={0} role="region" aria-label="Terminal sessions">
            <SectionLabel count={sessionCount}>Active Sessions</SectionLabel>

            {sessions.length > 0 ? (
              <div
                className={cn(
                  'mt-3',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'flex flex-col gap-3',
                )}
              >
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="cursor-pointer"
                    onClick={() => setActiveSession(session.id)}
                  >
                    <LiveTerminalCard
                      session={session}
                      listMode={viewMode === 'list'}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center mt-12">
                <CockpitCard padding="lg" className="text-center max-w-sm">
                  <Radio className="h-10 w-10 text-tertiary mx-auto mb-3" />
                  <h2 className="text-sm font-semibold text-primary mb-1">Waiting for agents</h2>
                  <p className="text-xs text-secondary mb-3">
                    Terminals auto-open when agents start writing to <code className="text-[10px] bg-white/5 px-1 py-0.5 rounded">.aios/logs/</code>
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <CockpitButton size="sm" onClick={() => handleAddAgent('dev')}>
                      <Plus className="h-3 w-3 mr-1" />
                      @dev
                    </CockpitButton>
                    <CockpitButton size="sm" onClick={() => handleAddAgent('main')}>
                      <Plus className="h-3 w-3 mr-1" />
                      Main
                    </CockpitButton>
                  </div>
                </CockpitCard>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <CockpitCard padding="sm" variant="subtle" className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-tertiary">
              {activeCount > 0 ? `${activeCount} agents streaming` : 'No active agents'}
            </span>
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
      </CockpitCard>
    </div>
  );
}
