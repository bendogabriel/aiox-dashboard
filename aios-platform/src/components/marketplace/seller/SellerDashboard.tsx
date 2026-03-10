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
import { useSellerListings, useSellerSales } from '../../../hooks/useMarketplaceSeller';
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

// --- Overview Tab ---
function OverviewTab() {
  // TODO: Replace with actual seller data from hooks
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Revenue Total" value="R$ 0,00" icon={DollarSign} />
        <KpiCard label="Vendas Este Mes" value="0" icon={TrendingUp} />
        <KpiCard label="Rating Medio" value="—" icon={Star} />
        <KpiCard label="Listings Ativos" value="0" icon={Package} />
      </div>

      <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
        <p className="text-xs font-mono text-[var(--color-text-muted,#666)] text-center py-8">
          Publique seu primeiro agente para ver metricas aqui.
        </p>
      </div>
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

// --- Placeholder tabs ---
function AnalyticsTab() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="font-mono text-sm text-[var(--color-text-muted,#666)] uppercase tracking-wider">
        Analytics — Em breve
      </p>
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'payouts' && <PayoutsTab />}
      </div>
    </div>
  );
}
