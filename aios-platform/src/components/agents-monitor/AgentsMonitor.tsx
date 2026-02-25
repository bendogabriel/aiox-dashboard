import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Pause, RefreshCw } from 'lucide-react';
import { GlassButton, Badge, StatusDot, SectionLabel } from '../ui';
import { AgentMonitorCard, type AgentMonitorData } from './AgentMonitorCard';
import { useAgents } from '../../hooks/useAgents';
import { cn } from '../../lib/utils';

// Map API AgentSummary to AgentMonitorData for the monitor view.
// TODO: Agent status (working/idle/waiting) requires a sessions API — defaulting to "idle" for now.
function mapToMonitorData(agent: { id: string; name: string; squad: string; tier: number }): AgentMonitorData {
  return {
    id: agent.id,
    name: agent.name,
    status: 'idle',
    phase: '',
    progress: 0,
    story: '',
    lastActivity: '-',
    model: agent.tier === 3 ? 'opus' : 'sonnet',
  };
}

export default function AgentsMonitor() {
  const [isLive, setIsLive] = useState(true);
  const { data: apiAgents, refetch, isLoading } = useAgents();

  const agents: AgentMonitorData[] = (apiAgents ?? []).map(mapToMonitorData);

  const activeAgents = agents.filter((a) => a.status === 'working' || a.status === 'waiting');
  const standbyAgents = agents.filter((a) => a.status === 'idle');

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
            leftIcon={isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Live' : 'Paused'}
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />}
            onClick={handleRefresh}
          >
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Active Section */}
      <section>
        <SectionLabel count={activeAgents.length}>Active Agents</SectionLabel>
        {activeAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeAgents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <AgentMonitorCard agent={agent} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-subtle rounded-glass p-6 text-center">
            <Bot className="h-8 w-8 text-tertiary mx-auto mb-2" />
            <p className="text-sm text-secondary">No agents currently active</p>
          </div>
        )}
      </section>

      {/* Standby Section */}
      <section>
        <SectionLabel count={standbyAgents.length}>Standby</SectionLabel>
        {standbyAgents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {standbyAgents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'glass-subtle rounded-xl px-3 py-2 flex items-center gap-2',
                  'text-xs text-secondary',
                )}
              >
                <StatusDot status="idle" size="sm" />
                <span className="font-medium">{agent.name}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          !isLoading && agents.length === 0 && (
            <div className="glass-subtle rounded-glass p-6 text-center">
              <Bot className="h-8 w-8 text-tertiary mx-auto mb-2" />
              <p className="text-sm text-secondary">No agents found</p>
            </div>
          )
        )}
      </section>

      {/* Footer: polling indicator */}
      <div className="mt-auto pt-2 text-center">
        <span className="text-[11px] text-tertiary">
          {isLoading ? 'Loading...' : 'Up to date'}
          {isLive && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              live
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
