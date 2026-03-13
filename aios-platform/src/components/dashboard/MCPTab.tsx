import { Monitor as MonitorIcon, Link, Wrench, Zap } from 'lucide-react';
import { CockpitCard, Badge } from '../ui';
import { useMCPStatus, useMCPStats } from '../../hooks/useDashboard';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { cn } from '../../lib/utils';
import { BarChart } from './Charts';
import { QuickStatCard } from './DashboardHelpers';
import { PlugIcon } from './dashboard-icons';

export function MCPTab() {
  const { data: rawMcpServers } = useMCPStatus();
  const { data: rawMcpStats } = useMCPStats();
  const { mcp: dashMcp } = useDashboardOverview();

  // Prefer real MCP data from existing hook, fall back to unified endpoint, then empty
  const mcpServers = rawMcpServers || (dashMcp?.servers?.map(s => ({
    ...s,
    resources: [] as Array<{ uri: string; name: string }>,
  }))) || [];

  const mcpStats = rawMcpStats || (dashMcp ? {
    totalServers: dashMcp.totalServers,
    connectedServers: dashMcp.connectedServers,
    totalTools: dashMcp.totalTools,
    totalToolCalls: 0,
    topTools: [] as Array<{ name: string; calls: number }>,
  } : { totalServers: 0, connectedServers: 0, totalTools: 0, totalToolCalls: 0, topTools: [] as Array<{ name: string; calls: number }> });

  return (
    <div
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
      <CockpitCard>
        <h2 className="font-semibold text-primary mb-4">Servidores MCP</h2>
        <div className="space-y-3">
          {mcpServers?.map((server) => (
            <div
              key={server.name}
              className={cn(
                'p-4 rounded-none border',
                server.status === 'connected'
                  ? 'glass-subtle border-[var(--color-status-success)]/20'
                  : 'glass-subtle border-[var(--bb-error)]/20'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-none flex items-center justify-center',
                    server.status === 'connected' ? 'bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]' : 'bg-[var(--bb-error)]/10 text-[var(--bb-error)]'
                  )}>
                    <PlugIcon />
                  </div>
                  <div>
                    <p className="text-primary font-medium">{server.name}</p>
                    <p className="text-xs text-tertiary">
                      {server.toolCount || server.tools?.length || 0} tools
                      {(server.resources?.length ?? 0) > 0 && ` • ${server.resources.length} resources`}
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

              {server.status === 'connected' && (server.tools?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {server.tools?.map((tool) => (
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
                <p className="text-xs text-[var(--bb-error)] mt-2">{server.error}</p>
              )}
            </div>
          ))}
        </div>
      </CockpitCard>

      {/* Top Tools */}
      <CockpitCard>
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
      </CockpitCard>
    </div>
  );
}
