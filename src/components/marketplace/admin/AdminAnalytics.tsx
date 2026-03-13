/**
 * AdminAnalytics — Platform-wide marketplace analytics for admins
 * Story 6.3
 */
import { useState } from 'react';
import {
  ArrowLeft, TrendingUp, DollarSign, Package, Users,
  ShoppingCart, AlertTriangle, Star, Clock,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useAdminAnalytics } from '../../../hooks/useMarketplaceAdmin';

// --- Period selector ---
type Period = '7d' | '30d' | '90d' | 'all';
const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 Dias' },
  { key: '30d', label: '30 Dias' },
  { key: '90d', label: '90 Dias' },
  { key: 'all', label: 'Tudo' },
];

// --- KPI Card ---
function AdminKpi({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  trend?: string;
}) {
  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-[var(--aiox-lime,#D1FF00)]" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">
          {label}
        </span>
      </div>
      <p className="text-xl font-mono font-bold text-[var(--color-text-primary,#fff)]">
        {value}
      </p>
      {trend && (
        <p className="text-[10px] font-mono text-[var(--status-success,#4ADE80)] mt-1">
          {trend}
        </p>
      )}
    </div>
  );
}

// --- Top List ---
function TopList({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: string }[];
}) {
  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
      <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs font-mono text-[var(--color-text-muted,#666)] text-center py-4">
          Sem dados
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)] w-4 text-right shrink-0">
                  {i + 1}.
                </span>
                <span className="text-xs font-mono text-[var(--color-text-primary,#fff)] truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-[var(--aiox-lime,#D1FF00)] shrink-0 ml-2">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Rating Distribution ---
function RatingDistribution({ breakdown }: { breakdown: Record<number, number> }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
      <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
        Distribuicao de Ratings
      </h3>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star] ?? 0;
          const pct = (count / total) * 100;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)] w-8 text-right">
                {star}
                <Star size={8} className="inline ml-0.5" />
              </span>
              <div className="flex-1 h-2 bg-[var(--color-bg-elevated,#1a1a1a)]">
                <div
                  className="h-full bg-[var(--aiox-lime,#D1FF00)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)] w-8">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AdminAnalytics() {
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const [period, setPeriod] = useState<Period>('30d');
  const { data, isLoading } = useAdminAnalytics(period);

  const analytics = data ?? {
    gmv: 0,
    commissions: 0,
    activeListings: 0,
    activeSellers: 0,
    activeBuyers: 0,
    conversionRate: 0,
    disputeRate: 0,
    avgReviewTime: 0,
    pendingReviews: 0,
    topListings: [],
    topSellers: [],
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border-default,#333)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('marketplace-review' as never)}
              className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
              Marketplace Analytics
            </h1>
          </div>

          {/* Period selector */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`
                  px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors
                  ${period === p.key
                    ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--aiox-lime,#D1FF00)] border border-[var(--aiox-lime,#D1FF00)]/30'
                    : 'text-[var(--color-text-muted,#666)] border border-transparent hover:text-[var(--color-text-secondary,#999)]'
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* KPIs Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <AdminKpi label="GMV Total" value={formatCurrency(analytics.gmv)} icon={DollarSign} />
              <AdminKpi label="Comissoes" value={formatCurrency(analytics.commissions)} icon={TrendingUp} />
              <AdminKpi label="Listings Ativos" value={String(analytics.activeListings)} icon={Package} />
              <AdminKpi label="Sellers Ativos" value={String(analytics.activeSellers)} icon={Users} />
            </div>

            {/* KPIs Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <AdminKpi label="Buyers Ativos" value={String(analytics.activeBuyers)} icon={ShoppingCart} />
              <AdminKpi
                label="Taxa de Conversao"
                value={`${(analytics.conversionRate * 100).toFixed(1)}%`}
                icon={TrendingUp}
              />
              <AdminKpi
                label="Taxa de Disputas"
                value={`${(analytics.disputeRate * 100).toFixed(1)}%`}
                icon={AlertTriangle}
              />
              <AdminKpi
                label="Review Queue"
                value={`${analytics.pendingReviews} pendentes`}
                icon={Clock}
              />
            </div>

            {/* Top lists + Rating breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <TopList
                title="Top 10 Listings (Revenue)"
                items={analytics.topListings.map((l: { name: string; revenue: number }) => ({
                  name: l.name,
                  value: formatCurrency(l.revenue),
                }))}
              />
              <TopList
                title="Top 10 Sellers (Revenue)"
                items={analytics.topSellers.map((s: { name: string; revenue: number }) => ({
                  name: s.name,
                  value: formatCurrency(s.revenue),
                }))}
              />
              <RatingDistribution breakdown={analytics.ratingBreakdown} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);
}
