import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type LucideIcon,
  BarChart3,
  Bot,
  PlugZap,
  DollarSign,
  Settings,
  Package,
  Zap,
  Link,
  Wrench,
  Monitor as MonitorIcon,
  Timer,
  Signal,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { GlassCard, Badge, GlassButton } from '../ui';
import { ICON_SIZES } from '../../lib/icons';
import { LiveMetricCard } from './LiveMetricCard';
import { useSquads } from '../../hooks/useSquads';
import { useAgents } from '../../hooks/useAgents';
import { useExecutionHistory, useTokenUsage, useLLMHealth } from '../../hooks/useExecute';
import {
  useCostSummary,
  useAgentAnalytics,
  useCommandAnalytics,
  useMCPStatus,
  useMCPStats,
  useSystemHealth,
  useSystemMetrics,
} from '../../hooks/useDashboard';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import { LineChart, BarChart, DonutChart, ProgressRing } from './Charts';
import { WidgetCustomizer } from './WidgetCustomizer';

// Icons
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const PlugIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

type TabType = 'overview' | 'agents' | 'mcp' | 'costs' | 'system';

export function DashboardOverview({ viewToggle }: { viewToggle?: React.ReactNode } = {}) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'mcp', label: 'MCP & Tools', icon: PlugZap },
    { id: 'costs', label: 'Custos', icon: DollarSign },
    { id: 'system', label: 'Sistema', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
            <p className="text-secondary text-sm mt-0.5">
              Analytics do AIOS Core Platform
            </p>
          </div>
          {viewToggle}
        </div>
        <div className="flex items-center gap-2">
          <WidgetCustomizer />
          <GlassButton variant="ghost" size="sm" leftIcon={<RefreshIcon />}>
            Atualizar
          </GlassButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 glass-subtle rounded-xl mb-4 flex-shrink-0 overflow-x-auto" role="tablist" aria-label="Abas do painel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'glass text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            )}
          >
            <tab.icon size={ICON_SIZES.md} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" />}
          {activeTab === 'agents' && <AgentsTab key="agents" />}
          {activeTab === 'mcp' && <MCPTab key="mcp" />}
          {activeTab === 'costs' && <CostsTab key="costs" />}
          {activeTab === 'system' && <SystemTab key="system" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Tab
// Skeleton for the overview tab
function OverviewSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-6"
    >
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white/5 space-y-3 shimmer"
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
        <div className="lg:col-span-2 p-4 rounded-xl bg-white/5 shimmer" style={{ animationDelay: '400ms' }}>
          <div className="w-40 h-5 rounded bg-white/10 mb-4" />
          <div className="w-full h-48 rounded bg-white/5" />
        </div>
        <div className="p-4 rounded-xl bg-white/5 shimmer" style={{ animationDelay: '500ms' }}>
          <div className="w-32 h-5 rounded bg-white/10 mb-4" />
          <div className="w-full h-48 rounded bg-white/5 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 shimmer" style={{ animationDelay: `${600 + i * 100}ms` }}>
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
    </motion.div>
  );
}

function OverviewTab() {
  const { data: squads } = useSquads();
  const { data: agents } = useAgents();
  const { data: historyData } = useExecutionHistory(100);
  const { data: tokenUsage } = useTokenUsage();
  const { data: llmHealth } = useLLMHealth();
  const { data: mcpStats } = useMCPStats();

  // Show skeleton only during initial load — never block forever
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => { const t = setTimeout(() => setInitialLoad(false), 1500); return () => clearTimeout(t); }, []);
  const isLoading = initialLoad && !squads && !agents && !historyData;

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-6"
    >
      {/* Live Metric Cards — stagger entrance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          <LiveMetricCard
            key="squads"
            label="Squads"
            value={squads?.length || 0}
            icon={<Package size={14} className="text-blue-400" />}
            color="#3B82F6"
            sparkline={executionTrend}
          />,
          <LiveMetricCard
            key="agents"
            label="Agents"
            value={agents?.length || 0}
            icon={<Bot size={14} className="text-emerald-400" />}
            color="#10B981"
            trend="up"
            trendValue="Online"
            isLive
          />,
          <LiveMetricCard
            key="exec"
            label="Execuções"
            value={executions.length}
            icon={<Zap size={14} className="text-purple-400" />}
            color="#8B5CF6"
            sparkline={executionTrend}
            trend={executionTrend[6] > executionTrend[5] ? 'up' : executionTrend[6] < executionTrend[5] ? 'down' : 'flat'}
            trendValue={executionTrend[6] > 0 ? `${executionTrend[6]} hoje` : undefined}
          />,
          <LiveMetricCard
            key="success"
            label="Sucesso"
            value={successRate}
            format="percent"
            icon={<CheckCircle size={14} style={{ color: successRate >= 90 ? '#10B981' : successRate >= 70 ? '#F59E0B' : '#EF4444' }} />}
            color={successRate >= 90 ? '#10B981' : successRate >= 70 ? '#F59E0B' : '#EF4444'}
            trend={successRate >= 90 ? 'up' : successRate >= 70 ? 'flat' : 'down'}
          />,
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.08, ease: [0, 0, 0.2, 1] }}
          >
            {card}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Execution Trend */}
        <GlassCard className="lg:col-span-2">
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
        </GlassCard>

        {/* Status Distribution */}
        <GlassCard>
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
        </GlassCard>
      </div>

      {/* Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthCard
          title="LLMs"
          status={llmHealth?.claude.available && llmHealth?.openai.available ? 'healthy' : 'partial'}
          details={[
            { label: 'Claude', ok: llmHealth?.claude.available ?? false },
            { label: 'OpenAI', ok: llmHealth?.openai.available ?? false },
          ]}
        />
        <HealthCard
          title="MCP Servers"
          status={mcpStats && mcpStats.connectedServers > 0 ? 'healthy' : 'error'}
          details={[
            { label: 'Conectados', value: mcpStats?.connectedServers || 0 },
            { label: 'Tools', value: mcpStats?.totalTools || 0 },
          ]}
        />
        <HealthCard
          title="Tokens"
          status="healthy"
          details={[
            { label: 'Total', value: formatNumber((tokenUsage?.total.input ?? 0) + (tokenUsage?.total.output ?? 0)) },
            { label: 'Requests', value: tokenUsage?.total.requests ?? 0 },
          ]}
        />
      </div>
    </motion.div>
  );
}

// Agents Tab
// Demo fallback data for AgentsTab
const DEMO_AGENT_ANALYTICS = [
  { agentId: 'dev-agent', agentName: 'Dex (Dev)', squad: 'core-squad', totalExecutions: 24, successRate: 95, avgResponseTime: 1.2 },
  { agentId: 'qa-agent', agentName: 'Quinn (QA)', squad: 'core-squad', totalExecutions: 18, successRate: 100, avgResponseTime: 0.8 },
  { agentId: 'architect-agent', agentName: 'Aria (Architect)', squad: 'core-squad', totalExecutions: 12, successRate: 92, avgResponseTime: 2.1 },
  { agentId: 'pm-agent', agentName: 'Morgan (PM)', squad: 'management-squad', totalExecutions: 9, successRate: 88, avgResponseTime: 1.5 },
];

const DEMO_COMMAND_ANALYTICS = [
  { command: '*develop', totalCalls: 32, avgDuration: 4.2, successRate: 94 },
  { command: '*qa-gate', totalCalls: 18, avgDuration: 2.1, successRate: 100 },
  { command: '*create-story', totalCalls: 14, avgDuration: 1.8, successRate: 92 },
  { command: '*validate', totalCalls: 11, avgDuration: 1.2, successRate: 96 },
  { command: '*push', totalCalls: 8, avgDuration: 3.5, successRate: 87 },
];

function AgentsTab() {
  const { data: rawAgentAnalytics } = useAgentAnalytics();
  const { data: rawCommandAnalytics } = useCommandAnalytics();
  const { setCurrentView, setSelectedAgentId } = useUIStore();

  const agentAnalytics = rawAgentAnalytics || DEMO_AGENT_ANALYTICS;
  const commandAnalytics = rawCommandAnalytics || DEMO_COMMAND_ANALYTICS;

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
          {agentAnalytics.length === 0 && (
            <p className="text-center text-tertiary py-8">Nenhum dado de execução disponível</p>
          )}
        </div>
      </GlassCard>

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
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

// Demo fallback data for MCPTab
const DEMO_MCP_SERVERS = [
  { name: 'context7', status: 'connected' as const, toolCount: 2, tools: [{ name: 'resolve-library-id', calls: 12 }, { name: 'get-library-docs', calls: 8 }], resources: [], error: undefined },
  { name: 'playwright', status: 'connected' as const, toolCount: 5, tools: [{ name: 'navigate', calls: 15 }, { name: 'screenshot', calls: 7 }, { name: 'click', calls: 4 }], resources: [], error: undefined },
  { name: 'exa-search', status: 'disconnected' as const, toolCount: 1, tools: [{ name: 'web_search', calls: 0 }], resources: [], error: 'Connection timed out' },
];

const DEMO_MCP_STATS = {
  totalServers: 3,
  connectedServers: 2,
  totalTools: 8,
  totalToolCalls: 46,
  topTools: [
    { name: 'navigate', calls: 15 },
    { name: 'resolve-library-id', calls: 12 },
    { name: 'get-library-docs', calls: 8 },
    { name: 'screenshot', calls: 7 },
    { name: 'click', calls: 4 },
  ],
};

// MCP Tab
function MCPTab() {
  const { data: rawMcpServers } = useMCPStatus();
  const { data: rawMcpStats } = useMCPStats();

  const mcpServers = rawMcpServers || DEMO_MCP_SERVERS;
  const mcpStats = rawMcpStats || DEMO_MCP_STATS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-6"
    >
      {/* MCP Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStatCard label="Servidores" value={mcpStats?.totalServers || 0} icon={MonitorIcon} color="blue" />
        <QuickStatCard label="Conectados" value={mcpStats?.connectedServers || 0} icon={Link} color="green" />
        <QuickStatCard label="Tools" value={mcpStats?.totalTools || 0} icon={Wrench} color="purple" />
        <QuickStatCard label="Chamadas" value={mcpStats?.totalToolCalls || 0} icon={Zap} color="orange" />
      </div>

      {/* Server List */}
      <GlassCard>
        <h2 className="font-semibold text-primary mb-4">Servidores MCP</h2>
        <div className="space-y-3">
          {mcpServers?.map((server) => (
            <div
              key={server.name}
              className={cn(
                'p-4 rounded-xl border',
                server.status === 'connected'
                  ? 'glass-subtle border-green-500/20'
                  : 'glass-subtle border-red-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center',
                    server.status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  )}>
                    <PlugIcon />
                  </div>
                  <div>
                    <p className="text-primary font-medium">{server.name}</p>
                    <p className="text-xs text-tertiary">
                      {server.toolCount || server.tools.length} tools
                      {server.resources.length > 0 && ` • ${server.resources.length} resources`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="status"
                  status={server.status === 'connected' ? 'online' : 'offline'}
                  size="sm"
                >
                  {server.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>

              {server.status === 'connected' && server.tools.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {server.tools.map((tool) => (
                    <span
                      key={tool.name}
                      className="px-2 py-1 rounded-lg text-xs bg-white/5 text-secondary"
                    >
                      {tool.name} ({tool.calls})
                    </span>
                  ))}
                </div>
              )}

              {server.error && (
                <p className="text-xs text-red-400 mt-2">{server.error}</p>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Top Tools */}
      <GlassCard>
        <h2 className="font-semibold text-primary mb-4">Tools Mais Usadas</h2>
        {mcpStats?.topTools && mcpStats.topTools.length > 0 ? (
          <BarChart
            data={mcpStats.topTools.map(t => ({
              label: t.name,
              value: t.calls,
            }))}
            horizontal
            height={180}
          />
        ) : (
          <p className="text-center text-tertiary py-8">Nenhuma tool utilizada ainda</p>
        )}
      </GlassCard>
    </motion.div>
  );
}

// Demo fallback data for CostsTab
const DEMO_COST_SUMMARY = {
  today: 1.24,
  thisWeek: 8.75,
  thisMonth: 32.40,
  byProvider: { claude: 24.80, openai: 7.60 },
  bySquad: { 'core-squad': 18.50, 'management-squad': 9.20, 'design-squad': 4.70 },
  trend: [3.20, 4.10, 5.80, 4.50, 6.20, 5.40, 3.20],
};

const DEMO_TOKEN_USAGE = {
  total: { input: 245000, output: 182000, requests: 156 },
  claude: { input: 180000, output: 135000, requests: 98 },
  openai: { input: 65000, output: 47000, requests: 58 },
};

// Costs Tab
function CostsTab() {
  const { data: rawCostSummary } = useCostSummary();
  const { data: rawTokenUsage } = useTokenUsage();

  const costSummary = rawCostSummary || DEMO_COST_SUMMARY;
  const tokenUsage = rawTokenUsage || DEMO_TOKEN_USAGE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-6"
    >
      {/* Cost Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <p className="text-sm text-secondary mb-1">Hoje</p>
          <p className="text-3xl font-bold text-primary">${costSummary?.today.toFixed(2) || '0.00'}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
            <TrendUpIcon />
            <span>Estimativa</span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <p className="text-sm text-secondary mb-1">Esta Semana</p>
          <p className="text-3xl font-bold text-primary">${costSummary?.thisWeek.toFixed(2) || '0.00'}</p>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <p className="text-sm text-secondary mb-1">Este Mês</p>
          <p className="text-3xl font-bold text-primary">${costSummary?.thisMonth.toFixed(2) || '0.00'}</p>
        </GlassCard>
      </div>

      {/* Cost by Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <h2 className="font-semibold text-primary mb-4">Custo por Provider</h2>
          <div className="space-y-4">
            <CostProviderRow
              name="Claude (Anthropic)"
              cost={costSummary?.byProvider.claude || 0}
              tokens={(tokenUsage?.claude.input ?? 0) + (tokenUsage?.claude.output ?? 0)}
              color="purple"
            />
            <CostProviderRow
              name="OpenAI"
              cost={costSummary?.byProvider.openai || 0}
              tokens={(tokenUsage?.openai.input ?? 0) + (tokenUsage?.openai.output ?? 0)}
              color="green"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="font-semibold text-primary mb-4">Trend de Custos (7 dias)</h2>
          {costSummary?.trend && (
            <LineChart
              data={costSummary.trend}
              labels={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']}
              height={140}
              showLabels
            />
          )}
        </GlassCard>
      </div>

      {/* Cost by Squad */}
      <GlassCard>
        <h2 className="font-semibold text-primary mb-4">Custo por Squad</h2>
        {costSummary?.bySquad && Object.keys(costSummary.bySquad).length > 0 ? (
          <BarChart
            data={Object.entries(costSummary.bySquad)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([squad, cost]) => ({
                label: squad.split('-')[0] || squad,
                value: Math.round(cost * 100) / 100,
              }))}
            horizontal
            height={200}
          />
        ) : (
          <p className="text-center text-tertiary py-8">Nenhum dado de custo por squad</p>
        )}
      </GlassCard>
    </motion.div>
  );
}

// Demo fallback data for SystemTab
const DEMO_HEALTH = {
  api: { healthy: true, latency: 45 },
  database: { healthy: true, latency: 12 },
};

const DEMO_METRICS = {
  uptime: 259200,
  avgLatency: 85,
  requestsPerMinute: 4.2,
  errorRate: 0.8,
  queueSize: 0,
  activeConnections: 3,
};

const DEMO_LLM_HEALTH = {
  claude: { available: true, error: undefined },
  openai: { available: false, error: 'API key not configured' },
};

// System Tab
function SystemTab() {
  const { data: rawHealth } = useSystemHealth();
  const { data: rawMetrics } = useSystemMetrics();
  const { data: rawLlmHealth } = useLLMHealth();

  const health = rawHealth || DEMO_HEALTH;
  const metrics = rawMetrics || DEMO_METRICS;
  const llmHealth = rawLlmHealth || DEMO_LLM_HEALTH;

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-6"
    >
      {/* System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStatCard
          label="Uptime"
          value={metrics ? formatUptime(metrics.uptime) : '-'}
          icon={Timer}
          color="green"
        />
        <QuickStatCard
          label="Latência"
          value={metrics ? `${metrics.avgLatency.toFixed(0)}ms` : '-'}
          icon={Signal}
          color="blue"
        />
        <QuickStatCard
          label="Req/min"
          value={metrics ? metrics.requestsPerMinute.toFixed(1) : '-'}
          icon={TrendingUp}
          color="purple"
        />
        <QuickStatCard
          label="Erros"
          value={metrics ? `${metrics.errorRate.toFixed(1)}%` : '-'}
          icon={AlertTriangle}
          color={metrics && metrics.errorRate < 5 ? 'green' : 'red'}
        />
      </div>

      {/* Health Status */}
      <GlassCard>
        <h2 className="font-semibold text-primary mb-4">Status dos Serviços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceHealthCard
            name="API Gateway"
            healthy={health?.api.healthy ?? true}
            latency={health?.api.latency ?? 0}
          />
          <ServiceHealthCard
            name="Database"
            healthy={health?.database.healthy ?? true}
            latency={health?.database.latency ?? 0}
          />
          <ServiceHealthCard
            name="Claude API"
            healthy={llmHealth?.claude.available ?? false}
            error={llmHealth?.claude.error}
          />
          <ServiceHealthCard
            name="OpenAI API"
            healthy={llmHealth?.openai.available ?? false}
            error={llmHealth?.openai.error}
          />
        </div>
      </GlassCard>

      {/* System Info */}
      <GlassCard>
        <h2 className="font-semibold text-primary mb-4">Informações do Sistema</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl glass-subtle">
            <p className="text-xs text-tertiary mb-1">Fila de Execução</p>
            <p className="text-xl font-semibold text-primary">{metrics?.queueSize ?? 0} tarefas</p>
          </div>
          <div className="p-3 rounded-xl glass-subtle">
            <p className="text-xs text-tertiary mb-1">Conexões Ativas</p>
            <p className="text-xl font-semibold text-primary">{metrics?.activeConnections ?? 0}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Helper Components
function QuickStatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 border-blue-500/30',
    green: 'from-green-500/20 border-green-500/30',
    purple: 'from-purple-500/20 border-purple-500/30',
    orange: 'from-orange-500/20 border-orange-500/30',
    yellow: 'from-yellow-500/20 border-yellow-500/30',
    red: 'from-red-500/20 border-red-500/30',
  };

  return (
    <div className={cn(
      'p-4 rounded-xl bg-gradient-to-br to-transparent border',
      colorClasses[color] || colorClasses.blue
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={ICON_SIZES.xl} className="text-secondary" />
        <span className="text-xs text-tertiary uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function HealthCard({ title, status, details }: {
  title: string;
  status: 'healthy' | 'partial' | 'error';
  details: Array<{ label: string; ok?: boolean; value?: string | number }>;
}) {
  const statusColors = {
    healthy: 'border-green-500/30 bg-green-500/5',
    partial: 'border-yellow-500/30 bg-yellow-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <GlassCard className={statusColors[status]}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-primary">{title}</h3>
        <Badge
          variant="status"
          status={status === 'healthy' ? 'online' : status === 'partial' ? 'warning' : 'offline'}
          size="sm"
        >
          {status === 'healthy' ? 'OK' : status === 'partial' ? 'Parcial' : 'Erro'}
        </Badge>
      </div>
      <div className="space-y-2">
        {details.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-secondary">{d.label}</span>
            {d.ok !== undefined ? (
              <span className={d.ok ? 'text-green-400' : 'text-red-400'}>
                {d.ok ? '\u2713' : '\u2717'}
              </span>
            ) : (
              <span className="text-primary font-medium truncate max-w-[120px] text-right">{d.value}</span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function CostProviderRow({ name, cost, tokens, color }: {
  name: string;
  cost: number;
  tokens: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass-subtle">
      <div className="flex items-center gap-3">
        <div className={cn('h-3 w-3 rounded-full', colorClasses[color])} />
        <div>
          <p className="text-primary font-medium">{name}</p>
          <p className="text-xs text-tertiary">{formatNumber(tokens)} tokens</p>
        </div>
      </div>
      <p className="text-xl font-bold text-primary">${cost.toFixed(2)}</p>
    </div>
  );
}

function ServiceHealthCard({ name, healthy, latency, error }: {
  name: string;
  healthy: boolean;
  latency?: number;
  error?: string;
}) {
  const getErrorDisplay = (err?: string): string => {
    if (!err) return 'Indisponível';
    if (err.includes('401')) return 'API key inválida';
    if (err.includes('429')) return 'Rate limit';
    return err.length > 20 ? err.slice(0, 17) + '...' : err;
  };

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      healthy ? 'glass-subtle border-green-500/20' : 'glass-subtle border-red-500/20'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-3 w-3 rounded-full',
            healthy ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="text-primary font-medium">{name}</span>
        </div>
        {healthy && latency !== undefined && (
          <span className="text-xs text-tertiary">{latency.toFixed(0)}ms</span>
        )}
      </div>
      {!healthy && error && (
        <p className="text-xs text-red-400 mt-2">{getErrorDisplay(error)}</p>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
