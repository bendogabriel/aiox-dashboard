import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Pause, RefreshCw } from 'lucide-react';
import { GlassButton, Badge, StatusDot, SectionLabel } from '../ui';
import { AgentMonitorCard, type AgentMonitorData } from './AgentMonitorCard';
import { cn } from '../../lib/utils';

// Mock agent data
const mockAgents: AgentMonitorData[] = [
  { id: 'dev', name: 'AIOS Dev', status: 'working', phase: 'coding', progress: 65, story: 'AIOS-42', lastActivity: '2s ago', model: 'sonnet' },
  { id: 'qa', name: 'AIOS QA', status: 'working', phase: 'testing', progress: 30, story: 'AIOS-38', lastActivity: '5s ago', model: 'sonnet' },
  { id: 'architect', name: 'AIOS Architect', status: 'waiting', phase: 'reviewing', progress: 0, story: 'AIOS-45', lastActivity: '1m ago', model: 'opus' },
  { id: 'pm', name: 'AIOS PM', status: 'idle', phase: '', progress: 0, story: '', lastActivity: '15m ago', model: 'sonnet' },
  { id: 'po', name: 'AIOS PO', status: 'idle', phase: '', progress: 0, story: '', lastActivity: '1h ago', model: 'sonnet' },
  { id: 'analyst', name: 'AIOS Analyst', status: 'working', phase: 'planning', progress: 80, story: 'AIOS-41', lastActivity: '10s ago', model: 'sonnet' },
  { id: 'devops', name: 'AIOS DevOps', status: 'idle', phase: '', progress: 0, story: '', lastActivity: '30m ago', model: 'sonnet' },
];

export default function AgentsMonitor() {
  const [isLive, setIsLive] = useState(true);
  const [agents, setAgents] = useState<AgentMonitorData[]>(mockAgents);
  const [lastUpdated, setLastUpdated] = useState(0);

  const activeAgents = agents.filter((a) => a.status === 'working' || a.status === 'waiting');
  const standbyAgents = agents.filter((a) => a.status === 'idle');

  // Polling timer
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 3);
      // In production, this would fetch from the API
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleRefresh = useCallback(() => {
    setLastUpdated(0);
    setAgents([...mockAgents]);
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
            leftIcon={isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Live' : 'Paused'}
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
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
              <span className="text-tertiary">{agent.lastActivity}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer: polling indicator */}
      <div className="mt-auto pt-2 text-center">
        <span className="text-[11px] text-tertiary">
          Last updated {lastUpdated === 0 ? 'just now' : `${lastUpdated}s ago`}
          {isLive && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              polling
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
