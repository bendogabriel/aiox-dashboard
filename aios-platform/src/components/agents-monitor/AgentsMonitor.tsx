import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Play, Pause, RefreshCw, Moon } from 'lucide-react';
import { GlassButton, Badge, StatusDot, SectionLabel } from '../ui';
import { AgentMonitorCard, type AgentMonitorData } from './AgentMonitorCard';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { AgentPerformanceStats } from './AgentPerformanceStats';
import { useAgents } from '../../hooks/useAgents';
import { useAgentPerformance, useAgentActivity } from '../../hooks/useAnalytics';
import type { AgentPerformance } from '../../services/api/analytics';
import { cn } from '../../lib/utils';

const POLLING_INTERVAL = 5000;

// Map API data to monitor format, using analytics for performance enrichment
function mapToMonitorData(
  agent: { id: string; name: string; squad: string; tier: number },
  perfLookup: Map<string, AgentPerformance>
): AgentMonitorData {
  const perf = perfLookup.get(agent.id);
  const modelMap: Record<number, string> = { 0: 'opus', 1: 'sonnet', 2: 'haiku' };

  return {
    id: agent.id,
    name: agent.name,
    status: 'idle',
    phase: '',
    progress: 0,
    story: '',
    lastActivity: perf?.lastActive || '-',
    model: modelMap[agent.tier] ?? 'sonnet',
    squad: agent.squad,
    totalExecutions: perf?.totalExecutions,
    successRate: perf?.successRate,
    avgResponseTime: perf?.avgDuration,
  };
}

export default function AgentsMonitor() {
  const [isLive, setIsLive] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { data: apiAgents, refetch, isLoading } = useAgents(undefined, {
    refetchInterval: isLive ? POLLING_INTERVAL : false,
  });

  const { data: perfData } = useAgentPerformance();
  const { data: activityData } = useAgentActivity();

  // Build analytics performance lookup
  const perfLookup = useMemo(
    () => new Map((perfData || []).map((p) => [p.agentId, p])),
    [perfData]
  );

  // Map API agents with analytics enrichment
  const agents: AgentMonitorData[] = useMemo(() => {
    if (apiAgents && apiAgents.length > 0) {
      return apiAgents.map((a) => mapToMonitorData(a, perfLookup));
    }
    return [];
  }, [apiAgents, perfLookup]);

  const activeAgents = agents.filter(
    (a) => a.status === 'working' || a.status === 'waiting' || a.status === 'error'
  );
  const standbyAgents = agents.filter((a) => a.status === 'idle');

  const activity = activityData || [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCardClick = useCallback((agentId: string) => {
    setSelectedAgentId((prev) => (prev === agentId ? null : agentId));
  }, []);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary">Agent Activity</h1>
          <Badge variant="status" status="online" size="sm">
            {activeAgents.length}/{agents.length} active
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton
            size="sm"
            variant={isLive ? 'primary' : 'default'}
            leftIcon={
              isLive ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )
            }
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Live' : 'Paused'}
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            leftIcon={
              <RefreshCw
                className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')}
              />
            }
            onClick={handleRefresh}
          >
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Performance Stats */}
      <AgentPerformanceStats agents={agents} />

      {/* Active Section */}
      <section>
        <SectionLabel count={activeAgents.length}>Active Agents</SectionLabel>
        <AnimatePresence mode="popLayout">
          {activeAgents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeAgents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                >
                  <AgentMonitorCard
                    agent={agent}
                    onClick={() => handleCardClick(agent.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-subtle rounded-glass p-8 text-center"
            >
              <Moon className="h-8 w-8 text-tertiary mx-auto mb-2" />
              <p className="text-sm text-secondary">
                Nenhum agente ativo no momento
              </p>
              <p className="text-[10px] text-tertiary mt-1">
                Ative via CLI: @agent-name
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Standby Section */}
      <section>
        <SectionLabel count={standbyAgents.length}>Standby</SectionLabel>
        {standbyAgents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {standbyAgents.map((agent) => (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleCardClick(agent.id)}
                className={cn(
                  'glass-subtle rounded-xl px-3 py-2 flex items-center gap-2',
                  'text-xs text-secondary transition-all duration-150',
                  'hover:bg-white/[0.03] hover:text-primary',
                  selectedAgentId === agent.id &&
                    'ring-1 ring-cyan-500/30 bg-white/[0.03]',
                )}
              >
                <StatusDot status="idle" size="sm" />
                <span className="font-medium">{agent.name}</span>
                {agent.model && (
                  <span className="text-[9px] text-tertiary">
                    ({agent.model})
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          !isLoading &&
          agents.length === 0 && (
            <div className="glass-subtle rounded-glass p-6 text-center">
              <Bot className="h-8 w-8 text-tertiary mx-auto mb-2" />
              <p className="text-sm text-secondary">Nenhum agente encontrado</p>
            </div>
          )
        )}
      </section>

      {/* Activity Timeline */}
      <section>
        <SectionLabel
          count={
            selectedAgentId
              ? activity.filter((e) => e.agentId === selectedAgentId).length
              : activity.length
          }
        >
          {selectedAgentId
            ? `Atividade: @${selectedAgentId}`
            : 'Atividade Recente'}
        </SectionLabel>
        <AgentActivityTimeline
          entries={activity}
          agentFilter={selectedAgentId}
        />
      </section>

      {/* Footer: polling indicator */}
      <div className="mt-auto pt-2 text-center">
        <span className="text-[11px] text-tertiary">
          {isLoading ? 'Carregando...' : 'Atualizado'}
          {isLive && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              polling a cada {POLLING_INTERVAL / 1000}s
            </span>
          )}
          {!isLive && (
            <span className="ml-2 text-yellow-500">pausado</span>
          )}
        </span>
      </div>
    </div>
  );
}
