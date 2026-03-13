import { useState, useCallback, useMemo } from 'react';
import { Bot, Play, Pause, RefreshCw, Moon, FlaskConical, Radio } from 'lucide-react';
import { CockpitButton, Badge, StatusDot, SectionLabel } from '../ui';
import { AgentMonitorCard, type AgentMonitorData } from './AgentMonitorCard';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { AgentPerformanceStats } from './AgentPerformanceStats';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useAgents } from '../../hooks/useAgents';
import { useAgentPerformance, useAgentActivity } from '../../hooks/useAnalytics';
import type { AgentPerformance } from '../../services/api/analytics';
import type { AgentActivityEntry } from '../../types';
import { cn } from '../../lib/utils';
import { aiosRegistry } from '../../data/aios-registry.generated';

const POLLING_INTERVAL = 10_000;

// ---------------------------------------------------------------------------
// Demo fallback data – only used when ALL data sources fail
// ---------------------------------------------------------------------------

const DEMO_STATES: Array<{ status: AgentMonitorData['status']; phase: string; progress: number; story: string }> = [
  { status: 'working', phase: 'Implementing Story 3.2', progress: 65, story: 'STORY-3.2' },
  { status: 'working', phase: 'Writing tests', progress: 40, story: 'STORY-3.2' },
  { status: 'idle', phase: '', progress: 0, story: '' },
  { status: 'working', phase: 'Creating Story 3.3', progress: 20, story: 'EPIC-3' },
  { status: 'error', phase: 'QA Gate failed', progress: 85, story: 'STORY-3.1' },
  { status: 'idle', phase: '', progress: 0, story: '' },
  { status: 'working', phase: 'Component audit', progress: 80, story: 'STORY-DS-1.4' },
  { status: 'idle', phase: '', progress: 0, story: '' },
];

function buildDemoAgents(): AgentMonitorData[] {
  return aiosRegistry.agents.map((agent, i) => {
    const state = DEMO_STATES[i % DEMO_STATES.length];
    return {
      id: agent.id,
      name: `${agent.name} (${agent.title.split(' ')[0]})`,
      status: state.status,
      phase: state.phase,
      progress: state.progress,
      story: state.story,
      lastActivity: new Date(Date.now() - (i + 1) * 120_000).toISOString(),
      model: i % 3 === 0 ? 'opus' : i % 3 === 1 ? 'sonnet' : 'haiku',
      squad: 'aios-core',
      totalExecutions: Math.floor(Math.random() * 150) + 20,
      successRate: Math.floor(Math.random() * 10) + 90,
      avgResponseTime: Math.floor(Math.random() * 2000) + 800,
    };
  });
}

const DEMO_ACTIONS: Array<{ action: string; status: 'success' | 'error'; duration: number }> = [
  { action: 'Committed feat: implement agent monitor cards [Story 3.2]', status: 'success', duration: 4500 },
  { action: 'Running unit tests for AgentMonitorCard', status: 'success', duration: 12300 },
  { action: 'QA Gate — accessibility check failed (missing aria-labels)', status: 'error', duration: 8700 },
  { action: 'Created draft for Story 3.3: Agent Performance Dashboard', status: 'success', duration: 3200 },
  { action: 'Refactored useAgents hook to support polling interval', status: 'success', duration: 6100 },
  { action: 'Auditing CockpitCard component for token compliance', status: 'success', duration: 5400 },
  { action: 'Approved architecture for analytics service layer', status: 'success', duration: 15200 },
  { action: 'QA Gate — Story 3.1 lint & typecheck passed', status: 'success', duration: 9800 },
  { action: 'Updated Epic 3 execution plan with revised estimates', status: 'success', duration: 4100 },
  { action: 'Deployed staging build v0.4.2 via CI/CD pipeline', status: 'success', duration: 22400 },
];

const DEMO_ACTIVITY_AGENT_INDICES = [4, 8, 8, 10, 4, 11, 2, 8, 6, 5];

function buildDemoActivity(): AgentActivityEntry[] {
  return DEMO_ACTIONS.map((entry, i) => ({
    id: `demo-act-${i + 1}`,
    agentId: aiosRegistry.agents[DEMO_ACTIVITY_AGENT_INDICES[i] % aiosRegistry.agents.length]?.id || 'dev',
    timestamp: new Date(Date.now() - (i + 1) * 60_000 * (i + 1)).toISOString(),
    action: entry.action,
    status: entry.status,
    duration: entry.duration,
  }));
}

// ---------------------------------------------------------------------------
// Map legacy API data to monitor format (used as secondary enrichment)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentsMonitor() {
  const [isLive, setIsLive] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // ---- Primary data source: log-based agent status ----
  const {
    agents: statusAgents,
    activity: statusActivity,
    loading: statusLoading,
    isDemo: statusIsDemo,
    refetch: statusRefetch,
  } = useAgentStatus({
    pollInterval: POLLING_INTERVAL,
    enabled: isLive,
  });

  // ---- Secondary data sources: legacy API + analytics (enrichment) ----
  const { data: apiAgents } = useAgents(undefined, {
    refetchInterval: isLive ? POLLING_INTERVAL : false,
  });
  const { data: perfData } = useAgentPerformance();
  const { data: activityData } = useAgentActivity();

  // Build performance lookup from analytics API
  const perfLookup = useMemo(
    () => new Map((perfData || []).map((p) => [p.agentId, p])),
    [perfData]
  );

  // ---- Determine data source priority ----
  // Priority 1: Live log-based status (useAgentStatus)
  // Priority 2: Legacy API agents + analytics enrichment
  // Priority 3: Demo fallback

  const hasLiveData = !statusIsDemo && statusAgents.length > 0;
  const hasApiData = apiAgents && apiAgents.length > 0;
  const isDemo = !hasLiveData && !hasApiData;
  const isLoading = statusLoading;

  const agents: AgentMonitorData[] = useMemo(() => {
    if (hasLiveData) {
      // Enrich live status with analytics performance data if available
      return statusAgents.map((agent) => {
        const perf = perfLookup.get(agent.id);
        if (perf) {
          return {
            ...agent,
            totalExecutions: perf.totalExecutions ?? agent.totalExecutions,
            successRate: perf.successRate ?? agent.successRate,
            avgResponseTime: perf.avgDuration ?? agent.avgResponseTime,
          };
        }
        return agent;
      });
    }

    if (hasApiData) {
      return apiAgents.map((a) => mapToMonitorData(a, perfLookup));
    }

    // Fallback to demo data
    return buildDemoAgents();
  }, [hasLiveData, hasApiData, statusAgents, apiAgents, perfLookup]);

  const activeAgents = agents.filter(
    (a) => a.status === 'working' || a.status === 'waiting' || a.status === 'error'
  );
  const standbyAgents = agents.filter((a) => a.status === 'idle');

  // Activity: prefer live, then API, then demo
  const activity = useMemo(() => {
    if (hasLiveData && statusActivity.length > 0) return statusActivity;
    if (activityData && activityData.length > 0) return activityData;
    if (isDemo) return buildDemoActivity();
    return [];
  }, [hasLiveData, statusActivity, activityData, isDemo]);

  const handleRefresh = useCallback(() => {
    statusRefetch();
  }, [statusRefetch]);

  const handleCardClick = useCallback((agentId: string) => {
    setSelectedAgentId((prev) => (prev === agentId ? null : agentId));
  }, []);

  // Source label for footer
  const sourceLabel = hasLiveData ? 'LIVE' : hasApiData ? 'API' : 'DEMO';

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="heading-display text-xl font-semibold text-primary type-h2">Agent Activity</h1>
          <Badge variant="status" status="online" size="sm">
            {activeAgents.length}/{agents.length} active
          </Badge>
          {hasLiveData && (
            <Badge
              variant="default"
              size="sm"
              className="flex items-center gap-1 text-[var(--color-status-success)] bg-[var(--color-status-success)]/10"
            >
              <Radio className="h-3 w-3" />
              Live
            </Badge>
          )}
          {isDemo && (
            <Badge
              variant="default"
              size="sm"
              className="flex items-center gap-1 text-[var(--bb-warning)] bg-[var(--bb-warning)]/10"
            >
              <FlaskConical className="h-3 w-3" />
              Demo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CockpitButton
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
          </CockpitButton>
          <CockpitButton
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
          </CockpitButton>
        </div>
      </div>

      {/* Performance Stats */}
      <AgentPerformanceStats agents={agents} />

      {/* Active Section */}
      <section>
        <SectionLabel count={activeAgents.length}>Active Agents</SectionLabel>
        {activeAgents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeAgents.map((agent, i) => (
                <div
                  key={`${agent.squad}-${agent.id}`}
                >
                  <AgentMonitorCard
                    agent={agent}
                    onClick={() => handleCardClick(agent.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="glass-subtle rounded-glass p-8 text-center"
            >
              <Moon className="h-8 w-8 text-tertiary mx-auto mb-2" />
              <p className="text-sm text-secondary">
                Nenhum agente ativo no momento
              </p>
              <p className="text-[10px] text-tertiary mt-1">
                Ative via CLI: @agent-name
              </p>
            </div>
          )}
</section>

      {/* Standby Section */}
      <section>
        <SectionLabel count={standbyAgents.length}>Standby</SectionLabel>
        {standbyAgents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {standbyAgents.map((agent) => (
              <button
                key={`${agent.squad}-${agent.id}`}
                onClick={() => handleCardClick(agent.id)}
                className={cn(
                  'glass-subtle rounded-none px-3 py-2 flex items-center gap-2',
                  'text-xs text-secondary transition-all duration-150',
                  'hover:bg-white/[0.03] hover:text-primary',
                  selectedAgentId === agent.id &&
                    'ring-1 ring-[var(--aiox-lime)]/30 bg-white/[0.03]',
                )}
              >
                <StatusDot status="idle" size="sm" />
                <span className="font-medium">{agent.name}</span>
                {agent.model && (
                  <span className="text-[9px] text-tertiary">
                    ({agent.model})
                  </span>
                )}
              </button>
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

      {/* Footer: polling indicator + source */}
      <div className="mt-auto pt-2 text-center">
        <span className="text-[11px] text-tertiary">
          {isLoading ? 'Carregando...' : 'Atualizado'}
          {isLive && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full animate-pulse',
                  hasLiveData ? 'bg-[var(--color-status-success)]' : 'bg-[var(--bb-warning)]',
                )}
              />
              polling a cada {POLLING_INTERVAL / 1000}s
            </span>
          )}
          {!isLive && (
            <span className="ml-2 text-[var(--bb-warning)]">pausado</span>
          )}
          <span className="ml-2 text-tertiary/60">
            [{sourceLabel}]
          </span>
        </span>
      </div>
    </div>
  );
}
