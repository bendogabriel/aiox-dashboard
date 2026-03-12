import { motion } from 'framer-motion';
import { GlassCard, Badge } from '../ui';
import { useAgentAnalytics, useCommandAnalytics } from '../../hooks/useDashboard';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import { BarChart, ProgressRing } from './Charts';
import { TerminalIcon } from './dashboard-icons';

export function AgentsTab() {
  const { data: rawAgentAnalytics } = useAgentAnalytics();
  const { data: rawCommandAnalytics } = useCommandAnalytics();
  const { agents: dashAgents } = useDashboardOverview();
  const { setCurrentView, setSelectedAgentId } = useUIStore();

  // Merge: prefer real analytics from execution history, fall back to filesystem agent data
  const agentAnalytics = (rawAgentAnalytics && rawAgentAnalytics.length > 0)
    ? rawAgentAnalytics
    : (dashAgents || []).map(a => ({
        agentId: a.agentId,
        agentName: a.agentName,
        squad: a.squad || '',
        totalExecutions: a.logLines,
        successRate: a.status === 'active' ? 100 : a.status === 'idle' ? 90 : 0,
        avgResponseTime: 0,
      }));
  const commandAnalytics = rawCommandAnalytics || [];

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    setCurrentView('chat');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-6"
    >
      {/* Top Agents */}
      <GlassCard>
        <h2 className="font-semibold text-primary mb-4">Agents Mais Ativos</h2>
        <div className="space-y-3">
          {agentAnalytics?.slice(0, 8).map((agent, index) => (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleAgentClick(agent.agentId)}
              className="flex items-center justify-between p-3 rounded-xl glass-subtle hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg font-bold text-tertiary w-6">#{index + 1}</span>
                <div className="min-w-0">
                  <p className="text-primary font-medium truncate">{agent.agentName}</p>
                  <p className="text-xs text-tertiary">{agent.squad}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-primary font-semibold">{agent.totalExecutions}</p>
                  <p className="text-[10px] text-tertiary">execuções</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-semibold',
                    agent.successRate >= 90 ? 'text-green-400' : agent.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {agent.successRate.toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-tertiary">sucesso</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-secondary font-medium">{agent.avgResponseTime.toFixed(1)}s</p>
                  <p className="text-[10px] text-tertiary">avg time</p>
                </div>
              </div>
            </motion.div>
          ))}
          {(agentAnalytics?.length ?? 0) === 0 && (
            <p className="text-center text-tertiary py-8">Nenhum dado de execução disponível</p>
          )}
        </div>
      </GlassCard>

      {/* Agent Definitions (from filesystem) */}
      {dashAgents && dashAgents.length > 0 && (
        <GlassCard>
          <h2 className="font-semibold text-primary mb-4">Agent Definitions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashAgents.map((agent) => (
              <div
                key={agent.agentId}
                className="p-3 rounded-xl glass-subtle flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-primary font-medium truncate">{agent.agentName}</p>
                  <p className="text-xs text-tertiary truncate">{agent.role}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="count" size="sm">{agent.model}</Badge>
                  <Badge
                    variant="status"
                    status={agent.status === 'active' ? 'online' : agent.status === 'idle' ? 'warning' : 'offline'}
                    size="sm"
                  >
                    {agent.status === 'active' ? 'Ativo' : agent.status === 'idle' ? 'Idle' : 'Off'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Command Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <h2 className="font-semibold text-primary mb-4">Comandos Mais Usados</h2>
          {commandAnalytics && commandAnalytics.length > 0 ? (
            <BarChart
              data={commandAnalytics.slice(0, 6).map(c => ({
                label: c.command,
                value: c.totalCalls,
              }))}
              horizontal
              height={200}
            />
          ) : (
            <p className="text-center text-tertiary py-8">Nenhum comando registrado</p>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="font-semibold text-primary mb-4">Performance por Comando</h2>
          <div className="space-y-3">
            {commandAnalytics?.slice(0, 5).map((cmd) => (
              <div key={cmd.command} className="flex items-center justify-between p-2 rounded-lg glass-subtle">
                <div className="flex items-center gap-2">
                  <TerminalIcon />
                  <span className="text-sm text-primary">{cmd.command}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-tertiary">{cmd.avgDuration.toFixed(1)}s</span>
                  <ProgressRing value={cmd.successRate} size={32} thickness={3} />
                </div>
              </div>
            ))}
            {(!commandAnalytics || commandAnalytics.length === 0) && (
              <p className="text-center text-tertiary py-4">Nenhum comando registrado</p>
            )}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
