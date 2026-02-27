import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Timer,
} from 'lucide-react';
import { GlassCard, Badge, ProgressBar, SectionLabel } from '../ui';
import { cn } from '../../lib/utils';

// --- Mock Data ---

const keyMetrics = [
  {
    label: 'Velocity',
    value: '12',
    unit: 'stories/week',
    trend: 'up' as const,
    trendValue: '+18%',
    icon: Zap,
    color: 'text-blue-400',
  },
  {
    label: 'Cycle Time',
    value: '2.3',
    unit: 'hours avg',
    trend: 'down' as const,
    trendValue: '-12%',
    icon: Timer,
    color: 'text-green-400',
  },
  {
    label: 'Error Rate',
    value: '4.2',
    unit: '%',
    trend: 'up' as const,
    trendValue: '+0.8%',
    icon: AlertTriangle,
    color: 'text-yellow-400',
    sparkline: [2, 3, 4, 3, 5, 4, 4],
  },
  {
    label: 'Completed',
    value: '47',
    unit: 'stories this month',
    trend: 'up' as const,
    trendValue: '+23%',
    icon: CheckCircle,
    color: 'text-emerald-400',
  },
];

const agentPerformance = [
  { name: 'Dex (Dev)', stories: 18, hours: 42, successRate: 96 },
  { name: 'Quinn (QA)', stories: 15, hours: 28, successRate: 98 },
  { name: 'Atlas (Architect)', stories: 8, hours: 16, successRate: 100 },
  { name: 'River (SM)', stories: 12, hours: 20, successRate: 94 },
  { name: 'Sage (PO)', stories: 10, hours: 22, successRate: 97 },
  { name: 'Gage (DevOps)', stories: 6, hours: 14, successRate: 100 },
  { name: 'Aria (Analyst)', stories: 5, hours: 10, successRate: 92 },
];

const weeklyActivity = [
  { day: 'Mon', count: 8 },
  { day: 'Tue', count: 12 },
  { day: 'Wed', count: 6 },
  { day: 'Thu', count: 14 },
  { day: 'Fri', count: 10 },
  { day: 'Sat', count: 3 },
  { day: 'Sun', count: 1 },
];

const bottlenecks = [
  { status: 'In Review', count: 7, avgTime: '4.5h' },
  { status: 'Blocked', count: 3, avgTime: '12.2h' },
  { status: 'QA Validation', count: 4, avgTime: '2.1h' },
];

const maxWeekly = Math.max(...weeklyActivity.map((d) => d.count));

// --- Component ---

export default function InsightsView() {
  return (
    <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-6" tabIndex={0} role="region" aria-label="Painel de insights">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 size={22} className="text-blue-400" />
        <h1 className="text-xl font-semibold text-primary">Insights</h1>
        <Badge variant="status" status="success" size="sm">Live</Badge>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, i) => (
          <GlassCard key={metric.label} padding="md" motionProps={{ transition: { delay: i * 0.05 } }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-secondary uppercase tracking-wider">{metric.label}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-primary">{metric.value}</span>
                  <span className="text-xs text-tertiary">{metric.unit}</span>
                </div>
              </div>
              <metric.icon size={18} className={metric.color} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {metric.trend === 'up' ? (
                <TrendingUp size={14} className={metric.label === 'Error Rate' ? 'text-red-400' : 'text-green-400'} />
              ) : (
                <TrendingDown size={14} className="text-green-400" />
              )}
              <span className={cn(
                'text-xs font-medium',
                metric.label === 'Error Rate' && metric.trend === 'up' ? 'text-red-400' : 'text-green-400',
              )}>
                {metric.trendValue}
              </span>
              {metric.sparkline && (
                <div className="flex items-end gap-px ml-auto h-4">
                  {metric.sparkline.map((v, j) => (
                    <div
                      key={j}
                      className="w-1 bg-yellow-400/60 rounded-full"
                      style={{ height: `${(v / Math.max(...metric.sparkline!)) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Agent Performance + Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Performance (2 cols) */}
        <GlassCard padding="md" className="lg:col-span-2">
          <SectionLabel count={agentPerformance.length}>Agent Performance</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agentPerformance.map((agent) => (
              <div key={agent.name} className="glass-subtle rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{agent.name}</span>
                  <Badge variant="status" status="success" size="sm">
                    {agent.successRate}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-secondary">
                  <span>{agent.stories} stories</span>
                  <span>{agent.hours}h worked</span>
                </div>
                <ProgressBar
                  value={agent.successRate}
                  size="sm"
                  variant={agent.successRate >= 96 ? 'success' : agent.successRate >= 90 ? 'warning' : 'error'}
                />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Weekly Activity */}
        <GlassCard padding="md">
          <SectionLabel>Weekly Activity</SectionLabel>
          <div className="flex items-end justify-between gap-2 h-40 mt-4">
            {weeklyActivity.map((day) => (
              <div key={day.day} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] text-tertiary mb-1">{day.count}</span>
                <motion.div
                  className="w-full bg-blue-500/60 rounded-t-md"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.count / maxWeekly) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{ minHeight: 4 }}
                />
                <span className="text-[10px] text-secondary">{day.day}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottlenecks */}
      <GlassCard padding="md">
        <SectionLabel count={bottlenecks.length}>
          Bottlenecks
        </SectionLabel>
        <div className="space-y-3">
          {bottlenecks.map((b) => (
            <div key={b.status} className="flex items-center justify-between glass-subtle rounded-xl p-3">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-primary">{b.status}</p>
                  <p className="text-xs text-secondary">{b.count} stories stuck</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-tertiary" />
                <span className="text-sm text-secondary">avg {b.avgTime}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
