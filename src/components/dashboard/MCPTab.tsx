import { motion } from 'framer-motion';
import { Monitor as MonitorIcon, Link, Wrench, Zap } from 'lucide-react';
import { GlassCard, Badge, EmptyState } from '../ui';
import { useMCPStatus, useMCPStats } from '../../hooks/useDashboard';
import { cn } from '../../lib/utils';
import { BarChart } from './Charts';
import { QuickStatCard } from './DashboardHelpers';
import { PlugIcon } from './dashboard-icons';

export function MCPTab() {
  const { data: mcpServers, isLoading, isError } = useMCPStatus();
  const { data: mcpStats } = useMCPStats();

  // Show empty state when Engine is offline or no data
  if (!isLoading && (!mcpServers || mcpServers.length === 0 || isError)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6 pb-6"
      >
        <EmptyState
          type="offline"
          title="Engine not connected"
          description="Start the Engine to see MCP server data. Run: node engine/index.js"
        />
      </motion.div>
    );
  }

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
                      {server.resources.length > 0 && ` \u2022 ${server.resources.length} resources`}
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
