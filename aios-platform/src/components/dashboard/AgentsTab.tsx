import { CockpitCard, Badge } from '../ui';
import { useAgentAnalytics, useCommandAnalytics } from '../../hooks/useDashboard';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { useUIStore } from '../../stores/uiStore';
import { cn, formatRelativeTime } from '../../lib/utils';
import { BarChart, ProgressRing } from './Charts';
import { TerminalIcon } from './dashboard-icons';
import { Activity, Zap, Clock, Terminal } from 'lucide-react';

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
    <div
      className="space-y-6 pb-6"
    >
      {/* Top Agents */}
      <CockpitCard>
        <h2 className="font-semibold text-primary mb-4">Agents Mais Ativos</h2>
        <div className="space-y-3">
          {agentAnalytics?.slice(0, 8).map((agent, index) => (
            <div
              key={`${agent.squad || index}-${agent.agentId}`}
              onClick={() => handleAgentClick(agent.agentId)}
              className="flex items-center justify-between p-3 rounded-none glass-subtle hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg font-bold text-tertiary w-6">#{index + 1}</span>
                <div className="min-w-0">
                  <p className="text-primary font-medium truncate">{agent.agentName}</p>
                  <p className="type-label text-tertiary">{agent.squad}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-primary font-semibold">{agent.totalExecutions}</p>
                  <p className="type-micro text-tertiary">execuções</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-semibold',
                    agent.successRate >= 90 ? 'text-[var(--color-status-success)]' : agent.successRate >= 70 ? 'text-[var(--bb-warning)]' : 'text-[var(--bb-error)]'
                  )}>
                    {agent.successRate.toFixed(0)}%
                  </p>
                  <p className="type-micro text-tertiary">sucesso</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-secondary font-medium">{agent.avgResponseTime.toFixed(1)}s</p>
                  <p className="type-micro text-tertiary">avg time</p>
                </div>
              </div>
            </div>
          ))}
          {(agentAnalytics?.length ?? 0) === 0 && (
            <p className="text-center text-tertiary py-8">Nenhum dado de execução disponível</p>
          )}
        </div>
      </CockpitCard>

      {/* Agent Cards (enriched with analytics) */}
      {dashAgents && dashAgents.length > 0 && (
        <CockpitCard>
          <h2 className="font-semibold text-primary mb-4">Agent Roster</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashAgents.map((agent) => {
              const analytics = agentAnalytics?.find(a => a.agentId === agent.agentId);
              const topCmd = analytics && 'topCommands' in analytics
                ? (analytics as { topCommands?: { command: string; count: number }[] }).topCommands?.[0]
                : undefined;
              const tokens = analytics && 'avgTokens' in analytics
                ? (analytics as { avgTokens?: number }).avgTokens
                : undefined;

              return (
                <div
                  key={`${agent.squad || 'def'}-${agent.agentId}`}
                  onClick={() => handleAgentClick(agent.agentId)}
                  className={cn(
                    'p-3 rounded-none glass-subtle cursor-pointer hover:bg-white/10 transition-colors',
                    'border-l-2',
                    agent.status === 'active' ? 'border-l-[var(--color-status-success)]' : agent.status === 'idle' ? 'border-l-[var(--bb-warning)]' : 'border-l-[var(--aiox-gray-dim)]',
                  )}
                >
                  {/* Row 1: Name + Status + Model */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
                        agent.status === 'active' ? 'bg-[var(--color-status-success)] shadow-[0_0_4px_var(--color-status-success)]' : agent.status === 'idle' ? 'bg-[var(--bb-warning)]' : 'bg-[var(--aiox-gray-dim)]',
                      )} />
                      <span className="text-sm font-medium text-primary truncate">{agent.agentName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="count" size="sm">{agent.model}</Badge>
                      <span className={cn(
                        'text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5',
                        agent.status === 'active' ? 'text-[var(--color-status-success)] bg-[var(--color-status-success)]/10' : agent.status === 'idle' ? 'text-[var(--bb-warning)] bg-[var(--bb-warning)]/10' : 'text-[var(--aiox-gray-dim)] bg-white/5',
                      )}>
                        {agent.status === 'active' ? 'ATIVO' : agent.status === 'idle' ? 'IDLE' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Role */}
                  <p className="type-label text-tertiary truncate mb-2">{agent.role}</p>

                  {/* Row 3: Metrics bar */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-secondary">
                    {analytics?.totalExecutions != null && analytics.totalExecutions > 0 && (
                      <span className="flex items-center gap-1" title="Execuções">
                        <Zap size={10} className="text-tertiary" />
                        {analytics.totalExecutions}
                      </span>
                    )}
                    {tokens != null && tokens > 0 && (
                      <span className="flex items-center gap-1" title="Avg tokens">
                        <Activity size={10} className="text-tertiary" />
                        {tokens > 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens}
                      </span>
                    )}
                    {topCmd && (
                      <span className="flex items-center gap-1 truncate" title="Top command">
                        <Terminal size={10} className="text-tertiary" />
                        <span className="truncate">{topCmd.command}</span>
                      </span>
                    )}
                  </div>

                  {/* Row 4: Last active */}
                  {agent.lastActive && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-tertiary">
                      <Clock size={9} />
                      <span>{formatRelativeTime(agent.lastActive)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CockpitCard>
      )}

      {/* Command Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CockpitCard>
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
        </CockpitCard>

        <CockpitCard>
          <h2 className="font-semibold text-primary mb-4">Performance por Comando</h2>
          <div className="space-y-3">
            {commandAnalytics?.slice(0, 5).map((cmd) => (
              <div key={cmd.command} className="flex items-center justify-between p-2 rounded-lg glass-subtle">
                <div className="flex items-center gap-2">
                  <TerminalIcon />
                  <span className="text-sm text-primary">{cmd.command}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="type-label text-tertiary">{cmd.avgDuration.toFixed(1)}s</span>
                  <ProgressRing value={cmd.successRate} size={32} thickness={3} />
                </div>
              </div>
            ))}
            {(!commandAnalytics || commandAnalytics.length === 0) && (
              <p className="text-center text-tertiary py-4">Nenhum comando registrado</p>
            )}
          </div>
        </CockpitCard>
      </div>
    </div>
  );
}
