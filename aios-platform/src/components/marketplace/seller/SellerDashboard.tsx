/**
 * SellerDashboard — Seller overview, listings, and management
 * Story 4.4
 */
import { useState, memo, lazy, Suspense } from 'react';
import {
  Plus, ArrowLeft, DollarSign, Star, Package, TrendingUp,
  Eye, Edit, PauseCircle, PlayCircle, BarChart3,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useSellerListings, useSellerSales, useSellerProfile, useSellerTransactions } from '../../../hooks/useMarketplaceSeller';
import { ListingStatusBadge, PriceBadge, RatingStars, EmptyMarketplace } from '../shared';
import { getIconComponent } from '../../../lib/icons';
import type { MarketplaceListing, SellerDashboardTab } from '../../../types/marketplace';

// --- Tab config ---
const TABS: { key: SellerDashboardTab; label: string; icon: typeof Package }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'listings', label: 'Listings', icon: Package },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'payouts', label: 'Payouts', icon: DollarSign },
];

// --- KPI Card ---
function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof DollarSign }) {
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
    </div>
  );
}

// --- Listing Row ---
const ListingRow = memo(function ListingRow({
  listing,
  onView,
  onEdit,
}: {
  listing: MarketplaceListing;
  onView: (listing: MarketplaceListing) => void;
  onEdit: (listing: MarketplaceListing) => void;
}) {
  const IconComponent = listing.icon ? getIconComponent(listing.icon) : null;

  return (
    <div className="
      flex items-center gap-4 p-3
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
      hover:border-[var(--color-border-default,#333)]/80
      transition-colors
    ">
      {/* Icon */}
      <div className="
        w-10 h-10 flex items-center justify-center shrink-0
        bg-[var(--color-bg-elevated,#1a1a1a)]
        border border-[var(--color-border-default,#333)]
        text-[var(--aiox-lime,#D1FF00)]
      ">
        {IconComponent ? <IconComponent size={18} /> : <Package size={18} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)] truncate">
            {listing.name}
          </h3>
          <ListingStatusBadge status={listing.status} />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <RatingStars value={listing.rating_avg} count={listing.rating_count} size="sm" />
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
            {listing.downloads} downloads
          </span>
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
            {listing.active_hires} ativos
          </span>
        </div>
      </div>

      {/* Price */}
      <PriceBadge
        model={listing.pricing_model}
        amount={listing.price_amount}
        currency={listing.price_currency}
        size="sm"
      />

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onView(listing)}
          className="p-2 text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          title="Ver"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={() => onEdit(listing)}
          className="p-2 text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          title="Editar"
        >
          <Edit size={14} />
        </button>
      </div>
    </div>
  );
});

// --- Helpers ---
function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

// --- Overview Tab ---
function OverviewTab({ sellerId }: { sellerId: string }) {
  const { data: profile } = useSellerProfile(sellerId);
  const { data: sales } = useSellerSales(sellerId);
  const { data: listings } = useSellerListings(sellerId);

  const orders = sales?.data ?? [];
  const allListings = listings?.data ?? [];
  const activeListings = allListings.filter((l) => l.status === 'approved');
  const now = new Date();
  const thisMonthSales = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalRevenue = profile?.total_revenue ?? 0;
  const ratingAvg = profile?.rating_avg ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Revenue Total" value={formatBRL(totalRevenue)} icon={DollarSign} />
        <KpiCard label="Vendas Este Mes" value={String(thisMonthSales.length)} icon={TrendingUp} />
        <KpiCard label="Rating Medio" value={ratingAvg > 0 ? ratingAvg.toFixed(1) : '—'} icon={Star} />
        <KpiCard label="Listings Ativos" value={String(activeListings.length)} icon={Package} />
      </div>

      {/* Recent orders */}
      {orders.length > 0 ? (
        <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
            Vendas Recentes
          </h3>
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-default,#333)] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-[var(--color-text-primary,#fff)] truncate">
                    {order.listing?.name ?? 'Agente'}
                  </span>
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${
                    order.status === 'completed' ? 'text-[var(--status-success,#4ADE80)]'
                    : order.status === 'active' ? 'text-[var(--aiox-lime,#D1FF00)]'
                    : 'text-[var(--color-text-muted,#666)]'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)]">
                  {formatBRL(order.seller_payout)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
          <p className="text-xs font-mono text-[var(--color-text-muted,#666)] text-center py-8">
            Publique seu primeiro agente para ver metricas aqui.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Listings Tab ---
function ListingsTab() {
  const setCurrentView = useUIStore((s) => s.setCurrentView);

  // TODO: Replace with actual seller ID
  const { data, isLoading } = useSellerListings('current-seller');

  const listings = data?.data ?? [];

  const handleView = (listing: MarketplaceListing) => {
    // Navigate to listing detail
    const { selectListing } = require('../../../stores/marketplaceStore').useMarketplaceStore.getState();
    selectListing(listing.id, listing.slug);
    setCurrentView('marketplace-listing' as never);
  };

  const handleEdit = (listing: MarketplaceListing) => {
    // TODO: Open edit wizard with listing data
    console.log('Edit listing:', listing.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyMarketplace
        variant="listings"
        onAction={() => setCurrentView('marketplace-submit' as never)}
      />
    );
  }

  return (
    <div className="space-y-2">
      {listings.map((listing) => (
        <ListingRow
          key={listing.id}
          listing={listing}
          onView={handleView}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
}

// --- Analytics Tab ---
function AnalyticsTab({ sellerId }: { sellerId: string }) {
  const { data: sales } = useSellerSales(sellerId);
  const { data: transactions } = useSellerTransactions(sellerId);
  const { data: listings } = useSellerListings(sellerId);
  const { data: profile } = useSellerProfile(sellerId);

  const orders = sales?.data ?? [];
  const txns = transactions?.data ?? [];
  const allListings = listings?.data ?? [];

  // --- Monthly revenue (last 6 months) ---
  const monthlyRevenue = (() => {
    const months: { label: string; key: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      months.push({ label, key, revenue: 0, count: 0 });
    }
    for (const order of orders) {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find((m) => m.key === key);
      if (month) {
        month.revenue += order.seller_payout;
        month.count += 1;
      }
    }
    return months;
  })();

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  // --- Order status breakdown ---
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-[var(--aiox-lime,#D1FF00)]',
    in_progress: 'bg-[var(--bb-blue,#0099FF)]',
    completed: 'bg-[var(--status-success,#4ADE80)]',
    cancelled: 'bg-[var(--color-text-muted,#666)]',
    disputed: 'bg-[var(--bb-error,#EF4444)]',
    refunded: 'bg-[var(--color-text-muted,#666)]',
    pending: 'bg-[var(--bb-warning,#f59e0b)]',
  };

  // --- Top listings by revenue ---
  const listingRevenue = new Map<string, { name: string; revenue: number; count: number }>();
  for (const order of orders) {
    const name = order.listing?.name ?? 'Desconhecido';
    const lid = order.listing_id;
    const existing = listingRevenue.get(lid) ?? { name, revenue: 0, count: 0 };
    existing.revenue += order.seller_payout;
    existing.count += 1;
    listingRevenue.set(lid, existing);
  }
  const topListings = [...listingRevenue.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxListingRevenue = Math.max(...topListings.map((l) => l.revenue), 1);

  // --- Financial summary ---
  const totalPayouts = txns
    .filter((t) => t.type === 'payout' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalFees = txns
    .filter((t) => t.type === 'platform_fee' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Monthly Revenue Chart */}
      <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-4">
          Receita Mensal (ultimos 6 meses)
        </h3>
        <div className="flex items-end gap-2 h-32">
          {monthlyRevenue.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
                {m.revenue > 0 ? formatBRL(m.revenue) : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '80px' }}>
                <div
                  className="w-full bg-[var(--aiox-lime,#D1FF00)] transition-all"
                  style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)] uppercase">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Status Breakdown */}
        <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
            Status dos Pedidos
          </h3>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(statusCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-2 h-2 shrink-0 ${STATUS_COLORS[status] ?? 'bg-[var(--color-text-muted,#666)]'}`} />
                    <span className="text-xs font-mono text-[var(--color-text-secondary,#999)] uppercase flex-1">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)]">
                      {count}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
                      ({Math.round((count / orders.length) * 100)}%)
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-[var(--color-text-muted,#666)] text-center py-4">
              Nenhum pedido ainda
            </p>
          )}
        </div>

        {/* Financial Summary */}
        <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
            Resumo Financeiro
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">Revenue Total</span>
              <span className="text-sm font-mono font-bold text-[var(--aiox-lime,#D1FF00)]">
                {formatBRL(profile?.total_revenue ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">Payouts Recebidos</span>
              <span className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)]">
                {formatBRL(totalPayouts)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">Comissoes Plataforma</span>
              <span className="text-sm font-mono text-[var(--bb-warning,#f59e0b)]">
                {formatBRL(totalFees)}
              </span>
            </div>
            <div className="h-px bg-[var(--color-border-default,#333)]" />
            <div className="flex justify-between">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">Rating</span>
              <span className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)]">
                {(profile?.rating_avg ?? 0) > 0 ? `${profile!.rating_avg.toFixed(1)} ★` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">Avaliacoes</span>
              <span className="text-sm font-mono text-[var(--color-text-primary,#fff)]">
                {profile?.review_count ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-[var(--color-text-secondary,#999)]">Total Vendas</span>
              <span className="text-sm font-mono text-[var(--color-text-primary,#fff)]">
                {profile?.total_sales ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Listings */}
      <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
          Top Listings por Receita
        </h3>
        {topListings.length > 0 ? (
          <div className="space-y-2">
            {topListings.map((listing, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)] w-4 text-right">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-mono text-[var(--color-text-primary,#fff)] truncate">
                      {listing.name}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--aiox-lime,#D1FF00)] ml-2">
                      {formatBRL(listing.revenue)}
                    </span>
                  </div>
                  <div className="h-1 bg-[var(--color-bg-elevated,#1a1a1a)]">
                    <div
                      className="h-full bg-[var(--aiox-lime,#D1FF00)]"
                      style={{ width: `${(listing.revenue / maxListingRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
                    {listing.count} {listing.count === 1 ? 'venda' : 'vendas'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--color-text-muted,#666)] text-center py-4">
            Nenhuma venda registrada
          </p>
        )}
      </div>

      {/* Listings Performance */}
      {allListings.length > 0 && (
        <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
            Performance dos Listings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted,#666)] border-b border-[var(--color-border-default,#333)]">
                  <th className="text-left py-2 pr-4">Listing</th>
                  <th className="text-right py-2 px-2">Downloads</th>
                  <th className="text-right py-2 px-2">Ativos</th>
                  <th className="text-right py-2 px-2">Rating</th>
                  <th className="text-right py-2 pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {allListings.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-border-default,#333)] last:border-0">
                    <td className="py-2 pr-4 text-[var(--color-text-primary,#fff)] truncate max-w-[140px]">
                      {l.name}
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--color-text-secondary,#999)]">
                      {l.downloads}
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--color-text-secondary,#999)]">
                      {l.active_hires}
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--color-text-secondary,#999)]">
                      {l.rating_avg > 0 ? `${l.rating_avg.toFixed(1)} (${l.rating_count})` : '—'}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <ListingStatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Lazy-loaded Payouts component
const SellerPayouts = lazy(() => import('./SellerPayouts'));

function PayoutsTab() {
  // TODO: Replace with actual seller ID from auth context
  return (
    <Suspense fallback={
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse" />
        ))}
      </div>
    }>
      <SellerPayouts sellerId="current-seller" />
    </Suspense>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<SellerDashboardTab>('overview');
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  // TODO: Replace with actual seller ID from auth context
  const sellerId = 'current-seller';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border-default,#333)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('marketplace' as never)}
              className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
              Seller Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('marketplace-submit' as never)}
            className="
              flex items-center gap-1.5 px-3 py-2 font-mono text-xs uppercase tracking-wider font-semibold
              bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
              hover:bg-[var(--aiox-lime,#D1FF00)]/90
              transition-colors
            "
          >
            <Plus size={12} />
            Novo Agente
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors
                ${activeTab === key
                  ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--aiox-lime,#D1FF00)] border border-[var(--aiox-lime,#D1FF00)]/30 font-semibold'
                  : 'text-[var(--color-text-secondary,#999)] border border-transparent hover:text-[var(--color-text-primary,#fff)]'
                }
              `}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && <OverviewTab sellerId={sellerId} />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'analytics' && <AnalyticsTab sellerId={sellerId} />}
        {activeTab === 'payouts' && <PayoutsTab />}
      </div>
    </div>
  );
}
