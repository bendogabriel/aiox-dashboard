import React, { useState, useMemo, useEffect } from 'react';
import { Bot, Zap, CheckCircle, BookOpen, GitBranch } from 'lucide-react';
import { CockpitCard, Badge, Reveal, RevealGroup, RevealItem } from '../ui';
import { LiveMetricCard } from './LiveMetricCard';
import { useSquads } from '../../hooks/useSquads';
import { useAgents } from '../../hooks/useAgents';
import { useExecutionHistory, useTokenUsage, useLLMHealth } from '../../hooks/useExecute';
import { useMCPStats } from '../../hooks/useDashboard';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { LineChart, DonutChart } from './Charts';
import { HealthCard, formatNumber } from './DashboardHelpers';
import { RegistryQuickAccess } from './RegistryQuickAccess';

// Skeleton for the overview tab
export function OverviewSkeleton() {
  return (
    <div
      className="space-y-6 pb-6"
    >
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-none bg-white/5 space-y-3 shimmer"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/10" />
              <div className="w-16 h-3 rounded bg-white/10" />
            </div>
            <div className="w-20 h-7 rounded bg-white/10" />
            <div className="w-full h-6 rounded bg-white/5" />
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-none bg-white/5 shimmer" style={{ animationDelay: '400ms' }}>
          <div className="w-40 h-5 rounded bg-white/10 mb-4" />
          <div className="w-full h-48 rounded bg-white/5" />
        </div>
        <div className="p-4 rounded-none bg-white/5 shimmer" style={{ animationDelay: '500ms' }}>
          <div className="w-32 h-5 rounded bg-white/10 mb-4" />
          <div className="w-full h-48 rounded bg-white/5 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 rounded-none bg-white/5 shimmer" style={{ animationDelay: `${600 + i * 100}ms` }}>
            <div className="w-36 h-5 rounded bg-white/10 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10" />
                  <div className="flex-1 h-3 rounded bg-white/10" />
                  <div className="w-12 h-3 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverviewTab() {
  const { data: squads } = useSquads();
  const { data: agents } = useAgents();
  const { data: historyData } = useExecutionHistory(100);
  const { data: tokenUsage } = useTokenUsage();
  const { data: llmHealth } = useLLMHealth();
  const { data: mcpStats } = useMCPStats();
  const { overview: dashOverview, mcp: dashMcp, loading: dashLoading } = useDashboardOverview();

  // Show skeleton only during initial load — never block forever
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => { const t = setTimeout(() => setInitialLoad(false), 1500); return () => clearTimeout(t); }, []);
  const isLoading = initialLoad && !squads && !agents && !historyData && dashLoading;

  const executions = useMemo(() => historyData?.executions || [], [historyData?.executions]);
  const completedCount = executions.filter(e => e.status === 'completed').length;
  const successRate = executions.length > 0 ? Math.round((completedCount / executions.length) * 100) : 100;

  // Compute real execution trend from history (last 7 days)
  const { executionTrend, trendLabels } = useMemo(() => {
    const now = new Date();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toISOString().split('T')[0], label: dayNames[d.getDay()] };
    });
    const trend = days.map(({ key }) =>
      executions.filter(e => (e.createdAt || '').startsWith(key)).length
    );
    return { executionTrend: trend, trendLabels: days.map(d => d.label) };
  }, [executions]);

  if (isLoading) return <OverviewSkeleton />;

  return (
    <div
      className="space-y-6 pb-6"
    >
      {/* Live Metric Cards — stagger entrance */}
      <RevealGroup className="grid grid-cols-2 sm:grid-cols-4 gap-4" stagger={0.04}>
        <RevealItem direction="up">
          <LiveMetricCard
            label="Agents"
            value={dashOverview?.totalAgents || agents?.length || 0}
            icon={<Bot size={14} className="text-[var(--color-status-success)]" />}
            color="var(--color-status-success)"
            trend="up"
            trendValue="Online"
            isLive
          />
        </RevealItem>
        <RevealItem direction="up">
          <LiveMetricCard
            label="Stories"
            value={dashOverview?.totalStories || 0}
            icon={<BookOpen size={14} className="text-[var(--aiox-blue)]" />}
            color="var(--aiox-blue)"
            sparkline={executionTrend}
          />
        </RevealItem>
        <RevealItem direction="up">
          <LiveMetricCard
            label="Execuções"
            value={dashOverview?.totalExecutions || executions.length}
            icon={<Zap size={14} className="text-[var(--aiox-gray-muted)]" />}
            color="var(--aiox-gray-muted)"
            sparkline={executionTrend}
            trend={executionTrend[6] > executionTrend[5] ? 'up' : executionTrend[6] < executionTrend[5] ? 'down' : 'flat'}
            trendValue={executionTrend[6] > 0 ? `${executionTrend[6]} hoje` : undefined}
          />
        </RevealItem>
        <RevealItem direction="up">
          <LiveMetricCard
            label="Sucesso"
            value={dashOverview?.successRate ?? successRate}
            format="percent"
            icon={<CheckCircle size={14} style={{ color: (dashOverview?.successRate ?? successRate) >= 90 ? 'var(--color-status-success)' : (dashOverview?.successRate ?? successRate) >= 70 ? 'var(--bb-warning)' : 'var(--bb-error)' }} />}
            color={(dashOverview?.successRate ?? successRate) >= 90 ? 'var(--color-status-success)' : (dashOverview?.successRate ?? successRate) >= 70 ? 'var(--bb-warning)' : 'var(--bb-error)'}
            trend={(dashOverview?.successRate ?? successRate) >= 90 ? 'up' : (dashOverview?.successRate ?? successRate) >= 70 ? 'flat' : 'down'}
          />
        </RevealItem>
      </RevealGroup>

      {/* Charts Row */}
      <Reveal direction="up" delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Execution Trend */}
          <CockpitCard className="lg:col-span-2 hud-corner">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary">Execuções (7 dias)</h2>
              <Badge variant="count" size="sm">{executions.length} total</Badge>
            </div>
            <LineChart
              data={executionTrend}
              labels={trendLabels}
              height={160}
              showLabels
            />
          </CockpitCard>

          {/* Status Distribution */}
          <CockpitCard className="hud-corner">
            <h2 className="font-semibold text-primary mb-4">Status</h2>
            <div className="flex justify-center py-2">
              <DonutChart
                data={[
                  { label: 'Sucesso', value: completedCount },
                  { label: 'Falha', value: executions.length - completedCount },
                ]}
                size={120}
                thickness={16}
                centerText={`${successRate}%`}
                centerSubtext="sucesso"
              />
            </div>
          </CockpitCard>
        </div>
      </Reveal>

      {/* Health Row */}
      <Reveal direction="up" delay={0.25}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthCard
          title="LLMs"
          status={llmHealth?.claude?.available && llmHealth?.openai?.available ? 'healthy' : 'partial'}
          details={[
            { label: 'Claude', ok: llmHealth?.claude?.available ?? false },
            { label: 'OpenAI', ok: llmHealth?.openai?.available ?? false },
          ]}
        />
        <HealthCard
          title="MCP Servers"
          status={(dashMcp?.connectedServers ?? mcpStats?.connectedServers ?? 0) > 0 ? 'healthy' : 'error'}
          details={[
            { label: 'Conectados', value: dashMcp?.connectedServers ?? mcpStats?.connectedServers ?? 0 },
            { label: 'Tools', value: dashMcp?.totalTools ?? mcpStats?.totalTools ?? 0 },
          ]}
        />
        <HealthCard
          title="Tokens"
          status="healthy"
          details={[
            { label: 'Total', value: formatNumber((tokenUsage?.total?.input ?? 0) + (tokenUsage?.total?.output ?? 0)) },
            { label: 'Requests', value: tokenUsage?.total?.requests ?? 0 },
          ]}
        />
      </div>
      </Reveal>

      {/* Git Info */}
      {dashOverview && (
        <CockpitCard>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={16} className="text-secondary" />
            <h2 className="font-semibold text-primary">Repositório</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-none glass-subtle">
              <p className="text-xs text-tertiary mb-1">Branch</p>
              <p className="text-sm font-semibold text-primary">{dashOverview.gitBranch}</p>
            </div>
            <div className="p-3 rounded-none glass-subtle">
              <p className="text-xs text-tertiary mb-1">Commits</p>
              <p className="text-sm font-semibold text-primary">{dashOverview.gitCommits}</p>
            </div>
            <div className="p-3 rounded-none glass-subtle">
              <p className="text-xs text-tertiary mb-1">Log Files</p>
              <p className="text-sm font-semibold text-primary">{dashOverview.activeLogFiles}</p>
            </div>
            <div className="p-3 rounded-none glass-subtle">
              <p className="text-xs text-tertiary mb-1">Active Tasks</p>
              <p className="text-sm font-semibold text-primary">{dashOverview.activeExecutions}</p>
            </div>
          </div>
        </CockpitCard>
      )}

      {/* AIOS Registry Quick Access */}
      <RegistryQuickAccess />
    </div>
  );
}
