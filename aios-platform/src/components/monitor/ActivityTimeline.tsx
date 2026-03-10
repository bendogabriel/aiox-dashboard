import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Terminal,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '../ui';
import { useMonitorStore, type MonitorEvent } from '../../stores/monitorStore';
import { useExecutionHistory } from '../../hooks/useExecute';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { cn } from '../../lib/utils';

type ActivityType = 'execution' | 'tool_call' | 'message' | 'error' | 'system';

interface TimelineItem {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'pending';
  agent?: string;
}

const typeConfig: Record<ActivityType, { icon: typeof Activity; color: string }> = {
  execution: { icon: CheckCircle, color: 'text-green-400' },
  tool_call: { icon: Terminal, color: 'text-blue-400' },
  message: { icon: MessageSquare, color: 'text-cyan-400' },
  error: { icon: AlertTriangle, color: 'text-red-400' },
  system: { icon: Activity, color: 'text-purple-400' },
};

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ActivityTimeline({ viewToggle }: { viewToggle?: React.ReactNode }) {
  const monitorEvents = useMonitorStore((s) => s.events);
  const { data: historyData } = useExecutionHistory(50);
  const { data: activityData, isLoading: isActivityLoading } = useActivityFeed(50);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');

  const items = useMemo(() => {
    const timeline: TimelineItem[] = [];
    const seenIds = new Set<string>();

    // Add monitor events (live WebSocket)
    monitorEvents.forEach((e: MonitorEvent) => {
      const id = e.id;
      if (seenIds.has(id)) return;
      seenIds.add(id);

      timeline.push({
        id,
        timestamp: e.timestamp,
        type: e.type === 'tool_call' ? 'tool_call' : e.type === 'message' ? 'message' : e.type === 'error' ? 'error' : 'system',
        title: e.description,
        agent: e.agent,
        status: e.success === false ? 'error' : e.success === true ? 'success' : undefined,
      });
    });

    // Add execution history from API
    if (historyData?.executions) {
      historyData.executions.slice(0, 30).forEach((e) => {
        const id = `exec-${e.id}`;
        if (seenIds.has(id)) return;
        seenIds.add(id);

        timeline.push({
          id,
          timestamp: e.createdAt || new Date().toISOString(),
          type: e.status === 'failed' ? 'error' : 'execution',
          title: `${e.agentId || 'Execution'} — ${e.status}`,
          description: e.agentId ? `Agent: ${e.agentId}` : undefined,
          agent: e.agentId || undefined,
          status: e.status === 'completed' ? 'success' : e.status === 'failed' ? 'error' : 'pending',
        });
      });
    }

    // Add activity feed events from AIOS logs
    if (activityData?.events) {
      for (const e of activityData.events) {
        if (seenIds.has(e.id)) continue;
        seenIds.add(e.id);

        timeline.push({
          id: e.id,
          timestamp: e.timestamp,
          type: e.type as ActivityType,
          title: e.title,
          description: e.description,
          agent: e.agent,
          status: e.status as TimelineItem['status'],
        });
      }
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return timeline;
  }, [monitorEvents, historyData, activityData]);

  const hasRealData = items.length > 0;
  const filtered = filterType === 'all' ? items : items.filter((i) => i.type === filterType);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    filtered.forEach((item) => {
      const date = new Date(item.timestamp);
      const today = new Date();
      let label: string;
      if (date.toDateString() === today.toDateString()) {
        label = 'Hoje';
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        label = date.toDateString() === yesterday.toDateString()
          ? 'Ontem'
          : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={22} className="text-blue-400" />
          <h1 className="text-xl font-semibold text-primary">Monitor</h1>
          {viewToggle}
          <span className="text-xs text-tertiary">({items.length} eventos)</span>
          {isActivityLoading && (
            <Loader2 size={14} className="text-tertiary animate-spin" />
          )}
          {!hasRealData && !isActivityLoading && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
              No data
            </span>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'execution', 'tool_call', 'message', 'error', 'system'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filterType === type
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-tertiary hover:text-primary border border-transparent'
            )}
          >
            {type === 'all' ? 'Todos' : type === 'tool_call' ? 'Tools' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {Object.keys(grouped).length === 0 ? (
        <GlassCard padding="md">
          <div className="text-center py-12 text-tertiary">
            <Clock size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma atividade registrada</p>
            <p className="text-xs mt-1">Eventos aparecerão aqui conforme o sistema opera</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dateItems]) => (
            <div key={dateLabel}>
              <div className="text-[10px] text-tertiary uppercase tracking-wider mb-3 px-1">{dateLabel}</div>
              <div className="relative pl-6 border-l border-glass-border space-y-1">
                {dateItems.map((item, idx) => {
                  const config = typeConfig[item.type];
                  const Icon = config.icon;
                  const StatusIcon = item.status === 'error' ? XCircle : item.status === 'success' ? CheckCircle : Clock;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="relative flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute -left-[31px] top-3 w-3 h-3 rounded-full border-2 border-[var(--color-background)]',
                          item.status === 'error' ? 'bg-red-400' : item.status === 'success' ? 'bg-green-400' : 'bg-white/30'
                        )}
                      />

                      <Icon size={14} className={cn('mt-0.5 flex-shrink-0', config.color)} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.agent && <span className="text-[10px] text-secondary">{item.agent}</span>}
                          <span className="text-[10px] text-tertiary">{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>

                      {item.status && (
                        <StatusIcon
                          size={12}
                          className={cn(
                            'flex-shrink-0 mt-1',
                            item.status === 'error' ? 'text-red-400' : item.status === 'success' ? 'text-green-400' : 'text-tertiary'
                          )}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
