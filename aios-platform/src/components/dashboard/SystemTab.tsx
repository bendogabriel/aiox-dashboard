import { Timer, Signal, TrendingUp, AlertTriangle, Cpu, GitBranch } from 'lucide-react';
import { CockpitCard } from '../ui';
import { useSystemHealth, useSystemMetrics } from '../../hooks/useDashboard';
import { useLLMHealth } from '../../hooks/useExecute';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { QuickStatCard, ServiceHealthCard } from './DashboardHelpers';

export function SystemTab() {
  const { data: rawHealth } = useSystemHealth();
  const { data: rawMetrics } = useSystemMetrics();
  const { data: rawLlmHealth } = useLLMHealth();
  const { system: dashSystem } = useDashboardOverview();

  // Prefer analytics-derived data, fall back to unified endpoint, then reasonable defaults
  const health = rawHealth || {
    api: { healthy: true, latency: 0 },
    database: { healthy: true, latency: 0 },
  };

  const metrics = rawMetrics || (dashSystem ? {
    uptime: dashSystem.uptime,
    avgLatency: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    queueSize: 0,
    activeConnections: 0,
  } : { uptime: 0, avgLatency: 0, requestsPerMinute: 0, errorRate: 0, queueSize: 0, activeConnections: 0 });

  const llmHealth = rawLlmHealth || (dashSystem?.llmKeys ? {
    claude: { available: dashSystem.llmKeys.claude, error: dashSystem.llmKeys.claude ? undefined : 'API key not set' },
    openai: { available: dashSystem.llmKeys.openai, error: dashSystem.llmKeys.openai ? undefined : 'API key not set' },
  } : { claude: { available: false, error: 'Unknown' }, openai: { available: false, error: 'Unknown' } });

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div
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
          value={metrics ? `${(metrics.avgLatency ?? 0).toFixed(0)}ms` : '-'}
          icon={Signal}
          color="blue"
        />
        <QuickStatCard
          label="Req/min"
          value={metrics ? (metrics.requestsPerMinute ?? 0).toFixed(1) : '-'}
          icon={TrendingUp}
          color="purple"
        />
        <QuickStatCard
          label="Erros"
          value={metrics ? `${(metrics.errorRate ?? 0).toFixed(1)}%` : '-'}
          icon={AlertTriangle}
          color={metrics && (metrics.errorRate ?? 0) < 5 ? 'green' : 'red'}
        />
      </div>

      {/* Health Status */}
      <CockpitCard>
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
            healthy={llmHealth?.claude?.available ?? false}
            error={llmHealth?.claude?.error}
          />
          <ServiceHealthCard
            name="OpenAI API"
            healthy={llmHealth?.openai?.available ?? false}
            error={llmHealth?.openai?.error}
          />
        </div>
      </CockpitCard>

      {/* System Info */}
      <CockpitCard>
        <h2 className="font-semibold text-primary mb-4">Informações do Sistema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-none glass-subtle">
            <p className="text-xs text-tertiary mb-1">Fila de Execução</p>
            <p className="text-xl font-semibold text-primary">{metrics?.queueSize ?? 0} tarefas</p>
          </div>
          <div className="p-3 rounded-none glass-subtle">
            <p className="text-xs text-tertiary mb-1">Conexões Ativas</p>
            <p className="text-xl font-semibold text-primary">{metrics?.activeConnections ?? 0}</p>
          </div>
          {dashSystem && (
            <>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Node.js</p>
                <p className="text-sm font-semibold text-primary">{dashSystem.nodeVersion}</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Plataforma</p>
                <p className="text-sm font-semibold text-primary truncate" title={dashSystem.platform}>{dashSystem.platform}</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Arch / CPUs</p>
                <p className="text-sm font-semibold text-primary">{dashSystem.arch} / {dashSystem.cpus} cores</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">.aios/ Disk</p>
                <p className="text-sm font-semibold text-primary">{dashSystem.aiosDiskUsage}</p>
              </div>
            </>
          )}
        </div>
      </CockpitCard>

      {/* Git & Memory (from real data) */}
      {dashSystem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CockpitCard>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={16} className="text-secondary" />
              <h2 className="font-semibold text-primary">Git</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Branch</p>
                <p className="text-sm font-semibold text-primary">{dashSystem.gitBranch}</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Status</p>
                <p className="text-sm font-semibold text-primary">{dashSystem.gitDirty ? 'Dirty' : 'Clean'}</p>
              </div>
            </div>
          </CockpitCard>

          <CockpitCard>
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={16} className="text-secondary" />
              <h2 className="font-semibold text-primary">Processo</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Heap Used</p>
                <p className="text-sm font-semibold text-primary">{Math.round(dashSystem.memoryUsage.heapUsed / 1024 / 1024)}MB</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Heap Total</p>
                <p className="text-sm font-semibold text-primary">{Math.round(dashSystem.memoryUsage.heapTotal / 1024 / 1024)}MB ({dashSystem.memoryUsage.heapPercentage}%)</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Total RAM</p>
                <p className="text-sm font-semibold text-primary">{Math.round(dashSystem.totalMemory / 1024 / 1024 / 1024)}GB</p>
              </div>
              <div className="p-3 rounded-none glass-subtle">
                <p className="text-xs text-tertiary mb-1">Free RAM</p>
                <p className="text-sm font-semibold text-primary">{Math.round(dashSystem.freeMemory / 1024 / 1024 / 1024)}GB</p>
              </div>
            </div>
          </CockpitCard>
        </div>
      )}
    </div>
  );
}
