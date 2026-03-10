/**
 * MyPurchases — Buyer's order management dashboard
 * Story 3.3
 */
import { useState, memo, lazy, Suspense } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Zap,
  MessageSquare, ArrowLeft, Loader2, Package,
} from 'lucide-react';
import { useMyPurchases } from '../../../hooks/useMarketplaceListing';
import { useUIStore } from '../../../stores/uiStore';
import { useMarketplaceStore } from '../../../stores/marketplaceStore';
import { PriceBadge, EmptyMarketplace, SellerBadge, EscrowBadge } from '../shared';
import { getIconComponent } from '../../../lib/icons';
import { Star } from 'lucide-react';
import type { MarketplaceOrder, OrderStatus } from '../../../types/marketplace';

const ReviewFormLazy = lazy(() => import('../reviews/ReviewForm'));

// --- Tab types ---
type OrderTab = 'active' | 'completed' | 'all';

const TABS: { key: OrderTab; label: string }[] = [
  { key: 'active', label: 'Ativos' },
  { key: 'completed', label: 'Concluidos' },
  { key: 'all', label: 'Todos' },
];

// --- Status configuration ---
const STATUS_CONFIG: Record<OrderStatus, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Pendente', color: 'text-[var(--bb-warning,#f59e0b)]' },
  active: { icon: Zap, label: 'Ativo', color: 'text-[var(--aiox-lime,#D1FF00)]' },
  in_progress: { icon: Loader2, label: 'Em Progresso', color: 'text-[var(--bb-blue,#0099FF)]' },
  completed: { icon: CheckCircle, label: 'Concluido', color: 'text-[var(--status-success,#4ADE80)]' },
  cancelled: { icon: XCircle, label: 'Cancelado', color: 'text-[var(--color-text-muted,#666)]' },
  disputed: { icon: AlertTriangle, label: 'Disputado', color: 'text-[var(--bb-error,#EF4444)]' },
  refunded: { icon: XCircle, label: 'Reembolsado', color: 'text-[var(--color-text-muted,#666)]' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider ${config.color}`}>
      <Icon size={10} className={status === 'in_progress' ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}

// --- Order type labels ---
const ORDER_TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  hourly: 'Por Hora',
  subscription: 'Assinatura',
  credits: 'Creditos',
  free: 'Gratis',
};

// --- Order Card ---
const OrderCard = memo(function OrderCard({
  order,
  onSelect,
  onUseAgent,
  onReview,
}: {
  order: MarketplaceOrder;
  onSelect: (order: MarketplaceOrder) => void;
  onUseAgent: (order: MarketplaceOrder) => void;
  onReview?: (order: MarketplaceOrder) => void;
}) {
  const listing = order.listing;
  const IconComponent = listing?.icon ? getIconComponent(listing.icon) : null;
  const isActive = order.status === 'active' || order.status === 'in_progress';

  return (
    <div className="
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
      hover:border-[var(--color-border-default,#333)]/80
      transition-colors
    ">
      <button
        type="button"
        onClick={() => onSelect(order)}
        className="w-full text-left p-4 focus:outline-none"
      >
        <div className="flex items-start gap-3">
          {/* Agent icon */}
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
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)] truncate">
                {listing?.name ?? 'Agente'}
              </h3>
              <StatusBadge status={order.status} />
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">
                {ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}
              </span>
              {order.seller && (
                <>
                  <span className="text-[var(--color-text-muted,#666)]">·</span>
                  <span className="text-xs text-[var(--color-text-secondary,#999)]">
                    {order.seller.display_name}
                  </span>
                </>
              )}
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-4 mt-2">
              {order.order_type === 'hourly' && order.hours_contracted && (
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted,#666)] mb-0.5">
                    <span>{order.hours_used}h usadas</span>
                    <span>{order.hours_contracted}h</span>
                  </div>
                  <div className="h-1 bg-[var(--color-bg-elevated,#1a1a1a)]">
                    <div
                      className="h-full bg-[var(--aiox-lime,#D1FF00)]"
                      style={{ width: `${Math.min((order.hours_used / order.hours_contracted) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {order.order_type === 'subscription' && order.subscription_end && (
                <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
                  {order.auto_renew ? 'Renova' : 'Expira'} em{' '}
                  {new Date(order.subscription_end).toLocaleDateString('pt-BR')}
                </span>
              )}
              {order.order_type === 'credits' && order.credits_remaining != null && (
                <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
                  {order.credits_remaining}/{order.credits_purchased} creditos restantes
                </span>
              )}
            </div>

            {/* Escrow status */}
            {order.escrow_status && order.escrow_status !== 'none' && (
              <div className="mt-2">
                <EscrowBadge status={order.escrow_status} releaseAt={order.escrow_release_at} />
              </div>
            )}

            {/* Footer: price + date */}
            <div className="flex items-center justify-between mt-2">
              <PriceBadge
                model={listing?.pricing_model ?? 'free'}
                amount={order.subtotal}
                currency={order.currency}
                size="sm"
              />
              <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
                {new Date(order.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Action bar for active orders */}
      {isActive && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => onUseAgent(order)}
            className="
              w-full py-2 font-mono text-xs uppercase tracking-wider
              border border-[var(--aiox-lime,#D1FF00)]/30
              text-[var(--aiox-lime,#D1FF00)]
              hover:bg-[var(--aiox-lime,#D1FF00)]/5
              transition-colors flex items-center justify-center gap-1.5
            "
          >
            <MessageSquare size={12} />
            Usar Agente
          </button>
        </div>
      )}
      {/* Review button for completed orders */}
      {order.status === 'completed' && onReview && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => onReview(order)}
            className="
              w-full py-2 font-mono text-xs uppercase tracking-wider
              border border-[var(--bb-warning,#f59e0b)]/30
              text-[var(--bb-warning,#f59e0b)]
              hover:bg-[var(--bb-warning,#f59e0b)]/5
              transition-colors flex items-center justify-center gap-1.5
            "
          >
            <Star size={12} />
            Avaliar
          </button>
        </div>
      )}
    </div>
  );
});

// ==========================================================
// MAIN COMPONENT
// ==========================================================
export default function MyPurchases() {
  const [activeTab, setActiveTab] = useState<OrderTab>('active');
  const [reviewingOrder, setReviewingOrder] = useState<MarketplaceOrder | null>(null);
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const selectListing = useMarketplaceStore((s) => s.selectListing);

  // TODO: Replace with actual buyer ID from auth context
  const buyerId = 'current-user';

  const statusFilter = activeTab === 'active'
    ? 'active'
    : activeTab === 'completed'
      ? 'completed'
      : undefined;

  const { data, isLoading } = useMyPurchases(buyerId, { status: statusFilter });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleSelectOrder = (order: MarketplaceOrder) => {
    // TODO: Open OrderDetail view
    console.log('Select order:', order.id);
  };

  const handleUseAgent = (order: MarketplaceOrder) => {
    // Navigate to chat with the marketplace agent
    if (order.agent_instance_id) {
      setCurrentView('chat' as never);
    }
  };

  const handleViewListing = (order: MarketplaceOrder) => {
    if (order.listing) {
      selectListing(order.listing.id, order.listing.slug);
      setCurrentView('marketplace-listing' as never);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border-default,#333)]">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => setCurrentView('marketplace' as never)}
            className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
            Minhas Compras
          </h1>
          {total > 0 && (
            <span className="text-xs font-mono text-[var(--color-text-muted,#666)]">({total})</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors
                ${activeTab === tab.key
                  ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--aiox-lime,#D1FF00)] border border-[var(--aiox-lime,#D1FF00)]/30 font-semibold'
                  : 'text-[var(--color-text-secondary,#999)] border border-transparent hover:text-[var(--color-text-primary,#fff)]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyMarketplace
            variant="purchases"
            onAction={() => setCurrentView('marketplace' as never)}
          />
        ) : (
          <div className="space-y-3">
            {/* Review form (inline) */}
            {reviewingOrder && (
              <div className="mb-4">
                <Suspense fallback={<div className="h-32 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse" />}>
                  <ReviewFormLazy
                    order={reviewingOrder}
                    onSubmit={(data) => {
                      console.log('Review submitted:', data);
                      setReviewingOrder(null);
                    }}
                    onCancel={() => setReviewingOrder(null)}
                  />
                </Suspense>
              </div>
            )}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={handleSelectOrder}
                onUseAgent={handleUseAgent}
                onReview={(o) => setReviewingOrder(o)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
