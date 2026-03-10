import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bug,
  Lock,
  Database,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { GlassCard, Badge, ProgressBar, SectionLabel, StatusDot, Skeleton } from '../ui';
import { cn } from '../../lib/utils';
import { useQAMetrics, type QAMetricsData } from '../../hooks/useQAMetrics';

// ═══════════════════════════════════════════════════════════════════════════════════
//                              ICON MAP
// ═══════════════════════════════════════════════════════════════════════════════════

const MODULE_ICONS: Record<string, typeof Bug> = {
  'Library Scan': Bug,
  'Security Audit': Lock,
  'Migration Check': Database,
};

// ═══════════════════════════════════════════════════════════════════════════════════
//                              SKELETON STATES
// ═══════════════════════════════════════════════════════════════════════════════════

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} padding="md">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" width="60%" height={12} />
              <Skeleton variant="text" width="40%" height={28} />
            </div>
            <Skeleton variant="circular" width={18} height={18} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <GlassCard padding="md">
      <Skeleton variant="text" width="50%" height={14} />
      <div className="flex items-end justify-between gap-3 h-36 mt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <Skeleton variant="text" width="100%" height={`${30 + Math.random() * 60}%`} />
            <Skeleton variant="text" width="80%" height={10} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ModulesSkeleton() {
  return (
    <GlassCard padding="md">
      <Skeleton variant="text" width="50%" height={14} />
      <div className="space-y-3 mt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-subtle rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="40%" height={14} />
              <Skeleton variant="rounded" width={80} height={20} />
            </div>
            <Skeleton variant="text" width="80%" height={12} />
            <Skeleton variant="text" width="30%" height={10} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════════════

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <GlassCard padding="md" className="border border-red-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Failed to load metrics</p>
            <p className="text-xs text-tertiary mt-0.5">{message}</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            'glass-subtle hover:bg-white/10 text-secondary hover:text-primary transition-colors'
          )}
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              DATA SOURCE BADGE
// ═══════════════════════════════════════════════════════════════════════════════════

function DataSourceBadge({ source }: { source: QAMetricsData['source'] }) {
  if (source === 'live') {
    return (
      <Badge variant="status" status="success" size="sm">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant="status" status="warning" size="sm">
      DEMO
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════

export default function QAMetrics() {
  const { data, loading, error, refetch } = useQAMetrics();

  const overview = [
    { label: 'Total Reviews', value: String(data.overview.totalReviews), icon: Shield, color: 'text-blue-400' },
    { label: 'Pass Rate', value: `${data.overview.passRate}%`, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Avg Review Time', value: data.overview.avgReviewTime, icon: Clock, color: 'text-cyan-400' },
    { label: 'Critical Issues', value: String(data.overview.criticalIssues), icon: AlertTriangle, color: 'text-red-400' },
  ];

  const maxDaily = Math.max(...data.dailyTrend.map((d) => d.passed + d.failed), 1);

  const healthStatus = data.overview.passRate >= 80 ? 'success' : data.overview.passRate >= 60 ? 'warning' : 'error';
  const healthLabel = data.overview.passRate >= 80 ? 'Healthy' : data.overview.passRate >= 60 ? 'Warning' : 'Critical';

  return (
    <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-6" tabIndex={0} role="region" aria-label="Metricas de qualidade">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-green-400" />
        <h1 className="text-xl font-semibold text-primary">QA Metrics</h1>
        <Badge variant="status" status={healthStatus} size="sm">{healthLabel}</Badge>
        <DataSourceBadge source={data.source} />
        <button
          onClick={refetch}
          className={cn(
            'ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs',
            'glass-subtle hover:bg-white/10 text-secondary hover:text-primary transition-colors',
            loading && 'opacity-50 pointer-events-none'
          )}
          disabled={loading}
          aria-label="Refresh metrics"
        >
          <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Overview Cards */}
      {loading && !error ? (
        <OverviewSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overview.map((metric, i) => (
            <GlassCard key={metric.label} padding="md" motionProps={{ transition: { delay: i * 0.05 } }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wider">{metric.label}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{metric.value}</p>
                </div>
                <metric.icon size={18} className={metric.color} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Daily Trend + Validation Modules */}
      {loading && !error ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ModulesSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Trend */}
          <GlassCard padding="md">
            <SectionLabel>Daily Trend (Last 7 Days)</SectionLabel>
            <div className="flex items-end justify-between gap-3 h-36 mt-4">
              {data.dailyTrend.map((day) => {
                const total = day.passed + day.failed;
                const passedH = (day.passed / maxDaily) * 100;
                const failedH = (day.failed / maxDaily) * 100;
                return (
                  <div key={day.day} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-tertiary">{total}</span>
                    <div className="w-full flex flex-col-reverse gap-px" style={{ height: `${((total) / maxDaily) * 100}%`, minHeight: 4 }}>
                      <motion.div
                        className="w-full bg-green-500/70 rounded-b-md"
                        initial={{ height: 0 }}
                        animate={{ height: `${passedH / (passedH + failedH || 1) * 100}%` }}
                        transition={{ duration: 0.4 }}
                        style={{ minHeight: day.passed > 0 ? 2 : 0 }}
                      />
                      {day.failed > 0 && (
                        <motion.div
                          className="w-full bg-red-500/70 rounded-t-md"
                          initial={{ height: 0 }}
                          animate={{ height: `${failedH / (passedH + failedH || 1) * 100}%` }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          style={{ minHeight: 2 }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-secondary">{day.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-500/70" />
                <span className="text-[10px] text-secondary">Passed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />
                <span className="text-[10px] text-secondary">Failed</span>
              </div>
            </div>
          </GlassCard>

          {/* Validation Modules */}
          <GlassCard padding="md">
            <SectionLabel count={data.validationModules.length}>Validation Modules</SectionLabel>
            <div className="space-y-3">
              {data.validationModules.map((mod) => {
                const ModIcon = MODULE_ICONS[mod.name] || Bug;
                return (
                  <div key={mod.name} className="glass-subtle rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ModIcon size={16} className="text-secondary" />
                        <span className="text-sm font-medium text-primary">{mod.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusDot status={mod.status} size="sm" />
                        <Badge
                          variant="status"
                          status={mod.status === 'success' ? 'success' : mod.status === 'error' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {mod.findings} findings
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-tertiary mt-1.5">{mod.description}</p>
                    <p className="text-[10px] text-tertiary mt-1">Last run: {mod.lastRun}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Learning System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pattern Feedback */}
        <GlassCard padding="md">
          <SectionLabel>Pattern Feedback</SectionLabel>
          {loading && !error ? (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-6">
                <Skeleton variant="text" width={80} height={24} />
                <Skeleton variant="text" width={80} height={24} />
              </div>
              <Skeleton variant="rounded" width="100%" height={8} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <ThumbsUp size={18} className="text-green-400" />
                  <div>
                    <p className="text-xl font-bold text-primary">{data.patternFeedback.accepted}</p>
                    <p className="text-xs text-secondary">Accepted</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown size={18} className="text-red-400" />
                  <div>
                    <p className="text-xl font-bold text-primary">{data.patternFeedback.rejected}</p>
                    <p className="text-xs text-secondary">Rejected</p>
                  </div>
                </div>
              </div>
              <ProgressBar
                value={
                  data.patternFeedback.accepted + data.patternFeedback.rejected > 0
                    ? (data.patternFeedback.accepted / (data.patternFeedback.accepted + data.patternFeedback.rejected)) * 100
                    : 0
                }
                variant="success"
                size="md"
                label="Acceptance Rate"
                showLabel
                className="mt-4"
              />
            </>
          )}
        </GlassCard>

        {/* Gotchas Registry */}
        <GlassCard padding="md">
          <SectionLabel count={data.gotchasRegistry.total}>Gotchas Registry</SectionLabel>
          {loading && !error ? (
            <div className="space-y-2 mt-3">
              <Skeleton variant="text" width="50%" height={14} />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width="100%" height={32} />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen size={16} className="text-yellow-400" />
                <span className="text-sm text-secondary">{data.gotchasRegistry.total} gotchas documented</span>
              </div>
              <div className="mt-3 space-y-2">
                {data.gotchasRegistry.recent.length > 0 ? (
                  <>
                    <p className="text-[10px] text-tertiary uppercase tracking-wider">Recent Additions</p>
                    {data.gotchasRegistry.recent.map((g) => (
                      <div key={g} className="flex items-center gap-2 glass-subtle rounded-lg px-3 py-2">
                        <AlertTriangle size={12} className="text-yellow-400 flex-shrink-0" />
                        <span className="text-xs text-primary truncate">{g}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-xs text-tertiary mt-2">No gotchas recorded yet</p>
                )}
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
