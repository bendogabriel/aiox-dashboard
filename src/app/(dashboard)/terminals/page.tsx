'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Grid2X2, Rows3, Radio, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/stores/terminal-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useActiveAgents } from '@/hooks/useActiveAgents';
import { TerminalStream, TerminalOutput } from '@/components/terminals';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AGENT_CONFIG, type AgentId } from '@/types';

type ViewMode = 'grid' | 'single';

const AVAILABLE_AGENTS: (AgentId | 'main')[] = ['main', 'dev', 'qa', 'architect', 'pm', 'po', 'devops'];

export default function TerminalsPage() {
  const { settings } = useSettingsStore();
  const {
    terminals,
    activeTerminalId,
    createTerminal,
    removeTerminal,
    setActiveTerminal,
    getTerminalsByAgent,
    getAllTerminals,
  } = useTerminalStore();

  const { agents, activeCount, refetch } = useActiveAgents({
    pollInterval: 10_000,
    activeOnly: false,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const isInitializedRef = useRef(false);
  const syncedAgentsRef = useRef<Set<string>>(new Set());

  // Auto-create terminals for active agents
  useEffect(() => {
    if (settings.useMockData) return;

    const activeAgents = agents.filter(a => a.active);
    if (activeAgents.length === 0 && !isInitializedRef.current) {
      // No active agents yet — don't force create anything
      isInitializedRef.current = true;
      return;
    }

    for (const agent of activeAgents) {
      const agentId = agent.agentId as AgentId | 'main';
      // Skip if we already synced this agent and a terminal exists
      if (syncedAgentsRef.current.has(agentId)) continue;

      const existing = getTerminalsByAgent(agentId);
      if (existing.length === 0) {
        createTerminal(agentId);
      }
      syncedAgentsRef.current.add(agentId);
    }

    isInitializedRef.current = true;
  }, [agents, settings.useMockData, getTerminalsByAgent, createTerminal]);

  // Handle new terminal (manual)
  const handleNewTerminal = useCallback((agentId: AgentId | 'main' = 'main') => {
    const id = createTerminal(agentId);
    setActiveTerminal(id);
  }, [createTerminal, setActiveTerminal]);

  // Handle close terminal
  const handleCloseTerminal = useCallback((id: string) => {
    const terminal = terminals[id];
    if (terminal) {
      syncedAgentsRef.current.delete(terminal.agentId);
    }
    removeTerminal(id);
  }, [terminals, removeTerminal]);

  // If using mock data, show the old TerminalOutput
  if (settings.useMockData) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Agent Terminals</h1>
            <p className="text-sm text-muted-foreground">
              View agent execution logs and output
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <TerminalOutput />
        </div>
      </div>
    );
  }

  const allTerminals = Object.values(terminals);
  const activeTerminal = activeTerminalId ? terminals[activeTerminalId] : null;

  // Agents that have logs but no terminal open
  const agentsWithoutTerminal = agents.filter(a => {
    const existing = getTerminalsByAgent(a.agentId as AgentId | 'main');
    return existing.length === 0;
  });

  // Grid cols based on terminal count
  const gridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 xl:grid-cols-3';
    return 'grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              Agent Terminals
              {activeCount > 0 && (
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50 text-xs">
                  <Radio className="h-3 w-3 mr-1 animate-pulse" />
                  {activeCount} active
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {allTerminals.length > 0
                ? `Streaming ${allTerminals.length} terminal${allTerminals.length !== 1 ? 's' : ''} in real-time`
                : 'Waiting for active agents...'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button variant="ghost" size="sm" onClick={refetch} title="Refresh agent list">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2 py-1.5 rounded-l-md transition-colors',
                viewMode === 'grid' ? 'bg-accent' : 'hover:bg-muted'
              )}
              title="Grid View"
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={cn(
                'px-2 py-1.5 rounded-r-md transition-colors',
                viewMode === 'single' ? 'bg-accent' : 'hover:bg-muted'
              )}
              title="Single View"
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>

          {/* New Terminal Dropdown */}
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Terminal
            </Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
              <div className="bg-popover border border-border rounded-md shadow-lg py-1 min-w-[180px]">
                {/* Show agents with existing logs first */}
                {agentsWithoutTerminal.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                      Agents with logs
                    </div>
                    {agentsWithoutTerminal.map((agent) => {
                      const agentId = agent.agentId as AgentId | 'main';
                      const config = agentId !== 'main' ? AGENT_CONFIG[agentId as AgentId] : null;
                      return (
                        <button
                          key={agent.agentId}
                          onClick={() => handleNewTerminal(agentId)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: config?.color || '#888' }}
                          />
                          {config?.name || 'Main'} Logs
                          {agent.active && (
                            <span className="ml-auto text-xs text-green-500">active</span>
                          )}
                        </button>
                      );
                    })}
                    <div className="border-t border-border my-1" />
                  </>
                )}
                <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                  All agents
                </div>
                {AVAILABLE_AGENTS.map((agentId) => (
                  <button
                    key={agentId}
                    onClick={() => handleNewTerminal(agentId)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                  >
                    {agentId === 'main' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-gray-500" />
                        Main Logs
                      </>
                    ) : (
                      <>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: AGENT_CONFIG[agentId].color }}
                        />
                        {AGENT_CONFIG[agentId].name}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {allTerminals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <Radio className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No Active Agents</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Terminals auto-open when agents start writing to <code className="text-xs bg-muted px-1 py-0.5 rounded">.aios/logs/</code>.
              You can also open one manually.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => handleNewTerminal('dev')}>
                <Plus className="h-4 w-4 mr-2" />
                Open @dev
              </Button>
              <Button variant="outline" onClick={() => handleNewTerminal('main')}>
                <Plus className="h-4 w-4 mr-2" />
                Open Main
              </Button>
            </div>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="flex-1 overflow-auto">
          <div
            className={cn('grid gap-3 h-full', gridCols(allTerminals.length))}
            style={{ minHeight: '400px' }}
          >
            {allTerminals.map((terminal) => (
              <div key={terminal.id} className="min-h-[250px]">
                <TerminalStream
                  terminalId={terminal.id}
                  onClose={() => handleCloseTerminal(terminal.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Terminal tabs */}
          <div className="flex items-center gap-1 border-b border-border pb-2 mb-2 overflow-x-auto">
            {allTerminals.map((terminal) => {
              const agentConfig = terminal.agentId !== 'main'
                ? AGENT_CONFIG[terminal.agentId as AgentId]
                : null;
              return (
                <button
                  key={terminal.id}
                  onClick={() => setActiveTerminal(terminal.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap',
                    terminal.id === activeTerminalId
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: agentConfig?.color || '#888' }}
                  />
                  {agentConfig?.name || 'Main'}
                  {terminal.status === 'connected' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active terminal */}
          <div className="flex-1 min-h-0">
            {activeTerminal ? (
              <TerminalStream
                terminalId={activeTerminal.id}
                onClose={() => handleCloseTerminal(activeTerminal.id)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a terminal
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
